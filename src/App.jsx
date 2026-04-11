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
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        if (screen === 'login' || screen === 'auth_choice') setScreen('camera');
      } else {
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, [screen]);

  const handleLogout = async () => {
    try { await signOut(auth); setScreen('home'); }
    catch (error) { console.error("로그아웃 실패:", error); }
  };

  const getBgColor = () => {
    if (screen !== 'camera') return "bg-slate-50 dark:bg-slate-950";
    if (fhpState === 'danger') return "bg-red-50 dark:bg-red-950/30";
    if (fhpState === 'warning') return "bg-orange-50 dark:bg-orange-950/30";
    return "bg-slate-50 dark:bg-slate-950";
  };

  const handleStartClick = () => {
    if (user) setScreen('camera');
    else setScreen('auth_choice');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-700 font-sans text-slate-800 dark:text-slate-100 ${getBgColor()}`}>

        {/* 🏥 헤더: 높이를 살짝 줄여서(h-16) 메인 공간 확보 */}
        <header className="w-full h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 shrink-0 z-50 shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setScreen('home'); setFhpState('normal'); }}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">🩺</div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              FHP <span className="text-blue-500 font-bold">Monitor</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <div className="flex items-center gap-2 md:gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-sm md:text-base text-slate-700 dark:text-slate-300">
                  <strong className="text-blue-600 dark:text-blue-400">{userName}</strong>님
                </span>
                <button onClick={handleLogout} className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition ml-1">
                  로그아웃
                </button>
              </div>
            ) : (
              screen === 'home' && (
                <button onClick={() => setScreen('login')} className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-5 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                  로그인
                </button>
              )
            )}
          </div>
        </header>

        {/* 🏥 메인: 카메라 화면일 때는 패딩을 줄이고 전체 스크롤을 막습니다! */}
        <main className={`flex-1 w-full relative min-h-0 ${screen === 'camera' ? 'overflow-hidden p-4 md:p-6' : 'overflow-y-auto p-6 md:p-10'}`}>

          {screen === 'home' && (
            <div className="w-full h-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-3 flex flex-col items-start text-left p-4 md:p-8">
                <div className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-blue-200 dark:border-blue-800/50">
                  AI 기반 경추 건강 관리 시스템
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-slate-950 dark:text-white mb-4 tracking-tighter leading-[1.1]">
                  거북목,<br />실시간 AI로<br /><span className="text-blue-600 dark:text-blue-400">스마트하게</span> 교정하세요.
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl break-keep">
                  따로 시간을 낼 필요 없습니다. 업무 중, 공부 중 카메라만 켜두세요. 전문 의학 지식을 학습한 AI가 당신의 자세를 실시간으로 분석하여 바른 자세를 유지하도록 돕습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                  <button onClick={handleStartClick} className="flex-1 py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                    🚀 시작하기
                  </button>
                  <button disabled className="flex-1 py-4 md:py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-medium text-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                    내 리포트 (준비 중)
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                <FeatureCard icon="📸" title="실시간 감지" desc="즉각적인 자세 분석" />
                <FeatureCard icon="⚠️" title="정밀 경고" desc="3초 이상 시 알림" />
                <FeatureCard icon="📊" title="누적 통계" desc="건강 리포트 제공" />
                <FeatureCard icon="🧩" title="PIP 모드" desc="모니터링 유지" />
              </div>
            </div>
          )}

          {screen === 'auth_choice' && (
            <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 text-center animate-fadeIn">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">측정 모드를 선택하세요</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10">더 정확한 분석과 누적 리포트 서비스를 위해 회원 측정을 권장합니다.</p>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <AuthOptionCard title="회원 정밀 측정 (권장)" desc="데이터 저장, 통계 제공" icon="🔒" onClick={() => setScreen('login')} primary />
                <AuthOptionCard title="비회원 1회 체험" desc="데이터 저장 없이 체험" icon="👀" onClick={() => setScreen('camera')} />
              </div>
              <button onClick={() => setScreen('home')} className="mt-8 text-slate-400 hover:text-blue-600 transition underline underline-offset-4">⬅️ 뒤로 가기</button>
            </div>
          )}

          {screen === 'login' && (
            <div className="w-full max-w-md mx-auto animate-fadeIn bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mt-4 md:mt-10">
              <Login />
              <div className="text-center mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setScreen('auth_choice')} className="text-slate-500 hover:text-blue-600 transition underline underline-offset-4">⬅️ 뒤로 가기</button>
              </div>
            </div>
          )}

          {screen === 'camera' && (
            <div className="w-full h-full animate-fadeIn">
              <CameraView fhpState={fhpState} setFhpState={setFhpState} user={user} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-start">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-base font-bold mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 break-keep">{desc}</p>
    </div>
  )
}

function AuthOptionCard({ title, desc, icon, onClick, primary }) {
  return (
    <button onClick={onClick} className={`flex-1 p-8 rounded-3xl transition shadow-sm hover:shadow-lg flex flex-col items-center justify-center transform hover:-translate-y-1 ${primary ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'}`}>
      <span className="text-4xl mb-4">{icon}</span>
      <span className="text-xl font-bold mb-2">{title}</span>
      <span className={`text-sm ${primary ? 'text-blue-100' : 'text-slate-400'}`}>{desc}</span>
    </button>
  )
}