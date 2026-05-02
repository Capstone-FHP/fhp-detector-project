import { useState, useRef, useEffect } from 'react';
import { useFhpDetector } from '../hooks/useFhpDetector';
import { savePostureSession } from '../services/fhpApi';
import PostureResultModal from './PostureResultModal';

export default function CameraView({ fhpState, setFhpState, user }) {
    const [isPipMode, setIsPipMode] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    const pipContainerRef = useRef(null);
    const handlersRef = useRef({});

    // 💡 시간 누적 장부
    const localStatsRef = useRef({ totalSeconds: 0, warningSeconds: 0, dangerSeconds: 0 });
    const lastNotificationTime = useRef(0);

    // 🌟 [최적화 핵심] 타이머가 리셋되지 않도록 현재 상태를 몰래 지켜보는 거울(Ref)
    const currentStateRef = useRef(fhpState);

    // 🌟 상태가 바뀔 때마다 거울(Ref)에 최신 상태를 비춰줌
    useEffect(() => {
        currentStateRef.current = fhpState;
    }, [fhpState]);

    const {
        isMeasuring, isAiLoaded, calibrationData, videoRef, canvasRef,
        startMeasurement, stopMeasurement, calibrate
    } = useFhpDetector(setFhpState);

    // ⏱️ 1초 타이머 (의존성 배열에서 fhpState를 빼서 절대 멈추거나 리셋되지 않음!)
    useEffect(() => {
        if (!isMeasuring || !currentSessionId) return;

        const timer = setInterval(() => {
            localStatsRef.current.totalSeconds += 1;

            // 🌟 렌더링에 영향을 주지 않는 거울(Ref)에서 현재 상태를 읽어옴
            const currentState = currentStateRef.current;

            if (currentState === 'warning') {
                localStatsRef.current.warningSeconds += 1;
            } else if (currentState === 'danger') {
                localStatsRef.current.dangerSeconds += 1;
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isMeasuring, currentSessionId]);

    // 🔔 OS 브라우저 알림 (한 번 뜨면 10초 쿨타임 유지)
    useEffect(() => {
        if (!isMeasuring || fhpState === 'normal') return;

        const now = Date.now();
        if (now - lastNotificationTime.current < 10000) return;

        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(
                fhpState === 'danger' ? "🚨 경추 위험" : "⚠️ 주의 요망",
                { body: fhpState === 'danger' ? "자세가 크게 무너졌습니다! 즉시 교정하세요." : "목이 앞으로 나왔거나 고개를 숙였습니다." }
            );
            setTimeout(() => notification.close(), 4000);
            lastNotificationTime.current = now;
        }
    }, [fhpState, isMeasuring]);

    const handleStartMeasurement = () => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        setCurrentSessionId(`session_${Date.now()}`);
        localStatsRef.current = { totalSeconds: 0, warningSeconds: 0, dangerSeconds: 0 };
        startMeasurement();
    };

    const handleStopMeasurement = async () => {
        stopMeasurement();

        // 📉 점수 계산 (주의 1초당 -0.5점, 위험 1초당 -1.5점 감점)
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

        if (!user) setTimeout(() => alert("게스트 체험 종료! 기록을 저장하려면 로그인 해주세요."), 100);
    };

    useEffect(() => { handlersRef.current = { calibrate, handleStopMeasurement }; });

    // PIP 모드 관련 로직
    const toggleDocumentPIP = async () => {
        if (isPipMode) { window.documentPictureInPicture?.window?.close(); return; }
        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 360, height: 550 });
            [...document.styleSheets].forEach(s => {
                try { const rules = [...s.cssRules].map(r => r.cssText).join(''); const st = document.createElement('style'); st.textContent = rules; pipWindow.document.head.append(st); }
                catch (e) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href; pipWindow.document.head.append(l); }
            });
            pipWindow.document.body.append(pipContainerRef.current);
            setIsPipMode(true);
            pipWindow.document.addEventListener('click', (e) => {
                if (e.target.closest('#pip-return-btn')) pipWindow.close();
                if (e.target.closest('#pip-calibrate-btn')) handlersRef.current.calibrate();
                if (e.target.closest('#pip-stop-btn')) handlersRef.current.handleStopMeasurement();
            });
            pipWindow.addEventListener("pagehide", () => { setIsPipMode(false); document.getElementById("camera-wrapper")?.append(pipContainerRef.current); });
        } catch (error) { console.error("PIP 실패:", error); }
    };

    const frameStyle = fhpState === 'danger' ? "ring-4 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]" : fhpState === 'warning' ? "ring-4 ring-orange-400 shadow-[0_0_50px_rgba(249,115,22,0.5)]" : "ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-xl";

    return (
        <div id="camera-wrapper" className="flex flex-col items-center w-full h-full min-h-0 relative">

            <PostureResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} summaryData={summaryData} />

            <div ref={pipContainerRef} className={`w-full max-w-[1600px] h-full min-h-0 transition-all duration-300 ${isPipMode ? 'flex flex-col items-center p-5 bg-slate-50 dark:bg-slate-900 justify-center gap-4' : 'flex flex-col lg:flex-row gap-4 lg:gap-6'}`}>

                {/* 🏥 카메라 비디오 영역 */}
                <div className={`relative flex-1 h-full min-h-0 overflow-hidden bg-slate-900 rounded-[2rem] transition-all duration-500 flex items-center justify-center ${isMeasuring ? frameStyle : 'border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-800'}`}>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1] block" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] block" />

                    {!isMeasuring && (
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

                {/* 🏥 컨트롤 패널 */}
                {(!isPipMode && isMeasuring) && (
                    <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 h-full flex flex-col gap-4 animate-fadeInRight">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-slate-400 tracking-wider">STATUS</h4>
                                <button onClick={toggleDocumentPIP} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-200 transition">PIP 분리 ↗️</button>
                            </div>
                            <div className={`text-3xl font-black mb-2 transition-colors duration-500 ${fhpState === 'danger' ? "text-red-600 dark:text-red-500" : fhpState === 'warning' ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"}`}>
                                {fhpState === 'danger' ? "🚨 경추 위험" : fhpState === 'warning' ? "⚠️ 주의 요망" : "✅ 정상 자세"}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                {fhpState === 'danger' ? "자세가 크게 무너졌습니다! 디스크 압박이 심합니다." : fhpState === 'warning' ? "목이 앞으로 나왔거나 고개를 숙였습니다. 자세를 교정하세요." : "아주 좋습니다. 올바른 정렬이 유지되고 있습니다."}
                            </p>
                        </div>

                        <div className="flex-1 min-h-[120px] overflow-y-auto bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                            <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-4 shrink-0">GUIDE</h4>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed mb-4 flex flex-col gap-3">
                                <div><span className="mr-1">📏</span> 카메라와 <strong>60~70cm 거리</strong>를 유지할 때 가장 정확하게 측정됩니다.</div>
                                <div><span className="mr-1">🎯</span> 자세를 크게 바꾼 뒤에는 아래 버튼을 눌러 AI 기준점을 재설정해 주세요.</div>
                            </div>
                            <button onClick={calibrate} className="shrink-0 w-full py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 font-bold transition shadow-sm rounded-xl">🎯 정자세 영점 조절</button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <button onClick={handleStopMeasurement} className="w-full py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold transition shadow-md rounded-xl">🛑 측정 종료</button>
                        </div>
                    </div>
                )}

                {/* 🏥 PIP 하단 버튼 */}
                {isPipMode && (
                    <div className="shrink-0 flex gap-2 w-full justify-center">
                        <button id="pip-return-btn" className="px-4 py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl text-sm w-full max-w-[120px]">웹 복귀 ↩️</button>
                        {isMeasuring && (
                            <>
                                <button id="pip-calibrate-btn" className="px-4 py-3 bg-green-500 text-white font-bold rounded-xl text-sm w-full max-w-[120px]">영점조절 🎯</button>
                                <button id="pip-stop-btn" className="px-4 py-3 bg-red-500 text-white font-bold rounded-xl text-sm w-full max-w-[120px]">종료 🛑</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}