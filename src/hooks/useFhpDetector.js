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
    const warningStateRef = useRef('normal');
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
                    // 💡 영점 조절 때 저장해 둔 고개 각도(비율) 불러오기
                    const baselinePitch = calibrationDataRef.current.pitchRatio;

                    // 주요 좌표 추출
                    const nose = landmarks[0];
                    const leftEye = landmarks[2];
                    const rightEye = landmarks[5];
                    const leftEar = landmarks[7];
                    const rightEar = landmarks[8];
                    const leftMouth = landmarks[9];
                    const rightMouth = landmarks[10];
                    const leftShoulder = landmarks[11];
                    const rightShoulder = landmarks[12];

                    // 1. 거북목 측정용 너비 계산
                    const currentFaceWidth = calculateDistance(leftEar, rightEar);
                    const currentShoulderWidth = calculateDistance(leftShoulder, rightShoulder);

                    // 💡 2. 고개 숙임(Pitch) 감지용 세로 비율 계산
                    const midEyeY = (leftEye.y + rightEye.y) / 2;
                    const midMouthY = (leftMouth.y + rightMouth.y) / 2;

                    const upperFaceHeight = nose.y - midEyeY; // 눈~코 길이
                    const lowerFaceHeight = midMouthY - nose.y; // 코~입 길이

                    // (에러 방지) 상단 길이가 0보다 클 때만 비율 계산
                    const currentPitchRatio = upperFaceHeight > 0 ? (lowerFaceHeight / upperFaceHeight) : 1;

                    if (currentShoulderWidth > 0) {
                        const currentRatio = currentFaceWidth / currentShoulderWidth;
                        const earChange = currentRatio / baselineRatio;

                        // 💡 현재 고개 각도 변화량 계산
                        const pitchChange = currentPitchRatio / baselinePitch;

                        let currentState = 'normal';

                        // 💡 [핵심 추가] 고개를 푹 숙인 경우 (비율이 25% 이상 감소하면) 강제 정상 처리!
                        if (pitchChange < 0.75) {
                            currentState = 'normal';
                        } else {
                            // 고개를 안 숙였다면 기존 로직대로 거북목 검사 진행
                            if (earChange >= 1.06) {
                                currentState = 'danger';  // 6% 이상 전진
                            } else if (earChange >= 1.03) {
                                currentState = 'warning'; // 3% 이상 전진
                            }
                        }

                        // 히스토리에 저장 (최근 3프레임 유지)
                        historyRef.current.push(currentState);
                        if (historyRef.current.length > 3) {
                            historyRef.current.shift();
                        }

                        // 상태 안정화 로직 (깜빡임 방지)
                        const dangerCount = historyRef.current.filter((s) => s === 'danger').length;
                        const warningCount = historyRef.current.filter((s) => s === 'warning').length;

                        let confirmedState = 'normal';
                        if (dangerCount >= 2) {
                            confirmedState = 'danger';
                        } else if (dangerCount + warningCount >= 2) {
                            confirmedState = 'warning';
                        }

                        // 상태가 바뀌었을 때만 App.jsx로 알림
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

        // 주요 좌표 추출
        const nose = landmarks[0];
        const leftEye = landmarks[2];
        const rightEye = landmarks[5];
        const leftEar = landmarks[7];
        const rightEar = landmarks[8];
        const leftMouth = landmarks[9];
        const rightMouth = landmarks[10];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        const faceWidth = calculateDistance(leftEar, rightEar);
        const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);

        if (shoulderWidth === 0) return;

        // 거북목 기준 비율 저장
        const baselineRatio = faceWidth / shoulderWidth;

        // 💡 고개 숙임 기준 비율(Pitch) 계산 및 저장
        const midEyeY = (leftEye.y + rightEye.y) / 2;
        const midMouthY = (leftMouth.y + rightMouth.y) / 2;
        const upperFaceHeight = nose.y - midEyeY;
        const lowerFaceHeight = midMouthY - nose.y;
        const baselinePitch = upperFaceHeight > 0 ? (lowerFaceHeight / upperFaceHeight) : 1;

        setCalibrationData({ ratio: baselineRatio, pitchRatio: baselinePitch });
        calibrationDataRef.current = { ratio: baselineRatio, pitchRatio: baselinePitch };

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
        setIsFhpWarning('normal');
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