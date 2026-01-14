export default function App() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-5xl font-bold text-blue-600 mb-6">
        FHP Detector 🐢
      </h1>
      <p className="text-xl text-gray-700 bg-white p-6 rounded-xl shadow-lg">
        거북목 탐지 프로젝트 환경 설정 성공!
      </p>
      <button className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
        측정 시작하기
      </button>
    </div>
  )
}