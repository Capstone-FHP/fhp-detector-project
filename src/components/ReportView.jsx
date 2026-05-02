import { useState, useEffect } from 'react';
import { getUserHistory } from '../services/fhpApi';

export default function ReportView({ setScreen, user }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // 💡 화면 켜질 때 서버에서 유저 기록 가져오기
    useEffect(() => {
        const loadHistory = async () => {
            if (user?.uid) {
                const data = await getUserHistory(user.uid);
                // 서버에서 가져온 배열 저장 (최신순 정렬 권장)
                setReports(data || []);
            }
            setLoading(false);
        };
        loadHistory();
    }, [user]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center animate-fadeIn">
                <div className="text-lg font-bold text-slate-500">
                    <span className="animate-spin inline-block mr-2">⏳</span> 서버에서 측정 기록을 불러오는 중...
                </div>
            </div>
        );
    }

    const hasData = reports && reports.length > 0;

    return (
        <div className="w-full max-w-[1000px] mx-auto h-full flex flex-col pb-10 p-6 animate-fadeIn">

            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                        My <span className="text-blue-600">History</span>
                    </h2>
                    <p className="text-slate-500 font-medium">과거 측정 기록을 확인할 수 있습니다.</p>
                </div>
                <button
                    onClick={() => setScreen('home')}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                    ⬅️ 메인으로
                </button>
            </div>

            {!hasData ? (
                /* 🚫 서버에 데이터가 없을 때 */
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center p-20">
                    <div className="text-6xl mb-6">📂</div>
                    <h3 className="text-2xl font-extrabold mb-4 text-slate-800 dark:text-white">서버에 저장된 기록이 없습니다</h3>
                    <p className="text-slate-500 mb-10">측정을 종료하면 이곳에 진단 리포트가 안전하게 저장됩니다.</p>
                    <button
                        onClick={() => setScreen('camera')}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
                    >
                        🚀 측정 시작하기
                    </button>
                </div>
            ) : (
                /* ✅ 서버에서 가져온 데이터 목록 출력 */
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
                    {reports.map((report, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${report.score >= 80
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : report.score >= 60
                                        ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-500'
                                        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    }`}>
                                    {report.score}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                        {new Date(report.createdAt).toLocaleString()} 측정 결과
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        총 {report.totalCount}회 스캔 | 주의 {report.warningCount}회 | 위험 {report.dangerCount}회
                                    </div>
                                </div>
                            </div>
                            <button className="px-5 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                                상세 보기
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}