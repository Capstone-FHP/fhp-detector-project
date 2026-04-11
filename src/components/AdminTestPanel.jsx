export default function AdminTestPanel({ setIsAdminTesting, setFhpState }) {
    return (
        <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-2xl mb-4 shadow-lg flex items-center justify-between z-50 shrink-0 border-2 border-dashed border-gray-500">
            <span className="text-white font-bold tracking-wide">🛠️ 관리자 테스트 모드</span>
            <div className="flex gap-2">
                <button
                    onClick={() => { setIsAdminTesting(true); setFhpState('normal'); }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
                >
                    ✅ 정상
                </button>
                <button
                    onClick={() => { setIsAdminTesting(true); setFhpState('warning'); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
                >
                    ⚠️ 경고
                </button>
                <button
                    onClick={() => { setIsAdminTesting(true); setFhpState('danger'); }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
                >
                    🚨 위험
                </button>
                <button
                    onClick={() => { setIsAdminTesting(false); setFhpState('normal'); }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-bold transition ml-2 shadow-sm"
                >
                    끄기
                </button>
            </div>
        </div>
    );
}