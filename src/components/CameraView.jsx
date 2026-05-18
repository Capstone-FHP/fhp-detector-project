import { useState, useRef, useEffect } from 'react';
import { useFhpDetector } from '../hooks/useFhpDetector';
import { savePostureSession } from '../services/fhpApi';
import PostureResultModal from './PostureResultModal';

// 💡 외부 파일 없이 브라우저 자체 기능으로 비프(Beep) 소리를 내는 함수
const playBeepSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 위험일 때는 더 높고 날카로운 소리, 주의일 때는 부드러운 소리
        osc.type = type === 'danger' ? 'square' : 'sine';
        osc.frequency.setValueAtTime(type === 'danger' ? 880 : 600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // 볼륨 조절 (0.1 = 10%)

        osc.start();
        osc.stop(ctx.currentTime + 0.2); // 0.2초 동안 짧게 삐-
    } catch (error) {
        console.error("소리 재생 실패:", error);
    }
};

export default function CameraView({ fhpState, setFhpState, user, setScreen }) {
    const [isPipMode, setIsPipMode] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    const pipContainerRef = useRef(null);
    const handlersRef = useRef({});

    const localStatsRef = useRef({ totalSeconds: 0, warningSeconds: 0, dangerSeconds: 0 });
    const lastNotificationTime = useRef(0);
    const currentStateRef = useRef(fhpState);

    // 실시간 상태를 타이머 루프 내에서 안전하게 참조하기 위해 ref 업데이트
    useEffect(() => {
        currentStateRef.current = fhpState;
    }, [fhpState]);

    const {
        isMeasuring, isAiLoaded, calibrationData, videoRef, canvasRef,
        startMeasurement, stopMeasurement, calibrate
    } = useFhpDetector(setFhpState);

    const isCalibrated = !!calibrationData;

    // 💡 시간 누적 타이머 및 경고 알림 주기 수정 (20초 간격)
    useEffect(() => {
        if (!isMeasuring || !currentSessionId || !isCalibrated) return;

        const timer = setInterval(() => {
            // 1. 시간 통계 누적 (1초마다)
            localStatsRef.current.totalSeconds += 1;
            const currentState = currentStateRef.current;

            if (currentState === 'warning') localStatsRef.current.warningSeconds += 1;
            else if (currentState === 'danger') localStatsRef.current.dangerSeconds += 1;

            // 💡 2. 20초 주기 연속 알림 로직 (OS 차단 우회 및 UX 최적화)
            if (currentState === 'warning' || currentState === 'danger') {
                const now = Date.now();
                // 20000(20초) 이상 지났을 때만 알림 발생!
                if (now - lastNotificationTime.current >= 20000) {

                    // 🔊 소리는 시스템 차단이 없으므로 20초마다 100% 정확하게 울립니다.
                    playBeepSound(currentState);

                    // 🚨 데스크톱 푸시 알림 발송
                    if ("Notification" in window && Notification.permission === "granted") {
                        const notification = new Notification(
                            currentState === 'danger' ? "🚨 경추 위험" : "⚠️ 주의 요망",
                            {
                                body: currentState === 'danger' ? "자세가 크게 무너졌습니다! 즉시 교정하세요." : "목이 앞으로 나왔거나 고개를 숙였습니다.",
                                tag: `fhp-alert-${now}`, // 고유 타임스탬프 태그
                                renotify: true
                            }
                        );
                        // 알림창이 뜬 뒤 4초 후에 자동으로 닫히도록 설정
                        setTimeout(() => notification.close(), 4000);
                        lastNotificationTime.current = now; // 알림 발송 시간 갱신
                    }
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isMeasuring, currentSessionId, isCalibrated]);

    const handleStartMeasurement = () => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        setCurrentSessionId(`session_${Date.now()}`);
        localStatsRef.current = { totalSeconds: 0, warningSeconds: 0, dangerSeconds: 0 };
        lastNotificationTime.current = 0;
        startMeasurement();
    };

    const handleStopMeasurement = async () => {
        if (window.documentPictureInPicture?.window) {
            window.documentPictureInPicture.window.close();
        }

        if (localStatsRef.current.totalSeconds === 0) {
            alert("측정된 시간이 없어 리포트가 저장되지 않았습니다.");
            stopMeasurement();
            setCurrentSessionId(null);
            return;
        }

        stopMeasurement();

        const warningPenalty = localStatsRef.current.warningSeconds * 0.5;
        const dangerPenalty = localStatsRef.current.dangerSeconds * 1.5;
        const score = Math.max(0, Math.round(100 - warningPenalty - dangerPenalty));

        const sessionData = {
            userId: user?.uid,
            sessionId: currentSessionId,
            score: score,
            totalSeconds: localStatsRef.current.totalSeconds,
            warningSeconds: localStatsRef.current.warningSeconds,
            dangerSeconds: localStatsRef.current.dangerSeconds,
            createdAt: new Date().toISOString()
        };

        if (user) await savePostureSession(sessionData);

        setSummaryData({ ...localStatsRef.current, score });
        setShowResultModal(true);
        setCurrentSessionId(null);
    };

    useEffect(() => { handlersRef.current = { calibrate, handleStopMeasurement }; });

    const toggleDocumentPIP = async () => {
        if (isPipMode) { window.documentPictureInPicture?.window?.close(); return; }
        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 400, height: 300 });
            [...document.styleSheets].forEach(s => {
                try {
                    const rules = [...s.cssRules].map(r => r.cssText).join('');
                    const st = document.createElement('style'); st.textContent = rules;
                    pipWindow.document.head.append(st);
                } catch (e) {
                    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href;
                    pipWindow.document.head.append(l);
                }
            });

            pipWindow.document.body.className = "bg-slate-900 m-0 overflow-hidden";

            const placeholder = document.createElement('div');
            placeholder.id = 'pip-safe-placeholder';
            pipContainerRef.current.parentNode.insertBefore(placeholder, pipContainerRef.current);

            pipWindow.document.body.append(pipContainerRef.current);
            setIsPipMode(true);

            pipWindow.document.addEventListener('click', (e) => {
                if (e.target.closest('#pip-return-btn')) pipWindow.close();
            });

            pipWindow.addEventListener("pagehide", () => {
                setIsPipMode(false);
                const ph = document.getElementById('pip-safe-placeholder');
                if (ph && pipContainerRef.current) {
                    ph.parentNode.replaceChild(pipContainerRef.current, ph);
                }
            });
        } catch (error) { console.error("PIP 실패:", error); }
    };

    const frameStyle = fhpState === 'danger' ? "ring-4 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]" : fhpState === 'warning' ? "ring-4 ring-orange-400 shadow-[0_0_50px_rgba(249,115,22,0.5)]" : "ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-xl";

    return (
        <div id="camera-wrapper" className="flex flex-col items-center w-full h-full min-h-0 relative">

            {!isMeasuring && (
                <button
                    onClick={() => setScreen('home')}
                    className="absolute top-6 left-6 z-20 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl text-white font-bold backdrop-blur-md transition shadow-md"
                >
                    ← 홈으로 돌아가기
                </button>
            )}

            <PostureResultModal
                isOpen={showResultModal}
                onClose={() => {
                    setShowResultModal(false);
                    if (setScreen) setScreen('home');
                }}
                summaryData={summaryData}
            />

            <div ref={pipContainerRef} className={`transition-all duration-300 relative w-full h-full min-h-0 
                ${isPipMode ? 'flex items-center justify-center bg-black' : 'max-w-[1600px] flex flex-col lg:flex-row gap-4 lg:gap-6 p-6'}`}>

                <div className={`relative overflow-hidden bg-slate-900 transition-all duration-500 flex items-center justify-center
                    ${isPipMode ? 'w-full h-full' : 'flex-1 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-800'}
                    ${isMeasuring && !isPipMode ? frameStyle : ''}`}>

                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] block" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] block" />

                    {isPipMode && isMeasuring && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 transition-all">
                            <div className={`px-4 py-1.5 rounded-full font-black text-white text-sm shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/20 flex items-center gap-1.5
                                ${!isCalibrated ? 'bg-slate-500/90' : fhpState === 'danger' ? 'bg-red-600/90' : fhpState === 'warning' ? 'bg-orange-500/90' : 'bg-green-500/90'}`}>
                                <span>
                                    {!isCalibrated ? '⏳' : fhpState === 'danger' ? '🚨' : fhpState === 'warning' ? '⚠️' : '✅'}
                                </span>
                                <span>
                                    {!isCalibrated ? '영점 조절 요망' : fhpState === 'danger' ? '위험' : fhpState === 'warning' ? '주의' : '정상'}
                                </span>
                            </div>
                        </div>
                    )}

                    {isPipMode && (
                        <div className="absolute bottom-3 left-0 w-full flex justify-center z-50">
                            <button
                                id="pip-return-btn"
                                className="flex items-center gap-2 px-5 py-2 bg-slate-900/70 hover:bg-slate-800/90 backdrop-blur-md border border-white/20 rounded-full transition text-white shadow-lg"
                            >
                                <span className="text-base">↩️</span>
                                <span className="text-sm font-bold opacity-90">웹 복귀</span>
                            </button>
                        </div>
                    )}

                    {!isMeasuring && !isPipMode && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 bg-white dark:bg-slate-800">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-5xl text-blue-500 shadow-inner">📷</div>
                            <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-slate-900 dark:text-white">모니터링 대기 중</h3>
                            <p className="mb-8 text-slate-500 text-center text-sm md:text-base leading-relaxed break-keep">정면을 응시하고 정자세를 취해주세요.<br /><span className="font-bold text-blue-600 dark:text-blue-400">카메라와 60~70cm 거리를 유지</span>할 때 분석이 가장 정확합니다.<br />아래 버튼을 누르면 스캔이 시작됩니다.</p>
                            {!isAiLoaded ? (
                                <button disabled className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> AI 모듈 로딩 중...</button>
                            ) : (
                                <button onClick={handleStartMeasurement} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg transition transform hover:-translate-y-1">▶️ 측정 시작하기</button>
                            )}
                        </div>
                    )}
                </div>

                {(!isPipMode && isMeasuring) && (
                    <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 h-full flex flex-col gap-4 animate-fadeInRight">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-slate-400 tracking-wider">STATUS</h4>
                                <button onClick={toggleDocumentPIP} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-200 transition">PIP 모드 ↗️</button>
                            </div>

                            <div className={`text-3xl font-black mb-2 transition-colors duration-500 ${!isCalibrated ? 'text-slate-400' : fhpState === 'danger' ? "text-red-600 dark:text-red-500" : fhpState === 'warning' ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"}`}>
                                {!isCalibrated ? "🎯 영점 조절 대기" : fhpState === 'danger' ? "🚨 경추 위험" : fhpState === 'warning' ? "⚠️ 주의 요망" : "✅ 정상 자세"}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                {!isCalibrated
                                    ? "아직 측정이 시작되지 않았습니다. 바른 자세를 잡고 아래 버튼을 눌러주세요."
                                    : fhpState === 'danger' ? "자세가 크게 무너졌습니다! 디스크 압박이 심합니다."
                                        : fhpState === 'warning' ? "목이 앞으로 나왔거나 고개를 숙였습니다. 자세를 교정하세요."
                                            : "아주 좋습니다. 올바른 정렬이 유지되고 있습니다."}
                            </p>
                        </div>

                        <div className="flex-1 min-h-[120px] overflow-y-auto bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                            <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-4 shrink-0">GUIDE</h4>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed mb-4 flex flex-col gap-3">
                                {!isCalibrated ? (
                                    <div className="text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                                        💡 [필수] 정면을 바라보고 '영점 조절' 버튼을 눌러야 측정이 시작됩니다.
                                    </div>
                                ) : (
                                    <div><span className="mr-1">✅</span> 측정이 시작되었습니다. 자세를 유지해 주세요.</div>
                                )}
                                <div><span className="mr-1">📏</span> 카메라와 <strong>60~70cm 거리</strong>를 유지하세요.</div>
                            </div>
                            <button onClick={calibrate} className={`shrink-0 w-full py-4 font-bold transition shadow-sm rounded-xl border-2 ${!isCalibrated ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
                                🎯 정자세 영점 조절
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <button onClick={handleStopMeasurement} className="w-full py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold transition shadow-md rounded-xl">🛑 측정 종료</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}