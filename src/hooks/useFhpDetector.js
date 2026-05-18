import { useState, useRef, useEffect, useCallback } from 'react';
// 💡 [변경됨] 최신 모던 라이브러리 tasks-vision 사용!
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

    // 비동기 루프에서 상태를 안전하게 추적하기 위한 Ref
    const isMeasuringRef = useRef(false);

    // 💡 1. 최신 AI 모델 초기화 (Vercel 빌드 에러 없음!)
    useEffect(() => {
        const initModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
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

    // 💡 2. 매 프레임 분석 로직 (고개 숙임 방지 로직 그대로 유지!)
    const predict = useCallback(() => {
        if (!isMeasuringRef.current || !videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let startTimeMs = performance.now();

        // 프레임이 업데이트 되었을 때만 분석 실행
        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            // 💡 [변경됨] 최신 tasks-vision의 분석 함수
            const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 캔버스 좌우 반전 (거울 모드)
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];

                // 주요 랜드마크 추출
                const leftEar = landmarks[234];
                const rightEar = landmarks[454];
                const midEye = landmarks[168];
                const nose = landmarks[1];
                const chin = landmarks[152];

                // 거리(Z축 대용) 및 고개 숙임(Pitch) 비율 계산
                const faceWidth = Math.sqrt(Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2));
                const upperFaceHeight = nose.y - midEye.y;
                const lowerFaceHeight = chin.y - nose.y;
                const pitchRatio = lowerFaceHeight / upperFaceHeight;

                currentDataRef.current = { faceWidth, pitchRatio };

                // 거북목 판별 (영점 조절 데이터가 있을 때)
                if (calibrationData) {
                    const distanceRatio = faceWidth / calibrationData.faceWidth;
                    const pitchDiffRatio = pitchRatio / calibrationData.pitchRatio;

                    // 고개를 확 숙인 경우 (25% 이상 비율 감소) -> 정상 처리
                    if (pitchDiffRatio < 0.75) {
                        setFhpState('normal');
                    } else {
                        // 얼굴이 모니터로 다가온 경우
                        if (distanceRatio > 1.15) setFhpState('danger');
                        else if (distanceRatio > 1.05) setFhpState('warning');
                        else setFhpState('normal');
                    }
                }

                // 시각적 피드백 (얼굴에 점 찍기)
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

        // 반복 루프
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
            // 💡 [변경됨] camera_utils를 버리고 브라우저 기본 웹캠 API 사용
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
                if (canvasRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                }
                predict(); // 루프 시작!
            });
        } catch (err) {
            console.error("카메라 접근 권한이 없습니다.", err);
        }
    }, [predict, setFhpState]);

    const stopMeasurement = useCallback(() => {
        setIsMeasuring(false);
        isMeasuringRef.current = false;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        // 카메라 스트림 종료
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
                faceWidth: currentDataRef.current.faceWidth,
                pitchRatio: currentDataRef.current.pitchRatio
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