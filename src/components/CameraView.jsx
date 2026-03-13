// 방금 만든 '뇌(로직)' 블록을 가져옵니다.
import { useFhpDetector } from '../hooks/useFhpDetector';

export default function CameraView({ fhpState, setFhpState }) {
    // 로직 파일(훅)에서 필요한 변수와 함수만 쏙 뽑아옵니다.
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

    return (
        <div className="flex flex-col items-center w-full max-w-3xl">
            {!isMeasuring ? (
                <>
                    <p className="text-xl text-gray-700 bg-white p-6 rounded-xl shadow-lg mb-8 text-center">
                        {isAiLoaded ? "AI 모델 준비 완료! 측정 버튼을 눌러보세요." : "AI 모델을 불러오는 중입니다..."}
                    </p>
                    <button
                        onClick={startMeasurement}
                        disabled={!isAiLoaded}
                        className={`px-8 py-4 text-white text-xl font-bold rounded-xl transition shadow-md ${isAiLoaded ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {isAiLoaded ? "측정 시작하기" : "로딩 중..."}
                    </button>
                </>
            ) : (
                <>
                    {calibrationData ? (
                        <div className={`w-full p-4 mb-4 rounded-xl text-center font-bold text-2xl shadow-md transition-colors ${isFhpWarning ? "bg-red-500 text-white" : "bg-green-500 text-white"
                            }`}>
                            {isFhpWarning ? "🚨 거북목 주의! 목을 뒤로 빼주세요!" : "✅ 바른 자세를 유지 중입니다"}
                        </div>
                    ) : (
                        <div className="w-full p-4 mb-4 rounded-xl text-center font-bold text-xl bg-yellow-400 text-yellow-900 shadow-md">
                            먼저 바른 자세를 취한 뒤 '영점 조절' 버튼을 눌러주세요.
                        </div>
                    )}

                    <div className={`w-full bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative aspect-video border-4 transition-colors ${isFhpWarning ? "border-red-500" : calibrationData ? "border-green-500" : "border-transparent"
                        }`}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
                        ></video>
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 z-10"
                        ></canvas>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={calibrate}
                            className="px-6 py-4 bg-green-500 text-white text-xl font-bold rounded-xl hover:bg-green-600 transition shadow-md"
                        >
                            🎯 현재 자세로 영점 조절
                        </button>
                        <button
                            onClick={stopMeasurement}
                            className="px-6 py-4 bg-gray-500 text-white text-xl font-bold rounded-xl hover:bg-gray-600 transition shadow-md"
                        >
                            종료하기
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}