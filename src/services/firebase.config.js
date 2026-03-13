import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: 팀원이나 본인의 Firebase 콘솔에서 발급받은 실제 설정값으로 바꿔야 합니다!
const firebaseConfig = {
    apiKey: "AIzaSyBRco2eF8R9PXdj-ZcWkmpI5XGtUZFMGSM",
    authDomain: "fhp-detector.firebaseapp.com",
    projectId: "fhp-detector",
    storageBucket: "fhp-detector.firebasestorage.app",
    messagingSenderId: "707547024162",
    appId: "1:707547024162:web:f85c8d3af6d04063c5f37b"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 인증(로그인) 기능 내보내기
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
googleProvider.setCustomParameters({
    prompt: 'select_account'
});