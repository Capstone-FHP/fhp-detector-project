// 방금 만든 로직(Hook)을 불러옵니다. Firebase는 여기서 아예 몰라도 됩니다!
import { useAuthLogic } from '../hooks/useAuthLogic';

export default function Login() {
    // 로직 파일에서 필요한 도구들을 꺼내옵니다.
    const {
        isSignUpMode, name, setName, email, setEmail, password, setPassword,
        passwordConfirm, setPasswordConfirm, handleEmailLogin, handleEmailSignUp,
        handleGoogleLogin, toggleMode
    } = useAuthLogic();

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-full max-w-md transition-all">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                {isSignUpMode ? "회원가입" : "로그인"}
            </h2>

            <form className="flex flex-col gap-4 mb-6">
                {isSignUpMode && (
                    <input
                        type="text" placeholder="이름 (Name)" value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                )}

                <input
                    type="email" placeholder="아이디 (이메일 주소)" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                />
                <input
                    type="password" placeholder="비밀번호" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                />

                {isSignUpMode && (
                    <input
                        type="password" placeholder="비밀번호 확인" value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                )}

                <button
                    onClick={isSignUpMode ? handleEmailSignUp : handleEmailLogin}
                    className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md text-lg"
                >
                    {isSignUpMode ? "가입 완료하기" : "로그인"}
                </button>
            </form>

            <button onClick={toggleMode} className="text-gray-500 hover:text-blue-600 font-medium mb-6 transition">
                {isSignUpMode ? "이미 계정이 있으신가요? 로그인하기" : "아직 계정이 없으신가요? 회원가입하기"}
            </button>

            <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-4 text-gray-400 text-sm absolute">또는</span>
            </div>

            <button onClick={handleGoogleLogin} className="w-full py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google 계정으로 계속
            </button>
        </div>
    );
}