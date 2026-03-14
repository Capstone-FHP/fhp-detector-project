import { useFhpDetector } from '../hooks/useFhpDetector';

export default function CameraView({ fhpState, setFhpState }) {

    // 로직(훅)에서 필요한 도구들 꺼내오기
    const {
        isMeasuring,
        isAiLoaded,
        calibrationData,
        videoRef,
        canvasRef,
        startMeasurement,
        stopMeasurement,
        calibrate
    } = useFhpDetector(setFhpState);

    // 🎨 1. 상태에 맞춰 카메라 테두리 색상 3단계 변경
    const getBorderColor = () => {
        if (fhpState === 'danger') return "border-red-500";       // 빨간불 (위험)
        if (fhpState === 'warning') return "border-orange-500";   // 주황불 (주의)
        return "border-blue-400";                                 // 정상
    };

    // 📝 2. 상태에 맞춰 화면에 띄울 경고 메시지 3단계 변경
    const getWarningMessage = () => {
        if (fhpState === 'danger') return "🚨 거북목 위험! (5cm 이상) 당장 자세를 교정하세요!";
        if (fhpState === 'warning') return "⚠️ 거북목 주의! (2.5cm 이상) 목을 뒤로 당기세요.";
        return "✅ 바른 자세를 유지 중입니다.";
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">

            {/* 측정 중 & 영점 조절 완료 시에만 상태 메시지 띄우기 */}
            {isMeasuring && calibrationData && (
                <div className={`p-4 rounded-xl font-bold text-xl text-white transition-colors duration-500 shadow-md ${fhpState === 'danger' ? "bg-red-500" :
                        fhpState === 'warning' ? "bg-orange-500" : "bg-green-500"
                    }`}>
                    {getWarningMessage()}
                </div>
            )}

            {/* 카메라 화면 영역 (테두리 색상이 getBorderColor()에 따라 변함) */}
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl border-8 transition-colors duration-500 ${getBorderColor()}`}>

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-[640px] h-[480px] object-cover bg-gray-800 scale-x-[-1]"
                />

                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]"
                />

                {/* 측정 시작 전 가림막 화면 */}
                {!isMeasuring && (
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

            {/* 하단 컨트롤 버튼 영역 */}
            <div className="flex gap-4">
                {isMeasuring && (
                    <>
                        <button
                            onClick={calibrate}
                            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg transition transform hover:scale-105"
                        >
                            🎯 정자세 영점 조절 (필수)
                        </button>
                        <button
                            onClick={stopMeasurement}
                            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg transition transform hover:scale-105"
                        >
                            🛑 측정 종료
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}