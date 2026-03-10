import { useState, useEffect } from 'react';
import { auth } from './services/firebase.config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";

// 만들어둔 조각(컴포넌트) 불러오기
import Login from './components/Login';
import CameraView from './components/CameraView';

export default function App() {
  const [user, setUser] = useState(null);
  const [isFhpWarning, setIsFhpWarning] = useState(false); // 전체 배경색 변경용 상태

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-500 ${isFhpWarning ? "bg-red-100" : "bg-gray-100"}`}>

      {/* 상단 헤더 영역 (유저 정보 표시) */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
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

      {/* 조립부: 로그인이 안 되어있으면 <Login />, 되어있으면 <CameraView /> 출력 */}
      {!user ? (
        <Login />
      ) : (
        <CameraView isFhpWarning={isFhpWarning} setIsFhpWarning={setIsFhpWarning} />
      )}

    </div>
  );
}