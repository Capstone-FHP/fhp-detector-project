import { useState, useRef, useEffect, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function useFhpDetector(setFhpState) {
    const [isAiLoaded, setIsAiLoaded] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [calibrationData, setCalibrationData] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceLandmarkerRef = useRef(null);

    const currentDataRef = useRef(null);
    const requestRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);

    const isMeasuringRef = useRef(false);

    // AI 모델 초기화
    useEffect(() => {
        const initModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    },
                    outputFaceBlendshapes: false,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                faceLandmarkerRef.current = landmarker;
                setIsAiLoaded(true);
            } catch (error) {
                console.error("AI 모델 로딩 실패:", error);
            }
        };
        initModel();

        return () => {
            if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const predict = useCallback(() => {
        if (!isMeasuringRef.current || !videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let startTimeMs = performance.now();

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];

                const leftEar = landmarks[234];
                const rightEar = landmarks[454];
                const midEye = landmarks[168];
                const nose = landmarks[1];
                const chin = landmarks[152];

                // 💡 [복구됨] 복잡한 상하 비율 계산(Pitch)을 모두 지우고, 순수하게 귀 사이의 거리(얼굴 크기)만 잽니다.
                const faceWidth = Math.sqrt(Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2));

                currentDataRef.current = { faceWidth };

                if (calibrationData) {
                    const distanceRatio = faceWidth / calibrationData.faceWidth;

                    // 💡 [복구됨] 고개 숙임 예외 처리 없이, 화면으로 다가오면 무조건 즉각 반응합니다!
                    if (distanceRatio > 1.10) setFhpState('danger');       // 10% 가까워짐
                    else if (distanceRatio > 1.04) setFhpState('warning'); // 4% 가까워짐
                    else setFhpState('normal');
                }

                ctx.fillStyle = '#00FF00';
                [leftEar, rightEar, midEye, nose, chin].forEach(pt => {
                    ctx.beginPath();
                    ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3, 0, 2 * Math.PI);
                    ctx.fill();
                });
            } else {
                currentDataRef.current = null;
            }
            ctx.restore();
        }

        if (isMeasuringRef.current) {
            requestRef.current = requestAnimationFrame(predict);
        }
    }, [calibrationData, setFhpState]);

    const startMeasurement = useCallback(async () => {
        if (!videoRef.current) return;

        setIsMeasuring(true);
        isMeasuringRef.current = true;
        setFhpState('normal');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            videoRef.current.srcObject = stream;

            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play().then(() => {
                    if (canvasRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                    predict();
                }).catch(e => console.error("카메라 재생 실패:", e));
            };
        } catch (err) {
            console.error("카메라 접근 권한이 없습니다.", err);
        }
    }, [predict, setFhpState]);

    const stopMeasurement = useCallback(() => {
        setIsMeasuring(false);
        isMeasuringRef.current = false;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setCalibrationData(null);
        currentDataRef.current = null;
    }, []);

    const calibrate = useCallback(() => {
        if (currentDataRef.current) {
            setCalibrationData({
                faceWidth: currentDataRef.current.faceWidth
            });
            setFhpState('normal');

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        } else {
            alert("얼굴이 인식되지 않았습니다. 카메라 정면을 바라보세요.");
        }
    }, [setFhpState]);

    return {
        isAiLoaded,
        isMeasuring,
        calibrationData,
        videoRef,
        canvasRef,
        startMeasurement,
        stopMeasurement,
        calibrate
    };
}