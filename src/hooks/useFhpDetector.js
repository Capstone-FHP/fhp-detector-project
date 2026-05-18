import { useState, useRef, useEffect, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export function useFhpDetector(setFhpState) {
    const [isAiLoaded, setIsAiLoaded] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [calibrationData, setCalibrationData] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);

    // 현재 프레임의 측정 데이터를 잠시 담아둘 ref
    const currentDataRef = useRef(null);

    // AI 모델 초기화
    useEffect(() => {
        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        // 모델 로딩 완료 처리 (가벼운 웜업)
        faceMesh.initialize().then(() => {
            setIsAiLoaded(true);
        });

        return () => {
            if (cameraRef.current) cameraRef.current.stop();
            if (faceMeshRef.current) faceMeshRef.current.close();
        };
    }, []);

    // 💡 핵심 AI 분석 로직 (매 프레임마다 실행됨)
    const onResults = (results) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (!canvasCtx || !canvasRef.current || !videoRef.current) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // 1. 주요 랜드마크 추출
            const leftEar = landmarks[234];
            const rightEar = landmarks[454];
            const midEye = landmarks[168]; // 미간
            const nose = landmarks[1];     // 코끝
            const chin = landmarks[152];   // 턱끝

            // 2. 거리(Z축 대용) 계산: 양 귀 사이의 거리 (가까워지면 거리가 길어짐 = 얼굴이 커짐)
            const faceWidth = Math.sqrt(Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2));

            // 💡 3. 고개 숙임(Pitch) 감지를 위한 비율 계산
            const upperFaceHeight = nose.y - midEye.y;
            const lowerFaceHeight = chin.y - nose.y;
            // 아랫얼굴 / 윗얼굴 비율 (고개를 숙이면 이 비율이 급격히 작아짐)
            const pitchRatio = lowerFaceHeight / upperFaceHeight;

            currentDataRef.current = { faceWidth, pitchRatio };

            // 4. 영점 조절 데이터가 있을 때만 거북목 판별 수행
            if (calibrationData) {
                // 얼마나 다가왔나? (현재 얼굴 크기 / 정자세 얼굴 크기)
                const distanceRatio = faceWidth / calibrationData.faceWidth;

                // 고개 각도가 얼마나 꺾였나? (현재 비율 / 정자세 비율)
                const pitchDiffRatio = pitchRatio / calibrationData.pitchRatio;

                // 💡 [핵심 예외 처리] 고개를 확 숙인 경우 (비율이 75% 이하로 떨어짐)
                // 모니터로 다가간(거북목) 게 아니라 단순 고개 숙임으로 간주하여 정상 처리!
                if (pitchDiffRatio < 0.75) {
                    setFhpState('normal');
                }
                // 고개를 숙이지 않은 상태에서 얼굴이 모니터로 확 다가온 경우 (진짜 거북목)
                else {
                    if (distanceRatio > 1.15) { // 15% 이상 다가옴 (위험)
                        setFhpState('danger');
                    } else if (distanceRatio > 1.05) { // 5~15% 다가옴 (주의)
                        setFhpState('warning');
                    } else { // 정상 범위
                        setFhpState('normal');
                    }
                }
            }

            // 시각적 피드백 (얼굴에 점 찍기)
            canvasCtx.fillStyle = '#00FF00';
            [leftEar, rightEar, midEye, nose, chin].forEach(pt => {
                canvasCtx.beginPath();
                canvasCtx.arc(pt.x * canvasRef.current.width, pt.y * canvasRef.current.height, 3, 0, 2 * Math.PI);
                canvasCtx.fill();
            });
        } else {
            // 사람이 안 보이면 상태 유지 (또는 알림)
            currentDataRef.current = null;
        }
        canvasCtx.restore();
    };

    const startMeasurement = useCallback(() => {
        if (!videoRef.current || !faceMeshRef.current) return;
        setIsMeasuring(true);
        setFhpState('normal');

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await faceMeshRef.current.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480
        });

        camera.start();
        cameraRef.current = camera;
    }, [setFhpState]);

    const stopMeasurement = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
        }
        setIsMeasuring(false);
        setCalibrationData(null);
        currentDataRef.current = null;
    }, []);

    const calibrate = useCallback(() => {
        if (currentDataRef.current) {
            setCalibrationData({
                faceWidth: currentDataRef.current.faceWidth,
                pitchRatio: currentDataRef.current.pitchRatio
            });
            setFhpState('normal'); // 영점 조절 즉시 정상 상태로 리셋

            // 시각적 피드백 효과 (옵션)
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