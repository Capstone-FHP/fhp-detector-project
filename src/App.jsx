import { useState, useRef, useEffect } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

// 👇 추가된 Firebase 로그인 관련 부품들
import { auth, googleProvider } from './services/firebase.config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// 두 점 사이의 거리를 구하는 수학 공식
const calculateDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

export default function App() {
  // 👇 유저 로그인 상태를 저장할 공간 추가
  const [user, setUser] = useState(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isAiLoaded, setIsAiLoaded] = useState(false);

  // 🐢 거북목 판별을 위한 상태들
  const [calibrationData, setCalibrationData] = useState(null); // 영점(기준점) 데이터
  const [isFhpWarning, setIsFhpWarning] = useState(false);      // 거북목 경고 상태

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // 최신 프레임의 뼈대 정보를 저장할 바구니 (영점 조절 버튼을 누를 때 꺼내 씀)
  const currentLandmarksRef = useRef(null);

  // 스무딩 로직을 위한 바구니 (최근 3번의 결과를 담음)
  const historyRef = useRef([]);
  // 화면 깜빡임 방지를 위해 현재 경고 상태를 기억하는 변수
  const warningStateRef = useRef(false);

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

  // 👇 앱이 켜질 때 로그인 상태 확인하기 추가
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // 로그인된 유저 정보 저장
    });
    return () => unsubscribe();
  }, []);

  // 👇 구글 로그인 / 로그아웃 함수 추가
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      stopMeasurement(); // 로그아웃 시 카메라도 끄기
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

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
        const landmarks = result.landmarks[0]; // 첫 번째 사람의 뼈대 정보
        currentLandmarksRef.current = landmarks; // 영점 조절을 위해 최신 정보 업데이트

        // 1. 뼈대 그리기
        drawingUtils.drawLandmarks(landmarks, { radius: 4, color: "#FF0000" });
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 3,
        });

        // 2. 🐢 실시간 거북목 분석 로직 (영점 조절이 완료된 상태일 때만)
        if (calibrationData) {
          const leftEar = landmarks[7];
          const rightEar = landmarks[8];
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];

          // 현재 얼굴 너비와 어깨너비 계산
          const currentFaceWidth = calculateDistance(leftEar, rightEar);
          const currentShoulderWidth = calculateDistance(leftShoulder, rightShoulder);
          const currentRatio = currentFaceWidth / currentShoulderWidth;

          // 1.1배(10%) 이상 커졌는지 확인 (앞으로 쏠림)
          const isForwardLeaning = currentRatio > calibrationData.ratio * 1.1;

          // 스무딩 로직: 최근 3번의 결과 바구니에 담기
          historyRef.current.push(isForwardLeaning);
          if (historyRef.current.length > 3) {
            historyRef.current.shift(); // 3개가 넘으면 가장 오래된 것 버리기
          }

          // 3번 중 2번 이상 거북목으로 판별되었는가?
          const fhpCount = historyRef.current.filter((isFhp) => isFhp === true).length;
          const isConfirmedFhp = fhpCount >= 2;

          // 상태가 바뀌었을 때만 리액트 상태 업데이트 (성능 최적화)
          if (warningStateRef.current !== isConfirmedFhp) {
            warningStateRef.current = isConfirmedFhp;
            setIsFhpWarning(isConfirmedFhp);
          }
        }
      }
      canvasCtx.restore();
    }

    animationRef.current = requestAnimationFrame(predictWebcam);
  };

  // 🎯 영점 조절 (Calibration) 함수
  const calibrate = () => {
    const landmarks = currentLandmarksRef.current;
    if (!landmarks) {
      alert("자세가 인식되지 않았습니다. 카메라 정면에 서주세요.");
      return;
    }

    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    const faceWidth = calculateDistance(leftEar, rightEar);
    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);

    // 바른 자세일 때의 (얼굴 너비 / 어깨 너비) 비율 저장
    const baselineRatio = faceWidth / shoulderWidth;

    setCalibrationData({ ratio: baselineRatio });
    historyRef.current = []; // 스무딩 바구니 초기화
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
    setCalibrationData(null); // 측정 종료 시 영점 데이터도 초기화
    setIsFhpWarning(false);
  };

  useEffect(() => {
    if (isMeasuring && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadeddata = () => {
        predictWebcam();
      };
    }
  }, [isMeasuring]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
    };
  }, []);

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-500 ${isFhpWarning ? "bg-red-100" : "bg-gray-100"
      }`}>

      {/* 상단 헤더 영역 (유저 정보 표시) */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {user && (
          <>
            <span className="font-bold text-gray-700">{user.displayName}님 환영합니다!</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-bold">
              로그아웃
            </button>
          </>
        )}
      </div>

      <h1 className="text-5xl font-bold text-blue-600 mb-6 text-center">
        FHP Detector 🐢
      </h1>

      {/* 🛑 로그인 안 한 상태면 로그인 버튼만 보여주기 */}
      {!user ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4">서비스를 이용하려면 로그인이 필요합니다</h2>
          <button
            onClick={handleLogin}
            className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Google 계정으로 로그인
          </button>
        </div>
      ) : !isMeasuring ? (
        // ✅ 로그인 했고, 측정 시작 전 화면
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
        // ✅ 측정 중인 화면 (카메라 뷰)
        <div className="flex flex-col items-center w-full max-w-3xl">
          {/* 상태 알림창 */}
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
        </div>
      )}
    </div>
  )
}