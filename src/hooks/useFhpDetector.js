import { useState, useRef, useEffect } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

// 두 점 사이의 거리를 구하는 수학 공식
const calculateDistance = (point1, point2) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

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
    const warningStateRef = useRef('normal'); // 기본 상태를 'normal'로 설정
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
                        //console.log(`🐢 실시간 변화율: ${(currentRatio / baselineRatio).toFixed(3)}`);

                        // 1. 현재 프레임의 상태 판별 (6%와 3% 기준)
                        let currentState = 'normal';
                        if (currentRatio >= baselineRatio * 1.06) {
                            currentState = 'danger';  // 6% 이상 (약 5cm) - 빨간불
                        } else if (currentRatio >= baselineRatio * 1.03) {
                            currentState = 'warning'; // 3% 이상 (약 2.5cm) - 주황불
                        }

                        // 2. 히스토리에 저장 (최근 3프레임 유지)
                        historyRef.current.push(currentState);
                        if (historyRef.current.length > 3) {
                            historyRef.current.shift();
                        }

                        // 3. 상태 안정화 로직 (깜빡임 방지)
                        const dangerCount = historyRef.current.filter((state) => state === 'danger').length;
                        const warningCount = historyRef.current.filter((state) => state === 'warning').length;

                        let confirmedState = 'normal';
                        if (dangerCount >= 2) {
                            confirmedState = 'danger'; // 빨간불이 2번 이상이면 최종 빨간불
                        } else if (dangerCount + warningCount >= 2) {
                            confirmedState = 'warning'; // 빨간불+주황불 합쳐서 2번 이상이면 최종 주황불
                        }

                        // 4. 상태가 바뀌었을 때만 App.jsx로 알림!
                        if (warningStateRef.current !== confirmedState) {
                            warningStateRef.current = confirmedState;
                            setIsFhpWarning(confirmedState);
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
        setIsFhpWarning('normal'); // 측정 종료 시 초기 상태로 복구
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

    return {
        isMeasuring, isAiLoaded, calibrationData, videoRef, canvasRef,
        startMeasurement, stopMeasurement, calibrate
    };
}