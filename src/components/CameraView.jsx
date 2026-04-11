import { useState, useRef, useEffect } from 'react';
import { useFhpDetector } from '../hooks/useFhpDetector';
import { sendFhpStateToBackend } from '../services/fhpApi';
// 👇 방금 따로 분리한 어드민 패널 컴포넌트를 불러옵니다!
import AdminTestPanel from './AdminTestPanel';

export default function CameraView({ fhpState, setFhpState, user }) {
    const [isPipMode, setIsPipMode] = useState(false);
    const [isAdminTesting, setIsAdminTesting] = useState(false);
    const pipContainerRef = useRef(null);

    const {
        isMeasuring, isAiLoaded, calibrationData, videoRef, canvasRef,
        startMeasurement, stopMeasurement, calibrate
    } = useFhpDetector(setFhpState);

    // 💡 어드민 계정 확인
    const isAdmin = user?.email === 'admin@gmail.com';

    const displayIsMeasuring = isMeasuring || isAdminTesting;
    const displayCalibration = calibrationData || isAdminTesting;

    useEffect(() => {
        if (displayIsMeasuring && displayCalibration && user?.uid) {
            sendFhpStateToBackend(user.uid, fhpState);
        }
    }, [fhpState, displayIsMeasuring, displayCalibration, user]);

    const getBorderColor = () => {
        if (fhpState === 'danger') return "border-red-500";
        if (fhpState === 'warning') return "border-orange-500";
        return "border-blue-400";
    };

    const getWarningMessage = () => {
        if (fhpState === 'danger') return "🚨 위험! 당장 자세 교정!";
        if (fhpState === 'warning') return "⚠️ 주의! 목을 뒤로 당기세요.";
        return "✅ 바른 자세 유지 중";
    };

    const toggleDocumentPIP = async () => {
        if (isPipMode) {
            if (window.documentPictureInPicture?.window) {
                window.documentPictureInPicture.window.close();
            }
            return;
        }

        if (!('documentPictureInPicture' in window)) {
            alert("이 브라우저는 최신 PIP 기능을 지원하지 않습니다.");
            return;
        }

        try {
            // 💡 [해결!] 브라우저가 허용하는 적당한 초기 크기로 설정합니다.
            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 360,
                height: 550,
            });

            [...document.styleSheets].forEach((sheet) => {
                try {
                    const cssRules = [...sheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = sheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            pipWindow.document.body.append(pipContainerRef.current);
            setIsPipMode(true);

            const returnBtn = pipWindow.document.getElementById('pip-return-btn');
            if (returnBtn) {
                returnBtn.onclick = () => pipWindow.close();
            }

            pipWindow.addEventListener("pagehide", () => {
                const wrapper = document.getElementById("camera-wrapper");
                if (wrapper && pipContainerRef.current) {
                    wrapper.append(pipContainerRef.current);
                }
                setIsPipMode(false);
            });

        } catch (error) {
            console.error("PIP 창 열기 실패:", error);
            // 에러 메시지를 사용자에게 알립니다.
            alert("PIP 창을 열 수 없습니다. 브라우저 설정이나 팝업 차단을 확인해 보세요!");
        }
    };

    return (
        <div id="camera-wrapper" className="flex flex-col items-center w-full h-full min-h-0">

            {/* 👇 어드민 계정일 때만 테스트 패널 노출 */}
            {isAdmin && (
                <AdminTestPanel
                    setIsAdminTesting={setIsAdminTesting}
                    setFhpState={setFhpState}
                />
            )}

            <div
                ref={pipContainerRef}
                // 💡 PIP 모드 여부에 따라 스타일 변경
                className={`flex flex-col items-center gap-4 transition-all duration-300 ${isPipMode ? 'w-full h-full p-4 bg-white/95' : 'w-full h-full max-w-4xl'}`}
            >
                {displayIsMeasuring && (
                    <button
                        id="pip-return-btn"
                        onClick={toggleDocumentPIP}
                        className="shrink-0 self-end px-4 py-2 bg-gray-800 text-white font-bold rounded-xl shadow-lg hover:bg-gray-700 transition"
                    >
                        {isPipMode ? "웹으로 복귀 ↩️" : "PIP 창 분리 ↗️"}
                    </button>
                )}

                {displayIsMeasuring && displayCalibration && (
                    <div className={`shrink-0 w-full text-center rounded-xl font-bold text-white transition-colors duration-500 shadow-md ${isPipMode ? 'text-lg p-3' : 'text-xl p-4'
                        } ${fhpState === 'danger' ? "bg-red-500" :
                            fhpState === 'warning' ? "bg-orange-500" : "bg-green-500"
                        }`}>
                        {getWarningMessage()}
                    </div>
                )}

                <div className={`relative w-full flex-1 min-h-0 overflow-hidden shadow-2xl transition-colors duration-500 flex items-center justify-center bg-gray-900 ${getBorderColor()} ${isPipMode ? 'rounded-2xl border-4' : 'rounded-3xl border-8'}`}>
                    {/* 💡 [해결!] 카메라와 캔버스는 숨기지 않습니다. */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`}
                    />
                    <canvas
                        ref={canvasRef}
                        className={`absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] ${isAdminTesting ? 'hidden' : 'block'}`}
                    />

                    {isAdminTesting && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-2xl font-bold tracking-widest">
                            🛠️ TEST MODE ACTIVE
                        </div>
                    )}

                    {!displayIsMeasuring && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 text-white p-6 text-center z-10">
                            <h3 className="text-3xl font-bold mb-3">거북목 측정기</h3>
                            <p className="mb-8 text-gray-200">카메라를 켜고 정면을 바라본 뒤 영점 조절을 해주세요.</p>
                            {!isAiLoaded ? (
                                <button disabled className="px-8 py-4 bg-gray-500 rounded-full font-bold text-lg">
                                    AI 모델 로딩 중... ⏳
                                </button>
                            ) : (
                                <button
                                    onClick={startMeasurement}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-lg shadow-lg transition transform hover:scale-105"
                                >
                                    카메라 켜기 📸
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={`shrink-0 flex gap-3 w-full justify-center ${isPipMode ? 'flex-col' : ''}`}>
                    {isMeasuring && !isAdminTesting && (
                        <>
                            <button
                                onClick={calibrate}
                                className={`bg-green-500 hover:bg-green-600 text-white font-bold shadow-md transition transform hover:scale-105 ${isPipMode ? 'py-3 rounded-xl' : 'px-8 py-4 rounded-2xl'}`}
                            >
                                🎯 정자세 영점 조절
                            </button>
                            <button
                                onClick={stopMeasurement}
                                className={`bg-red-500 hover:bg-red-600 text-white font-bold shadow-md transition transform hover:scale-105 ${isPipMode ? 'py-3 rounded-xl' : 'px-8 py-4 rounded-2xl'}`}
                            >
                                🛑 측정 종료
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}