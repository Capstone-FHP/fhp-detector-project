import { auth, googleProvider } from '../services/firebase.config.js';
import { signInWithPopup } from "firebase/auth";

export default function Login() {
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("로그인 실패:", error);
            alert("로그인에 실패했습니다.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">서비스를 이용하려면 로그인이 필요합니다</h2>
            <button
                onClick={handleLogin}
                className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
            >
                Google 계정으로 로그인
            </button>
        </div>
    );
}