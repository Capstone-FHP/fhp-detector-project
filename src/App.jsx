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
          else setUserName(currentUser.displayName || '고객');
        } catch (error) {
          setUserName(currentUser.displayName || '고객');
        }
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
      setScreen('home');
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const getBgColor = () => {
    if (screen !== 'camera') return "bg-slate-50";
    if (fhpState === 'danger') return "bg-red-50";
    if (fhpState === 'warning') return "bg-orange-50";
    return "bg-slate-50";
  };

  const handleStartClick = () => {
    if (user) setScreen('camera');
    else setScreen('auth_choice');
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-700 font-sans text-slate-800 ${getBgColor()}`}>

      {/* 🏥 [구조 변경] 더 전문적인 느낌의 상단 헤더 */}
      <header className="w-full h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-50 shadow-sm">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => { setScreen('home'); setFhpState('normal'); }}
        >
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-md">
            🩺
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            FHP <span className="text-blue-600 font-bold">Monitor</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-100 px-5 py-2.5 rounded-full border border-slate-200">
              <span className="font-semibold text-slate-700">
                <strong className="text-blue-700 font-bold">{userName}</strong>님
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-slate-500 hover:text-red-500 transition ml-2"
              >
                로그아웃
              </button>
            </div>
          ) : (
            screen === 'home' && (
              <button
                onClick={() => setScreen('login')}
                className="font-bold text-blue-600 bg-blue-50 px-6 py-2.5 rounded-full hover:bg-blue-100 transition"
              >
                파트너 로그인
              </button>
            )
          )}
        </div>
      </header>

      {/* 🏥 [구조 변경] 메인 영역: 가운데 정렬 해제, 탑다운 배치 */}
      <main className="flex-1 w-full relative min-h-0 overflow-y-auto pt-10 px-10 pb-10">

        {/* 1. 홈 화면 (와이드 스플릿 구조) */}
        {screen === 'home' && (
          <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center animate-fadeIn">

            {/* 왼쪽: 메인 영웅 섹션 (Text & CTA) */}
            <div className="lg:col-span-3 flex flex-col items-start text-left p-8">
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-blue-200">
                AI 기반 경추 건강 관리 시스템
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold text-slate-950 mb-6 tracking-tighter leading-[1.1]">
                거북목,<br />실시간 AI로<br /><span className="text-blue-600">스마트하게</span> 교정하세요.
              </h2>
              <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl break-keep">
                따로 시간을 낼 필요 없습니다. 업무 중, 공부 중 카메라만 켜두세요. 전문 의학 지식을 학습한 AI가 당신의 자세를 실시간으로 분석하여 바른 자세를 유지하도록 돕습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg">
                <button
                  onClick={handleStartClick}
                  className="flex-1 py-6 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  🚀 지금 무료로 측정하기
                </button>
                <button disabled className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-2xl font-medium text-lg border border-slate-200 cursor-not-allowed">
                  내 리포트 (준비 중)
                </button>
              </div>
            </div>

            {/* 오른쪽: 서비스 특징 카드 배열 (공간 활용) */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <FeatureCard icon="📸" title="실시간 감지" desc="웹캠을 통한 즉각적인 자세 분석" />
              <FeatureCard icon="⚠️" title="정밀 경고" desc="3초 이상 유지 시 알림 전송" />
              <FeatureCard icon="📊" title="누적 통계" desc="회원 대상 건강 리포트 제공" />
              <FeatureCard icon="🧩" title="PIP 모드" desc="다른 작업 중에도 모니터링 유지" />
            </div>
          </div>
        )}

        {/* 2. 로그인 선택 화면 (심플 와이드 카드) */}
        {screen === 'auth_choice' && (
          <div className="w-full max-w-6xl mx-auto bg-white p-16 rounded-[2.5rem] shadow-sm border border-slate-100 text-center animate-fadeIn mt-10">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">측정 모드를 선택하세요</h2>
            <p className="text-lg text-slate-500 mb-16 max-w-xl mx-auto">더 정확한 분석과 누적 리포트 서비스를 위해<br />회원 측정을 권장합니다.</p>

            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <AuthOptionCard
                title="회원 정밀 측정 (권장)"
                desc="데이터 저장, AI 분석 리포트 및 통계 제공"
                icon="🔒"
                onClick={() => setScreen('login')}
                primary
              />
              <AuthOptionCard
                title="비회원 1회 체험"
                desc="데이터 저장 없이 실시간 감지 기능만 체험"
                icon="👀"
                onClick={() => setScreen('camera')}
              />
            </div>
          </div>
        )}

        {/* 3. 로그인 화면 */}
        {screen === 'login' && (
          <div className="w-full max-w-xl mx-auto animate-fadeIn bg-white p-12 rounded-3xl shadow-sm border border-slate-100 mt-10">
            <Login />
            <div className="text-center mt-10 pt-6 border-t border-slate-100">
              <button onClick={() => setScreen('auth_choice')} className="text-base font-semibold text-slate-500 hover:text-blue-600 transition underline underline-offset-4">
                ⬅️ 뒤로 가기
              </button>
            </div>
          </div>
        )}

        {/* 4. 카메라 측정 화면 (대시보드 구조의 핵심) */}
        {screen === 'camera' && (
          <div className="w-full h-full animate-fadeIn">
            <CameraView fhpState={fhpState} setFhpState={setFhpState} user={user} />
          </div>
        )}
      </main>
    </div>
  );
}

// 💡 [컴포넌트 추가] 홈 화면 특징 카드
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-start text-left">
      <div className="text-3xl mb-4">{icon}</div>
      <h4 className="text-lg font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed break-keep">{desc}</p>
    </div>
  )
}

// 💡 [컴포넌트 추가] 로그인 선택 카드
function AuthOptionCard({ title, desc, icon, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-10 rounded-3xl transition shadow-sm hover:shadow-xl flex flex-col items-center justify-center transform hover:-translate-y-1 ${primary ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50'}`}
    >
      <span className="text-5xl mb-6">{icon}</span>
      <span className="text-2xl font-bold mb-3 tracking-tight">{title}</span>
      <span className={`text-base font-medium leading-relaxed ${primary ? 'text-blue-100' : 'text-slate-400'}`}>{desc}</span>
    </button>
  )
}