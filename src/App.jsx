import { useState, useEffect } from 'react';
import { auth, db } from './services/firebase.config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from './components/Login';
import CameraView from './components/CameraView';
import ReportView from './components/ReportView';

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
        } catch (error) { setUserName(currentUser.displayName || '고객'); }
        if (screen === 'login' || screen === 'auth_choice') setScreen('camera');
      } else { setUserName(''); }
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

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-700 font-sans text-slate-800 dark:text-slate-100 ${getBgColor()}`}>

        {/* 🏥 헤더 */}
        <header className="w-full h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setScreen('home'); setFhpState('normal'); }}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">🩺</div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">FHP <span className="text-blue-500 font-bold">Monitor</span></h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <div className="flex items-center gap-2 md:gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-blue-600 dark:text-blue-400">{userName}</strong>님
                </span>
                <button onClick={handleLogout} className="text-xs md:text-sm font-bold text-slate-500 hover:text-red-500 transition ml-1">로그아웃</button>
              </div>
            ) : (
              screen === 'home' && <button onClick={() => setScreen('login')} className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-5 py-2 rounded-full transition">로그인</button>
            )}
          </div>
        </header>

        {/* 🏥 메인 */}
        <main className={`flex-1 w-full relative min-h-0 ${screen === 'camera' ? 'overflow-hidden p-4 md:p-6' : 'overflow-y-auto p-6 md:p-10'}`}>

          {screen === 'home' && (
            <div className="w-full h-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-3 flex flex-col items-start text-left p-4 md:p-8">
                <div className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-4">AI 기반 경추 건강 관리 시스템</div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-slate-950 dark:text-white mb-4 leading-[1.1]">거북목,<br />실시간 AI로<br /><span className="text-blue-600 dark:text-blue-400">스마트하게</span> 교정하세요.</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl break-keep">따로 시간을 낼 필요 없습니다. 업무 중, 공부 중 카메라만 켜두세요. AI가 당신의 자세를 실시간 분석합니다.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                  <button onClick={() => user ? setScreen('camera') : setScreen('auth_choice')} className="flex-1 py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">🚀 시작하기</button>
                  <button
                    onClick={() => {
                      if (user) setScreen('report');
                      else { alert("데이터 통계는 회원 전용입니다. 🔒\n로그인 화면으로 이동합니다."); setScreen('login'); }
                    }}
                    className="flex-1 py-4 md:py-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-lg border border-slate-200 dark:border-slate-700 transition shadow-sm"
                  >📊 AI 주간 리포트</button>
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border p-6 border-slate-100 dark:border-slate-800">
                <FeatureCard icon="📸" title="실시간 감지" desc="즉각적인 자세 분석" />
                <FeatureCard icon="⚠️" title="정밀 경고" desc="3초 이상 시 알림" />
                <FeatureCard icon="📊" title="누적 통계" desc="건강 리포트 제공" />
                <FeatureCard icon="🧩" title="PIP 모드" desc="모니터링 유지" />
              </div>
            </div>
          )}

          {screen === 'auth_choice' && (
            <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 text-center animate-fadeIn">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">측정 모드를 선택하세요</h2>
              <div className="flex flex-col md:flex-row gap-6 justify-center mt-10">
                <AuthOptionCard title="회원 정밀 측정" desc="데이터 저장 및 통계 제공" icon="🔒" onClick={() => setScreen('login')} primary />
                <AuthOptionCard title="비회원 1회 체험" desc="데이터 저장 없이 체험" icon="👀" onClick={() => setScreen('camera')} />
              </div>
            </div>
          )}

          {screen === 'login' && <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 mt-10"><Login /></div>}
          {screen === 'camera' && <div className="w-full h-full"><CameraView fhpState={fhpState} setFhpState={setFhpState} user={user} setScreen={setScreen} /></div>}          {screen === 'report' && <div className="w-full h-full"><ReportView setScreen={setScreen} user={user} /></div>}
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
      <p className="text-xs text-slate-500 break-keep">{desc}</p>
    </div>
  )
}

function AuthOptionCard({ title, desc, icon, onClick, primary }) {
  return (
    <button onClick={onClick} className={`flex-1 p-8 rounded-3xl transition shadow-sm hover:shadow-lg flex flex-col items-center transform hover:-translate-y-1 ${primary ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700'}`}>
      <span className="text-4xl mb-4">{icon}</span>
      <span className="text-xl font-bold mb-2">{title}</span>
      <span className={`text-sm ${primary ? 'text-blue-100' : 'text-slate-400'}`}>{desc}</span>
    </button>
  )
}