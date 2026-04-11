export default function PostureResultModal({ isOpen, onClose, summaryData }) {
    if (!isOpen) return null;

    const data = summaryData || { totalMeasurements: 0, warningCount: 0, dangerCount: 0 };
    const getTotalBadPostures = () => data.warningCount + data.dangerCount;

    const getFeedbackMessage = () => {
        const badCount = getTotalBadPostures();
        if (badCount === 0) return "완벽합니다! 바른 경추(목) 자세의 표본입니다. 💯";
        if (badCount <= 5) return "양호합니다. 의식적으로 목을 당겨주는 습관을 유지해 주세요. 👍";
        return "주의 요망! 경추 부담이 큽니다. 가벼운 스트레칭을 권장합니다. 🚨";
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">

            <div className="bg-white text-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl transform transition-all animate-slideUp border border-slate-100">

                <div className="text-center mb-8">
                    <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold mb-3 border border-blue-100">
                        측정 종료
                    </div>
                    <h2 className="text-2xl font-extrabold mb-2 tracking-tight">AI 정밀 진단 리포트</h2>
                    <p className="text-slate-500 font-medium text-sm px-2 break-keep">{getFeedbackMessage()}</p>
                </div>

                {/* 통계 박스 (헬스케어 대시보드 스타일) */}
                <div className="grid grid-cols-2 gap-3 mb-8">

                    <div className="col-span-2 bg-slate-50 rounded-2xl p-5 flex items-center justify-between border border-slate-100">
                        <span className="text-slate-500 font-bold text-sm">⏱️ 총 측정 횟수</span>
                        <div className="text-right">
                            <span className="text-3xl font-black text-slate-700">{data.totalMeasurements}</span>
                            <span className="text-sm text-slate-400 ml-1 font-medium">회</span>
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-5 flex flex-col items-center justify-center border border-orange-100">
                        <span className="text-orange-500 font-bold mb-1 text-sm">⚠️ 주의 (Warning)</span>
                        <div>
                            <span className="text-3xl font-black text-orange-600">{data.warningCount}</span>
                            <span className="text-sm text-orange-400 ml-1 font-medium">회</span>
                        </div>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-5 flex flex-col items-center justify-center border border-red-100">
                        <span className="text-red-500 font-bold mb-1 text-sm">🚨 위험 (Danger)</span>
                        <div>
                            <span className="text-3xl font-black text-red-600">{data.dangerCount}</span>
                            <span className="text-sm text-red-400 ml-1 font-medium">회</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-lg py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
                >
                    확인 및 닫기
                </button>
            </div>
        </div>
    );
}