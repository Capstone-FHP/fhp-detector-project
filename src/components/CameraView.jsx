import { useState, useRef, useEffect } from 'react';
import { useFhpDetector } from '../hooks/useFhpDetector';
import { sendFhpStateToBackend, getPostureSummary } from '../services/fhpApi';
import AdminTestPanel from './AdminTestPanel';
import PostureResultModal from './PostureResultModal';

export default function CameraView({ fhpState, setFhpState, user }) {
    const [isPipMode, setIsPipMode] = useState(false);
    const [isAdminTesting, setIsAdminTesting] = useState(false);

    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    const pipContainerRef = useRef(null);
    const lastSentState = useRef(null);

    // 💡 [버그 픽스 1] PIP 창에서도 최신 기능들을 쓸 수 있도록 Ref(비상 연락망)를 만듭니다!
    const handlersRef = useRef({});

    const {
        isMeasuring, isAiLoaded, calibrationData, videoRef, canvasRef,
        startMeasurement, stopMeasurement, calibrate
    } = useFhpDetector(setFhpState);

    const isAdmin = user?.email === 'admin@gmail.com';
    const displayIsMeasuring = isMeasuring || isAdminTesting;
    const displayCalibration = calibrationData || isAdminTesting;

    useEffect(() => {
        const isReadyToMeasure = (isMeasuring && calibrationData && currentSessionId) || isAdminTesting;
        if (!isReadyToMeasure || !user?.uid) {
            lastSentState.current = null; return;
        }
        if (lastSentState.current === fhpState) return;

        const activeSessionId = currentSessionId || 'test_session_admin';
        if (fhpState === 'normal') {
            sendFhpStateToBackend(user.uid, activeSessionId, fhpState);
            lastSentState.current = fhpState; return;
        }
        const timerId = setTimeout(() => {
            sendFhpStateToBackend(user.uid, activeSessionId, fhpState);
            lastSentState.current = fhpState;
        }, 3000);
        return () => clearTimeout(timerId);
    }, [fhpState, isMeasuring, calibrationData, isAdminTesting, currentSessionId, user]);

    const handleStartMeasurement = () => {
        const newSessionId = `session_${Date.now()}`;
        setCurrentSessionId(newSessionId); startMeasurement();
    };

    const handleStopMeasurement = async () => {
        stopMeasurement();
        if (!user) {
            alert("체험이 종료되었습니다! 👏\n통계 리포트를 보시려면 로그인 해주세요."); return;
        }
        if (currentSessionId) {
            const data = await getPostureSummary(currentSessionId);
            if (data) setSummaryData(data);
            else setSummaryData({ totalMeasurements: 0, warningCount: 0, dangerCount: 0 });
            setShowResultModal(true); setCurrentSessionId(null);
        }
    };

    // 💡 [버그 픽스 2] 매번 화면이 바뀔 때마다 최신 함수들을 비상 연락망에 업데이트 해둡니다.
    useEffect(() => {
        handlersRef.current = { calibrate, handleStopMeasurement };
    });

    const getCameraFrameStyle = () => {
        if (fhpState === 'danger') return "ring-4 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]";
        if (fhpState === 'warning') return "ring-4 ring-orange-400 shadow-[0_0_50px_rgba(249,115,22,0.5)]";
        return "ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-xl";
    };

    const getStatusText = () => {
        if (fhpState === 'danger') return "🚨 경추 위험";
        if (fhpState === 'warning') return "⚠️ 주의 요망";
        return "✅ 정상 자세";
    };

    const getWarningMessage = () => {
        if (fhpState === 'danger') return "즉시 목을 당겨 자세를 교정해 주세요. 디스크 압박이 심합니다.";
        if (fhpState === 'warning') return "목이 앞으로 나와 있습니다. 턱을 가볍게 뒤로 당겨주세요.";
        return "아주 좋습니다. 올바른 경추 정렬이 유지되고 있습니다.";
    };

    const toggleDocumentPIP = async () => {
        if (isPipMode) {
            if (window.documentPictureInPicture?.window) window.documentPictureInPicture.window.close();
            return;
        }
        if (!('documentPictureInPicture' in window)) {
            alert("이 브라우저는 최신 PIP 기능을 지원하지 않습니다.");
            return;
        }
        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 360, height: 550 });
            [...document.styleSheets].forEach((sheet) => {
                try {
                    const cssRules = [...sheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style'); style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = sheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            pipWindow.document.body.append(pipContainerRef.current);
            setIsPipMode(true);

            // 💡 [핵심 버그 해결] 끊어진 React 연결선 대신, PIP 창 자체에 클릭 센서를 달아버립니다!
            pipWindow.document.addEventListener('click', (e) => {
                // 어떤 버튼이 눌렸는지 ID로 추적해서 강제로 함수를 실행시킵니다.
                if (e.target.closest('#pip-return-btn')) pipWindow.close();
                if (e.target.closest('#pip-calibrate-btn')) handlersRef.current.calibrate();
                if (e.target.closest('#pip-stop-btn')) handlersRef.current.handleStopMeasurement();
            });

            pipWindow.addEventListener("pagehide", () => {
                const wrapper = document.getElementById("camera-wrapper");
                if (wrapper && pipContainerRef.current) wrapper.append(pipContainerRef.current);
                setIsPipMode(false);
            });
        } catch (error) {
            console.error("PIP 창 열기 실패:", error);
        }
    };

    return (
        <div id="camera-wrapper" className="flex flex-col items-center w-full h-full min-h-0 relative">

            <PostureResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} summaryData={summaryData} />

            {isAdmin && <div className="w-full max-w-[1600px] mb-3 shrink-0"><AdminTestPanel setIsAdminTesting={setIsAdminTesting} setFhpState={setFhpState} /></div>}

            <div
                ref={pipContainerRef}
                className={`w-full max-w-[1600px] h-full min-h-0 transition-all duration-300 ${isPipMode ? 'flex flex-col items-center p-5 bg-slate-50 dark:bg-slate-900 justify-center gap-4' : 'flex flex-col lg:flex-row gap-4 lg:gap-6'}`}
            >

                {/* 🏥 왼쪽: 카메라 비디오 */}
                <div className={`relative flex-1 h-full min-h-0 overflow-hidden bg-slate-900 rounded-[2rem] transition-all duration-500 flex items-center justify-center ${displayIsMeasuring ? getCameraFrameStyle() : 'border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-800'}`}>
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`} />
                    <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`} />

                    {isAdminTesting && <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20 text-slate-500 font-bold tracking-widest text-2xl">🛠️ TEST MODE</div>}

                    {!displayIsMeasuring && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 bg-white dark:bg-slate-800">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-5xl text-blue-500 shadow-inner">📷</div>
                            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">모니터링 대기 중</h3>
                            <p className="mb-8 text-slate-500 text-center text-sm md:text-base leading-relaxed break-keep">정면을 응시하고 정자세를 취해주세요.<br />아래 버튼을 누르면 AI 분석이 시작됩니다.</p>

                            {!isAiLoaded ? (
                                <button disabled className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl font-bold flex items-center gap-2">
                                    <span className="animate-spin">⏳</span> AI 모듈 로딩 중...
                                </button>
                            ) : (
                                <button onClick={handleStartMeasurement} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg transition transform hover:-translate-y-1">
                                    ▶️ 측정 시작하기
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 🏥 오른쪽: 컨트롤 패널 (웹용) */}
                {(!isPipMode && displayIsMeasuring) && (
                    <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 h-full flex flex-col gap-4 animate-fadeInRight">

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-slate-400 tracking-wider">STATUS</h4>
                                <button onClick={toggleDocumentPIP} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs hover:bg-slate-200 transition">PIP 분리 ↗️</button>
                            </div>
                            <div className={`text-3xl font-black mb-2 transition-colors duration-500 ${fhpState === 'danger' ? "text-red-600 dark:text-red-500" : fhpState === 'warning' ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500"}`}>
                                {getStatusText()}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                {getWarningMessage()}
                            </p>
                        </div>

                        <div className="flex-1 min-h-[120px] overflow-y-auto bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                            <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-4 shrink-0">GUIDE</h4>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed mb-4">
                                💡 가끔씩 정자세를 취한 뒤 아래 버튼을 눌러 AI 기준점을 재설정해 주세요.
                            </div>
                            <button onClick={calibrate} className="shrink-0 w-full py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 font-bold transition shadow-sm rounded-xl">
                                🎯 정자세 영점 조절
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <button onClick={handleStopMeasurement} className="w-full py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold transition shadow-md rounded-xl">
                                🛑 측정 종료
                            </button>
                        </div>
                    </div>
                )}

                {/* 🏥 하단: PIP 모드용 버튼 (React onClick 제거하고 ID만 남겨둠!) */}
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