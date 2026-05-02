export default function PostureResultModal({ isOpen, onClose, summaryData }) {
    if (!isOpen) return null;

    const data = summaryData || { totalSeconds: 0, warningSeconds: 0, dangerSeconds: 0, score: 100 };
    const score = data.score;

    // 💡 초(Seconds)를 "00시간 00분 00초" 형태로 변환하는 궁극의 함수
    const formatTime = (totalSeconds) => {
        if (totalSeconds < 60) return `${totalSeconds}초`;

        const hours = Math.floor(totalSeconds / 3600);         // 3600으로 나눈 몫 = 시간
        const minutes = Math.floor((totalSeconds % 3600) / 60); // 남은 초를 60으로 나눈 몫 = 분
        const seconds = totalSeconds % 60;                      // 최종 남은 나머지 = 초

        // 1시간이 안 될 때 (기존과 동일)
        if (hours === 0) {
            return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
        }

        // 1시간 이상일 때의 디테일한 포맷팅
        if (minutes === 0 && seconds === 0) return `${hours}시간`;
        if (minutes === 0) return `${hours}시간 ${seconds}초`;
        if (seconds === 0) return `${hours}시간 ${minutes}분`;

        return `${hours}시간 ${minutes}분 ${seconds}초`;
    };

    const getFeedbackMessage = () => {
        if (score >= 90) return "완벽합니다! 측정 시간 내내 바른 자세를 잘 유지하셨습니다. 💯";
        if (score >= 70) return "양호합니다. 간혹 자세가 무너지니 의식적으로 허리를 펴주세요. 👍";
        return "주의 요망! 나쁜 자세가 너무 오래 유지되었습니다. 스트레칭을 권장합니다. 🚨";
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-full max-w-md rounded-3xl p-8 shadow-2xl transform transition-all animate-slideUp border border-slate-100 dark:border-slate-700">

                <div className="text-center mb-8">
                    <div className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold mb-3 border border-blue-100 dark:border-blue-800/50">
                        측정 종료
                    </div>
                    <h2 className="text-2xl font-extrabold mb-2 tracking-tight">AI 정밀 진단 리포트</h2>

                    <div className="text-6xl font-black text-blue-600 dark:text-blue-400 my-4 tracking-tighter">
                        {score}<span className="text-3xl text-slate-400 dark:text-slate-500 font-bold ml-1">점</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-2 break-keep">{getFeedbackMessage()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {/* 💡 '횟수'가 아닌 '시간' 텍스트 출력 */}
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">⏱️ 총 모니터링 시간</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-700 dark:text-slate-200">
                                {formatTime(data.totalSeconds)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 flex flex-col items-center justify-center border border-orange-100 dark:border-orange-900/30 text-center">
                        <span className="text-orange-500 dark:text-orange-400 font-bold mb-1 text-xs">⚠️ 주의 누적</span>
                        <div>
                            <span className="text-xl md:text-2xl font-black text-orange-600 dark:text-orange-500">
                                {formatTime(data.warningSeconds)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 flex flex-col items-center justify-center border border-red-100 dark:border-red-900/30 text-center">
                        <span className="text-red-500 dark:text-red-400 font-bold mb-1 text-xs">🚨 위험 누적</span>
                        <div>
                            <span className="text-xl md:text-2xl font-black text-red-600 dark:text-red-500">
                                {formatTime(data.dangerSeconds)}
                            </span>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-lg py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5">
                    확인 및 닫기
                </button>
            </div>
        </div>
    );
}