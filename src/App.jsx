import { useState, useEffect } from 'react';
// 👇 방금 추가한 db 부품과 문서 읽기(doc, getDoc) 도구 불러오기
import { auth, db } from './services/firebase.config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from './components/Login';
import CameraView from './components/CameraView';

export default function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); // 📝 DB에서 가져온 '진짜 이름'을 담을 공간
  const [isFhpWarning, setIsFhpWarning] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // 💡 유저가 로그인했다면? DB로 달려가서 이름을 찾아옵니다!
      if (currentUser) {
        try {
          // ⚠️ 중요: 팀원분이 데이터를 어떻게 저장했는지에 따라 아래 "users"와 currentUser.uid 부분이 다를 수 있습니다.
          // 보통 'users'라는 폴더(컬렉션) 안에 유저의 고유번호(uid)나 이메일(email)로 문서를 만듭니다.
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // DB에 문서가 있으면, 그 안의 'name' 필드를 가져와서 저장!
            setUserName(userDoc.data().name);
          } else {
            // 혹시 DB에 없으면 웹에서 가입했던 임시 이름을 보여줌
            setUserName(currentUser.displayName || '이름없음');
          }
        } catch (error) {
          console.error("DB에서 이름 가져오기 실패:", error);
          setUserName(currentUser.displayName || '알 수 없음');
        }
      } else {
        setUserName(''); // 로그아웃하면 이름 지우기
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

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-500 ${isFhpWarning ? "bg-red-100" : "bg-gray-100"}`}>

      {/* 상단 헤더 영역 (이제 user.displayName 대신 userName을 띄웁니다!) */}
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

      <h1 className="text-5xl font-bold text-blue-600 mb-6 text-center">
        FHP Detector 🐢
      </h1>

      {!user ? (
        <Login />
      ) : (
        <CameraView isFhpWarning={isFhpWarning} setIsFhpWarning={setIsFhpWarning} />
      )}

    </div>
  );
}