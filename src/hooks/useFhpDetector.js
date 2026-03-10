import { useState, useRef, useEffect } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

// 두 점 사이의 거리를 구하는 수학 공식
const calculateDistance = (point1, point2) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

// 커스텀 훅 생성 (경고 상태를 바꾸는 함수를 외부에서 받아옴)
export function useFhpDetector(setIsFhpWarning) {
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [isAiLoaded, setIsAiLoaded] = useState(false);
    const [calibrationData, setCalibrationData] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const poseLandmarkerRef = useRef(null);
    const animationRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);

    const currentLandmarksRef = useRef(null);
    const historyRef = useRef([]);
    const warningStateRef = useRef(false);
    const calibrationDataRef = useRef(null);

    useEffect(() => {
        const initializeAI = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
                );
                poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numPoses: 1,
                });
                setIsAiLoaded(true);
            } catch (error) {
                console.error("AI 로딩 에러:", error);
            }
        };
        initializeAI();
    }, []);

    const predictWebcam = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const poseLandmarker = poseLandmarkerRef.current;

        if (!video || !canvas || !poseLandmarker) {
            animationRef.current = requestAnimationFrame(predictWebcam);
            return;
        }

        const canvasCtx = canvas.getContext("2d");
        const drawingUtils = new DrawingUtils(canvasCtx);

        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        let startTimeMs = performance.now();

        if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime;
            const result = poseLandmarker.detectForVideo(video, startTimeMs);

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                currentLandmarksRef.current = landmarks;

                drawingUtils.drawLandmarks(landmarks, { radius: 4, color: "#FF0000" });
                drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 3,
                });

                if (calibrationDataRef.current && calibrationDataRef.current.ratio > 0) {
                    const baselineRatio = calibrationDataRef.current.ratio;

                    const leftEar = landmarks[7];
                    const rightEar = landmarks[8];
                    const leftShoulder = landmarks[11];
                    const rightShoulder = landmarks[12];

                    const currentFaceWidth = calculateDistance(leftEar, rightEar);
                    const currentShoulderWidth = calculateDistance(leftShoulder, rightShoulder);

                    if (currentShoulderWidth > 0) {
                        const currentRatio = currentFaceWidth / currentShoulderWidth;

                        console.log(`🐢 실시간 변화율: ${(currentRatio / baselineRatio).toFixed(3)}`);

                        const isForwardLeaning = currentRatio > baselineRatio * 1.02;

                        historyRef.current.push(isForwardLeaning);
                        if (historyRef.current.length > 3) {
                            historyRef.current.shift();
                        }

                        const fhpCount = historyRef.current.filter((isFhp) => isFhp === true).length;
                        const isConfirmedFhp = fhpCount >= 2;

                        if (warningStateRef.current !== isConfirmedFhp) {
                            warningStateRef.current = isConfirmedFhp;
                            setIsFhpWarning(isConfirmedFhp); // App.jsx로 경고 신호 보내기
                        }
                    }
                }
            }
            canvasCtx.restore();
        }
        animationRef.current = requestAnimationFrame(predictWebcam);
    };

    const calibrate = () => {
        const landmarks = currentLandmarksRef.current;
        if (!landmarks) {
            alert("자세가 인식되지 않았습니다. 카메라 정면에 서주세요.");
            return;
        }

        const faceWidth = calculateDistance(landmarks[7], landmarks[8]);
        const shoulderWidth = calculateDistance(landmarks[11], landmarks[12]);

        if (shoulderWidth === 0) return;

        const baselineRatio = faceWidth / shoulderWidth;

        setCalibrationData({ ratio: baselineRatio });
        calibrationDataRef.current = { ratio: baselineRatio };

        historyRef.current = [];
        alert("영점 조절 완료! 이제부터 측정을 시작합니다.");
    };

    const startMeasurement = async () => {
        if (!isAiLoaded) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setIsMeasuring(true);
        } catch (err) {
            alert("카메라 권한을 허용해주세요!");
        }
    };

    const stopMeasurement = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setIsMeasuring(false);

        setCalibrationData(null);
        calibrationDataRef.current = null;
        setIsFhpWarning(false);
    };

    useEffect(() => {
        if (isMeasuring && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.onloadeddata = () => { predictWebcam(); };
        }
    }, [isMeasuring]);

    useEffect(() => {
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
        };
    }, []);

    // 밖(화면)에서 쓸 수 있도록 핵심 기능들만 묶어서 반환합니다!
    return {
        isMeasuring,
        isAiLoaded,
        calibrationData,
        videoRef,
        canvasRef,
        startMeasurement,
        stopMeasurement,
        calibrate
    };
}