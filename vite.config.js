import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 외부 접속 허용 (localhost 문제 해결)
    port: 3000,      // 포트를 5173에서 3000으로 변경
  }
})