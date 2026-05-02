import { useState, useEffect } from 'react';
import PostureResultModal from './PostureResultModal';
// import { getUserHistory } from '../services/fhpApi'; // 백엔드 완성 시 주석 해제

export default function ReportView({ setScreen, user }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 모달 제어용 상태
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // 🛠️ UI 테스트용 가짜 데이터 (Mock Data)
        const fetchMockData = () => {
            const mockHistory = [
                { sessionId: 's1', score: 95, totalSeconds: 3600, warningSeconds: 120, dangerSeconds: 0, createdAt: "2026-05-02T14:30:00" },
                { sessionId: 's2', score: 65, totalSeconds: 1800, warningSeconds: 500, dangerSeconds: 300, createdAt: "2026-05-01T10:15:00" },
                { sessionId: 's3', score: 82, totalSeconds: 5400, warningSeconds: 600, dangerSeconds: 50, createdAt: "2026-04-30T16:45:00" },
            ];
            setHistory(mockHistory);
            setIsLoading(false);
        };

        setTimeout(fetchMockData, 500);

        /* 💡 백엔드 연동 시 아래 코드로 교체!
        const loadRealData = async () => {
            if (user?.uid) {
                const data = await getUserHistory(user.uid);
                setHistory(data);
            }
            setIsLoading(false);
        };
        loadRealData();
        */
    }, [user]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const formatSimpleDuration = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h}시간 ${m}분`;
        return `${m}분`;
    };

    const handleReportClick = (sessionData) => {
        setSelectedReport(sessionData);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full max-w-3xl mx-auto animate-fadeIn">

            {/* 💡 과거 기록 클릭 시 뜨는 모달창 */}
            <PostureResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                summaryData={selectedReport}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">나의 AI 리포트 📊</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">지금까지 측정된 모든 경추 건강 기록입니다.</p>
                </div>
                <button
                    onClick={() => setScreen('home')}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition"
                >
                    돌아가기 ↩️
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-slate-400 animate-pulse font-bold text-lg">데이터를 불러오는 중... ⏳</div>
            ) : history.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="text-5xl mb-4 opacity-50">📭</div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-2">아직 측정 기록이 없습니다.</p>
                    <p className="text-sm text-slate-400">메인 화면에서 첫 번째 모니터링을 시작해 보세요!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {history.map((item, index) => (
                        <div
                            key={item.sessionId || index}
                            onClick={() => handleReportClick(item)}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-inner
                                    ${item.score >= 90 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                        item.score >= 70 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                                >
                                    {item.score}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-1">
                                        {formatDate(item.createdAt)} 측정
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex gap-3">
                                        <span>⏱️ {formatSimpleDuration(item.totalSeconds)}</span>
                                        <span>⚠️ 주의 {formatSimpleDuration(item.warningSeconds)}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-slate-300 group-hover:text-blue-500 transition font-bold text-2xl px-2">
                                →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}