import { useState } from 'react';
import { auth, googleProvider } from '../services/firebase.config.js';
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";

export default function Login() {
    // 이메일과 비밀번호 입력값을 저장할 상태(State)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 1. 기존 구글 로그인
    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("구글 로그인 실패:", error);
        }
    };

    // 2. 📝 자체 회원가입 기능
    const handleEmailSignUp = async (e) => {
        e.preventDefault(); // 버튼 눌렀을 때 새로고침 되는 것 방지
        try {
            // Firebase에 이메일/비밀번호로 새 유저 생성 요청
            await createUserWithEmailAndPassword(auth, email, password);
            alert("회원가입 성공! 환영합니다.");
        } catch (error) {
            console.error("회원가입 실패:", error);
            // 에러 종류에 따라 친절하게 알림 띄우기
            if (error.code === 'auth/email-already-in-use') {
                alert("이미 가입된 이메일입니다.");
            } else if (error.code === 'auth/weak-password') {
                alert("비밀번호는 6자리 이상으로 설정해주세요.");
            } else {
                alert("회원가입에 실패했습니다. 이메일 형식을 확인해주세요.");
            }
        }
    };

    // 3. 🔑 자체 이메일 로그인 기능
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            // Firebase에 이메일/비밀번호 확인 요청
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("로그인 실패:", error);
            alert("이메일이나 비밀번호가 틀렸습니다.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">로그인 / 회원가입</h2>

            {/* 이메일, 비밀번호 입력 폼 */}
            <form className="flex flex-col gap-4 mb-6">
                <input
                    type="email"
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호 (6자리 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    required
                />

                <div className="flex gap-3 mt-2">
                    <button
                        onClick={handleEmailLogin}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md"
                    >
                        로그인
                    </button>
                    <button
                        onClick={handleEmailSignUp}
                        className="flex-1 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow-md"
                    >
                        회원가입
                    </button>
                </div>
            </form>

            {/* 구분선 */}
            <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-4 text-gray-400 text-sm absolute">또는</span>
            </div>

            {/* 구글 로그인 버튼 */}
            <button
                onClick={handleGoogleLogin}
                className="w-full py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google 계정으로 로그인
            </button>
        </div>
    );
}