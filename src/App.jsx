import { useState, useEffect } from 'react';
import { auth, db } from './services/firebase.config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from './components/Login';
import CameraView from './components/CameraView';

export default function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [fhpState, setFhpState] = useState('normal');
  // 💡 화면 상태: 'home', 'auth_choice', 'login', 'camera' 4가지로 관리합니다.
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) setUserName(userDoc.data().name);
          else setUserName(currentUser.displayName || '이름없음');
        } catch (error) {
          setUserName(currentUser.displayName || '알 수 없음');
        }
        // 💡 로그인에 성공하면 선택창이나 로그인창을 건너뛰고 바로 카메라로 보냅니다!
        if (screen === 'login' || screen === 'auth_choice') {
          setScreen('camera');
        }
      } else {
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, [screen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setScreen('home'); // 로그아웃하면 무조건 메인으로 쫓아냄
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const getBgColor = () => {
    if (screen === 'home' || screen === 'auth_choice' || screen === 'login') return "bg-gray-100";
    if (fhpState === 'danger') return "bg-red-200";
    if (fhpState === 'warning') return "bg-orange-200";
    return "bg-gray-100";
  };

  // 💡 "시작하기" 버튼을 눌렀을 때의 로직
  const handleStartClick = () => {
    if (user) {
      // 이미 로그인된 상태면 묻지 않고 바로 카메라로!
      setScreen('camera');
    } else {
      // 로그인이 안 되어있으면 선택창을 띄워줌!
      setScreen('auth_choice');
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden flex-col items-center p-6 transition-colors duration-700 ${getBgColor()}`}>

      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        {user && (
          <>
            <span className="font-bold text-gray-700 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
              {userName}님 환영합니다!
            </span>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-bold transition shadow-sm">
              로그아웃
            </button>
          </>
        )}
      </div>

      <h1 className="text-4xl font-bold text-blue-600 mb-6 shrink-0 drop-shadow-sm cursor-pointer" onClick={() => setScreen('home')}>
        FHP Detector 🐢
      </h1>

      {/* 1. 메인 홈 화면 */}
      {screen === 'home' && (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-6 bg-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800">거북목, 지금 확인해보세요!</h2>
            <p className="text-gray-500 mb-4">카메라만 있으면 10초 만에<br />나의 목 상태를 측정할 수 있습니다.</p>
            <button
              onClick={handleStartClick}
              className="w-full px-8 py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 transition"
            >
              🚀 시작하기
            </button>
          </div>
        </div>
      )}

      {/* 2. 로그인 여부 선택 화면 */}
      {screen === 'auth_choice' && (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-4 bg-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">어떻게 시작할까요?</h2>

            <button
              onClick={() => setScreen('login')}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-md hover:bg-blue-700 transition flex flex-col items-center"
            >
              <span>🔒 100% 활용하기 (권장)</span>
              <span className="text-sm font-normal text-blue-200 mt-1">로그인하고 통계 데이터 저장하기</span>
            </button>

            <div className="w-full relative flex items-center justify-center my-2">
              <hr className="w-full border-gray-300" />
              <span className="absolute bg-white px-3 text-gray-400 text-sm">또는</span>
            </div>

            <button
              onClick={() => setScreen('camera')}
              className="w-full px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg shadow-sm hover:bg-gray-200 transition border-2 border-transparent flex flex-col items-center"
            >
              <span>👀 비회원으로 체험하기</span>
              <span className="text-sm font-normal text-gray-400 mt-1">데이터 저장 없이 실시간 감지만 이용</span>
            </button>

            <button onClick={() => setScreen('home')} className="mt-4 text-gray-400 underline hover:text-gray-600">
              뒤로 가기
            </button>
          </div>
        </div>
      )}

      {/* 3. 로그인 화면 */}
      {screen === 'login' && (
        <div className="flex-1 flex items-center justify-center w-full relative">
          <button onClick={() => setScreen('auth_choice')} className="absolute top-0 left-4 text-gray-500 font-bold hover:text-gray-800">
            ⬅️ 이전으로
          </button>
          <Login />
        </div>
      )}

      {/* 4. 카메라 측정 화면 */}
      {screen === 'camera' && (
        <div className="w-full flex-1 flex flex-col items-center relative max-w-4xl min-h-0">
          <button
            onClick={() => { setScreen('home'); setFhpState('normal'); }}
            className="self-start mb-4 px-5 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-100 font-bold flex items-center gap-2 shadow-md transition shrink-0"
          >
            ⬅️ 메인으로 돌아가기
          </button>
          <div className="w-full flex-1 min-h-0 flex justify-center pb-4">
            <CameraView fhpState={fhpState} setFhpState={setFhpState} user={user} />
          </div>
        </div>
      )}

    </div>
  );
}