// 💡 공통 서버 주소 (나중에 주소가 바뀌면 여기 딱 한 줄만 수정하면 됩니다!)
const API_BASE_URL = "https://delightful-transformation-production-2e9d.up.railway.app/api";

// 🚀 1. 상태 전송 API (실시간 로그 기록용)
export const sendFhpStateToBackend = async (uid, sessionId, state) => {
    const currentTime = new Date().toISOString();

    const payload = {
        uid: uid,
        sessionId: sessionId,
        timestamp: currentTime,
        status: state
    };

    try {
        const response = await fetch(`${API_BASE_URL}/posture/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) console.error("❌ [서버 전송 거절] 상태 코드:", response.status);
    } catch (error) {
        console.log(`⚠️ [서버 연결 실패] 전송하려던 데이터:`, payload);
    }
};

// 📊 2. 특정 세션 요약 데이터 가져오기 API
export const getPostureSummary = async (sessionId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posture/summary?sessionId=${sessionId}`, {
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

// 💡 3. 측정 종료 시 리포트(점수 및 통계)를 DB에 최종 저장 API
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

// 💡 4. 리포트 화면에서 유저의 과거 모든 측정 기록 불러오기 API
export const getUserHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posture/history/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error("❌ [기록 불러오기 에러] 상태 코드:", response.status);
            return [];
        }
    } catch (error) {
        console.error("기록 불러오기 실패:", error);
        return []; // 에러 시 빈 배열 반환 (화면 뻗음 방지)
    }
};