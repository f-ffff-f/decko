import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './contextVersion/App'
import { DeckoProvider } from './contextVersion/DeckoProvider'

// 1. DOM에서 root 요소를 찾습니다
// 2. React의 createRoot API를 사용하여 React 루트를 생성합니다
// 3. React 컴포넌트를 루트에 렌더링합니다
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeckoProvider>
      <App />
    </DeckoProvider>
  </StrictMode>
)
