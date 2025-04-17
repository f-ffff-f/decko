import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ContextApp from '@/contextVersion/ContextApp'
import { DeckoProvider as ContextDeckoProvider } from '@/contextVersion/DeckoProvider'
import ObserverApp from '@/observerVersion/ObserverApp'
import { DeckoProvider as ObserverDeckoProvider } from '@/observerVersion/DeckoProvider'
import ZustandApp from '@/zustandVersion/ZustandApp'

// Define which test to run
let WHICH_TEST: string = 'zustand'

const rootElement = document.getElementById('root')!

if (WHICH_TEST === 'context') {
  // 1. DOM에서 root 요소를 찾습니다
  // 2. React의 createRoot API를 사용하여 React 루트를 생성합니다
  // 3. React 컴포넌트를 루트에 렌더링합니다
  createRoot(rootElement).render(
    <ContextDeckoProvider>
      <ContextApp />
    </ContextDeckoProvider>
  )
} else if (WHICH_TEST === 'observer') {
  createRoot(rootElement).render(
    <ObserverDeckoProvider>
      <ObserverApp />
    </ObserverDeckoProvider>
  )
} else {
  createRoot(rootElement).render(<ZustandApp />)
}
