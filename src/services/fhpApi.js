// 🚀 1. 상태 전송 API (sessionId가 추가되었습니다!)
export const sendFhpStateToBackend = async (uid, sessionId, state) => {
    const currentTime = new Date().toISOString();

    const payload = {
        uid: uid,
        sessionId: sessionId, // 👈 이제 어떤 세션인지 백엔드가 알 수 있습니다!
        timestamp: currentTime,
        status: state
    };

    const BACKEND_URL = "https://delightful-transformation-production-2e9d.up.railway.app/api/posture/log";

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) console.error("❌ [서버 전송 거절] 상태 코드:", response.status);
    } catch (error) {
        console.log(`⚠️ [서버 연결 실패] 전송하려던 데이터:`, payload);
    }
};


// 📊 2. 요약 데이터 가져오기 API (명세서 완벽 반영!)
export const getPostureSummary = async (sessionId) => {
    const BACKEND_URL = `https://delightful-transformation-production-2e9d.up.railway.app/api/posture/summary?sessionId=${sessionId}`;

    try {
        const response = await fetch(BACKEND_URL, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ [요약 데이터 수신 완료]:", data);
            return data;
        } else {
            console.error("❌ [요약 API 에러] 상태 코드:", response.status);
            return null;
        }
    } catch (error) {
        console.error("⚠️ [요약 API 연결 실패]: 서버가 꺼져있거나 주소가 다릅니다.", error);
        return null;
    }
};

// 💡 2. [추가됨] 측정 종료 시 리포트(점수 및 통계)를 DB에 저장
export const savePostureSession = async (sessionData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posture/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        return await response.json();
    } catch (error) {
        console.error("서버 저장 실패:", error);
        return null;
    }
};

// 💡 3. [추가됨] 리포트 화면에서 과거 모든 측정 기록 불러오기
export const getUserHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posture/history/${userId}`);
        return await response.json();
    } catch (error) {
        console.error("기록 불러오기 실패:", error);
        return []; // 에러 시 빈 배열 반환
    }
};