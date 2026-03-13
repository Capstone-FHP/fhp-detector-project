import { useState } from 'react';
import { auth, googleProvider, db } from '../services/firebase.config.js';
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export function useAuthLogic() {
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    // 1. 🔑 이메일 로그인
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("로그인 실패:", error);
            alert("이메일이나 비밀번호가 일치하지 않습니다.");
        }
    };

    // 2. 📝 이메일 회원가입 (순수하게 파이어베이스에만 저장!)
    const handleEmailSignUp = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !passwordConfirm) return alert("모든 정보를 입력해주세요.");
        if (password !== passwordConfirm) return alert("비밀번호가 일치하지 않습니다.");

        try {
            await setPersistence(auth, browserSessionPersistence);

            // 파이어베이스 Auth(문지기)에 등록
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 이름표 달아주기
            await updateProfile(user, { displayName: name });

            // 파이어베이스 Firestore DB(금고)에 저장
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email,
                name: name,
                createdAt: new Date()
            });

            // ❌ (백엔드로 쏘는 코드 삭제됨!) ❌

            alert(`${name}님, 회원가입 성공!`);
            window.location.reload();
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') alert("이미 가입된 이메일입니다.");
            else if (error.code === 'auth/weak-password') alert("비밀번호는 6자리 이상으로 설정해주세요.");
            else alert("회원가입에 실패했습니다.");
        }
    };

    // 3. 🌐 구글 로그인 (순수하게 파이어베이스에만 저장!)
    const handleGoogleLogin = async () => {
        try {
            await setPersistence(auth, browserSessionPersistence);
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            // 처음 구글 로그인한 사람이라면 파이어베이스 DB에만 저장
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    createdAt: new Date()
                });
                // ❌ (백엔드로 쏘는 코드 삭제됨!) ❌
            }

            window.location.reload();
        } catch (error) {
            console.error("구글 로그인 실패:", error);
        }
    };

    const toggleMode = () => {
        setIsSignUpMode(!isSignUpMode);
        setName(''); setEmail(''); setPassword(''); setPasswordConfirm('');
    };

    return {
        isSignUpMode, name, setName, email, setEmail, password, setPassword,
        passwordConfirm, setPasswordConfirm, handleEmailLogin, handleEmailSignUp,
        handleGoogleLogin, toggleMode
    };
}