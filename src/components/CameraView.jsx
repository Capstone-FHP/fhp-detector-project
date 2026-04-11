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
            lastSentState.current = null;
            return;
        }
        if (lastSentState.current === fhpState) return;

        const activeSessionId = currentSessionId || 'test_session_admin';
        if (fhpState === 'normal') {
            sendFhpStateToBackend(user.uid, activeSessionId, fhpState);
            lastSentState.current = fhpState;
            return;
        }
        const timerId = setTimeout(() => {
            sendFhpStateToBackend(user.uid, activeSessionId, fhpState);
            lastSentState.current = fhpState;
        }, 3000);
        return () => clearTimeout(timerId);
    }, [fhpState, isMeasuring, calibrationData, isAdminTesting, currentSessionId, user]);

    const handleStartMeasurement = () => {
        const newSessionId = `session_${Date.now()}`;
        setCurrentSessionId(newSessionId);
        startMeasurement();
    };

    const handleStopMeasurement = async () => {
        stopMeasurement();
        if (!user) {
            alert("체험이 종료되었습니다! 👏\n나의 누적 통계와 분석 리포트를 보시려면 로그인 후 이용해 주세요.");
            return;
        }
        if (currentSessionId) {
            const data = await getPostureSummary(currentSessionId);
            if (data) setSummaryData(data);
            else setSummaryData({ totalMeasurements: 0, warningCount: 0, dangerCount: 0 });
            setShowResultModal(true);
            setCurrentSessionId(null);
        }
    };

    const getCameraFrameStyle = () => {
        if (fhpState === 'danger') return "ring-4 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]";
        if (fhpState === 'warning') return "ring-4 ring-orange-400 shadow-[0_0_50px_rgba(249,115,22,0.5)]";
        return "ring-4 ring-blue-100 shadow-xl";
    };

    const getStatusText = () => {
        if (fhpState === 'danger') return "🚨 경추 위험 상태";
        if (fhpState === 'warning') return "⚠️ 주의 요망";
        return "✅ 정상 자세";
    };

    const getWarningMessage = () => {
        if (fhpState === 'danger') return "즉시 목을 당겨 올바른 자세를 취해주세요. 경추 디스크 압박이 심합니다.";
        if (fhpState === 'warning') return "목이 조금 앞으로 나와 있습니다. 턱을 가볍게 뒤로 당겨주세요.";
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
            const returnBtn = pipWindow.document.getElementById('pip-return-btn');
            if (returnBtn) returnBtn.onclick = () => pipWindow.close();
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

            {isAdmin && <div className="w-full max-w-[1600px] mb-4"><AdminTestPanel setIsAdminTesting={setIsAdminTesting} setFhpState={setFhpState} /></div>}

            <div
                ref={pipContainerRef}
                className={`w-full max-w-[1600px] h-full transition-all duration-300 ${isPipMode ? 'flex flex-col items-center p-5 bg-slate-50 justify-center gap-4' : 'flex flex-col lg:flex-row gap-8 pb-4'}`}
            >

                {/* 🏥 왼쪽: 모니터링 영역 (카메라 비디오) */}
                <div className={`relative flex-1 ${isPipMode ? 'w-full h-full' : 'h-full min-h-0'} overflow-hidden bg-slate-900 rounded-[2.5rem] transition-all duration-500 flex items-center justify-center ${displayIsMeasuring ? getCameraFrameStyle() : 'border border-slate-200 shadow-sm bg-white'}`}>
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`} />
                    <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`} />

                    {isAdminTesting && <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20 text-slate-500 font-bold tracking-widest text-3xl">🛠️ TEST MODE ACTIVE</div>}

                    {!displayIsMeasuring && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-10">
                            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8 text-6xl text-blue-500 shadow-inner">📷</div>
                            <h3 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">모니터링 시스템 대기 중</h3>
                            <p className="mb-12 text-slate-600 text-center font-medium text-xl leading-relaxed max-w-xl break-keep">정면 카메라를 응시하고 정자세를 취해주세요.<br />아래 [측정 시작] 버튼을 누르면 AI 분석이 시작됩니다.</p>

                            {!isAiLoaded ? (
                                <button disabled className="px-12 py-5 bg-slate-100 text-slate-400 rounded-3xl font-bold text-xl cursor-not-allowed flex items-center gap-3 border border-slate-200">
                                    <span className="animate-spin text-2xl">⏳</span> AI 엔진 로딩 중...
                                </button>
                            ) : (
                                <button onClick={handleStartMeasurement} className="px-16 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-bold text-2xl shadow-xl transition transform hover:-translate-y-1">
                                    ▶️ 측정 시작하기
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 🏥 오른쪽: 상태 및 컨트롤 패널 영역 */}
                {(!isPipMode && displayIsMeasuring) && (
                    <div className="w-full lg:w-[400px] shrink-0 h-full flex flex-col gap-6 animate-fadeInRight">

                        {/* 칸 1: 실시간 상태 모니터 */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-bold text-slate-400 tracking-wider">STATUS</h4>
                                <button onClick={toggleDocumentPIP} className="px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 transition">PIP 분리 ↗️</button>
                            </div>

                            <div className={`text-4xl font-black mb-4 transition-colors duration-500 ${fhpState === 'danger' ? "text-red-600" : fhpState === 'warning' ? "text-orange-600" : "text-green-600"}`}>
                                {getStatusText()}
                            </div>
                            {/* 💡 바로 이 줄에서 에러가 났었습니다! <p> 태그 닫기 수정 완료 */}
                            <p className="text-slate-600 text-base leading-relaxed break-keep font-medium">
                                {getWarningMessage()}
                            </p>
                        </div>

                        {/* 칸 2: AI 가이드 & 영점 조절 */}
                        <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start">
                            <h4 className="text-sm font-bold text-slate-400 tracking-wider mb-6">GUIDE</h4>
                            <div className="w-full bg-slate-50 border border-slate-100 p-5 rounded-xl text-slate-600 font-medium text-sm leading-relaxed mb-8 break-keep">
                                💡 올바른 측정을 위해 가끔씩 정자세를 취한 뒤 [🎯 영점 조절] 버튼을 눌러 AI 기준점을 재설정해 주세요.
                            </div>
                            {/* 💡 클래스명 띄어쓰기 오타 수정 완료 */}
                            <button onClick={calibrate} className="w-full py-5 bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 font-bold transition shadow-sm rounded-2xl text-lg transform hover:-translate-y-0.5">
                                🎯 정자세 영점 조절
                            </button>
                        </div>

                        {/* 칸 3: 시스템 제어 (종료) */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <button onClick={handleStopMeasurement} className="w-full py-5 bg-slate-800 hover:bg-slate-900 text-white font-bold transition shadow-md rounded-2xl text-lg transform hover:-translate-y-0.5">
                                🛑 측정 종료 및 리포트 조회
                            </button>
                        </div>
                    </div>
                )}

                {/* 💡 [PIP 전용 UI] PIP 모드일 때만 아래쪽 버튼 노출 */}
                {isPipMode && (
                    <div className="shrink-0 flex gap-2 w-full justify-center">
                        <button id="pip-return-btn" onClick={toggleDocumentPIP} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-xs">웹 복귀</button>
                        {isMeasuring && (
                            <>
                                <button onClick={calibrate} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-xs">영점조절</button>
                                <button onClick={handleStopMeasurement} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg text-xs">종료</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}