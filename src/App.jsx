import { useState, useEffect } from 'react';
import { auth, db } from './services/firebase.config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from './components/Login';
import CameraView from './components/CameraView';

export default function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // 💡 1. 상태 이름을 fhpState로 변경하고 기본값을 'normal'로 둡니다.
  const [fhpState, setFhpState] = useState('normal');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserName(userDoc.data().name);
          } else {
            setUserName(currentUser.displayName || '이름없음');
          }
        } catch (error) {
          console.error("DB에서 이름 가져오기 실패:", error);
          setUserName(currentUser.displayName || '알 수 없음');
        }
      } else {
        setUserName('');
      }
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

  // 🎨 2. 상태에 맞춰 배경색을 예쁘게 정해주는 함수
  const getBgColor = () => {
    if (fhpState === 'danger') return "bg-red-200";    // 빨간불 (약 5cm 이상)
    if (fhpState === 'warning') return "bg-orange-200"; // 주황불 (약 2.5cm 이상)
    return "bg-gray-100";                               // 정상 (회색)
  };

  return (
    // 배경색에 getBgColor() 적용! 부드럽게 변하도록 duration-700 설정
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-700 ${getBgColor()}`}>

      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        {user && (
          <>
            <span className="font-bold text-gray-700">{userName}님 환영합니다!</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-bold">
              로그아웃
            </button>
          </>
        )}
      </div>

      <h1 className="text-5xl font-bold text-blue-600 mb-6 text-center shadow-sm">
        FHP Detector 🐢
      </h1>

      {!user ? (
        <Login />
      ) : (
        // 💡 3. CameraView에 새롭게 바뀐 이름표(fhpState)를 전달합니다.
        <CameraView fhpState={fhpState} setFhpState={setFhpState} />
      )}

    </div>
  );
}