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
      } else {
        setUserName('');
        setScreen('home');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error("로그아웃 실패:", error); }
  };

  const getBgColor = () => {
    if (!user || screen === 'home') return "bg-gray-100";
    if (fhpState === 'danger') return "bg-red-200";
    if (fhpState === 'warning') return "bg-orange-200";
    return "bg-gray-100";
  };

  return (
    // 💡 화면 꽉 차게 고정 (h-screen, overflow-hidden)
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

      {!user ? (
        <div className="flex-1 flex items-center justify-center w-full"><Login /></div>
      ) : screen === 'home' ? (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-6 bg-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800">무엇을 하시겠습니까?</h2>
            <p className="text-gray-500 mb-4">현재 노트북이나 PC를 사용 중이시라면<br />자세를 측정해 보세요!</p>
            <button
              onClick={() => setScreen('camera')}
              className="w-full px-8 py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 transition"
            >
              📸 거북목 측정 시작하기
            </button>
            <button disabled className="w-full px-8 py-4 bg-gray-200 text-gray-400 rounded-2xl font-bold text-lg cursor-not-allowed">
              📊 내 측정 통계 보기 (준비 중)
            </button>
          </div>
        </div>
      ) : (
        // 💡 카메라 화면이 스크롤을 안 만들고 남은 공간(flex-1 min-h-0)에 쏙 들어가게 조절
        <div className="w-full flex-1 flex flex-col items-center relative max-w-4xl min-h-0">
          <button
            onClick={() => { setScreen('home'); setFhpState('normal'); }}
            className="self-start mb-4 px-5 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-100 font-bold flex items-center gap-2 shadow-md transition shrink-0"
          >
            ⬅️ 메인으로 돌아가기
          </button>

          {/* 하위 컴포넌트(CameraView)가 영역 안에서 꽉 차도록 공간 마련 */}
          <div className="w-full flex-1 min-h-0 flex justify-center pb-4">
            <CameraView fhpState={fhpState} setFhpState={setFhpState} />
          </div>
        </div>
      )}
    </div>
  );
}