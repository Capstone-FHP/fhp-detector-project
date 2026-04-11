export default function PostureResultModal({ isOpen, onClose, summaryData }) {
    // isOpen이 false면 화면에 아무것도 그리지 않고 숨깁니다.
    if (!isOpen) return null;

    // 만약 로딩 중이거나 데이터가 아직 안 왔을 때를 대비한 기본값
    const data = summaryData || {
        totalMeasurements: 0,
        warningCount: 0,
        dangerCount: 0
    };

    // 결과에 따른 칭찬/경고 멘트 자동 생성 로직
    const getTotalBadPostures = () => data.warningCount + data.dangerCount;

    const getFeedbackMessage = () => {
        const badCount = getTotalBadPostures();
        if (badCount === 0) return "완벽해요! 💯 바른 자세의 표본입니다.";
        if (badCount <= 5) return "훌륭해요! 👍 조금만 더 신경 쓰면 완벽하겠어요.";
        return "주의가 필요해요! 🚨 스트레칭을 한 번 해보는 건 어떨까요?";
    };

    return (
        // 배경을 어둡게 하고 블러 처리하는 오버레이
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">

            // 하얀색 결과창 카드
            <div className="bg-gray-800 text-white w-full max-w-md rounded-3xl p-8 shadow-2xl transform transition-all animate-slideUp border border-gray-700">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold mb-2 tracking-tight">📊 측정 결과 요약</h2>
                    <p className="text-gray-400 font-medium">{getFeedbackMessage()}</p>
                </div>

                {/* 통계 박스 3개 (그리드 레이아웃) */}
                <div className="grid grid-cols-2 gap-4 mb-8">

                    {/* 전체 측정 횟수 (가로로 길게 차지) */}
                    <div className="col-span-2 bg-gray-700/50 rounded-2xl p-5 flex items-center justify-between border border-gray-600">
                        <span className="text-gray-300 font-bold text-lg">⏱️ 총 측정 횟수</span>
                        <span className="text-3xl font-black text-blue-400">{data.totalMeasurements}<span className="text-lg text-gray-400 ml-1">회</span></span>
                    </div>

                    {/* 경고 횟수 */}
                    <div className="bg-orange-500/10 rounded-2xl p-5 flex flex-col items-center justify-center border border-orange-500/30">
                        <span className="text-orange-400 font-bold mb-2 text-sm">⚠️ 주의 (Warning)</span>
                        <span className="text-4xl font-black text-orange-500">{data.warningCount}<span className="text-base text-orange-400/70 ml-1">회</span></span>
                    </div>

                    {/* 위험 횟수 */}
                    <div className="bg-red-500/10 rounded-2xl p-5 flex flex-col items-center justify-center border border-red-500/30">
                        <span className="text-red-400 font-bold mb-2 text-sm">🚨 위험 (Danger)</span>
                        <span className="text-4xl font-black text-red-500">{data.dangerCount}<span className="text-base text-red-400/70 ml-1">회</span></span>
                    </div>

                </div>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition transform hover:-translate-y-1"
                >
                    확인하고 닫기
                </button>
            </div>
        </div>
    );
}