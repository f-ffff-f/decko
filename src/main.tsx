import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ContextApp from './contextVersion/ContextApp'
import { DeckoProvider } from './contextVersion/DeckoProvider'

// Define which test to run
const WHICH_TEST: 'context' | 'pubsub' | 'observer' = 'context'

const rootElement = document.getElementById('root')!

if (WHICH_TEST === 'context') {
  // 1. DOM에서 root 요소를 찾습니다
  // 2. React의 createRoot API를 사용하여 React 루트를 생성합니다
  // 3. React 컴포넌트를 루트에 렌더링합니다
  createRoot(rootElement).render(
    React.createElement(
      StrictMode,
      null,
      React.createElement(
        DeckoProvider,
        null,
        React.createElement(ContextApp, null)
      )
    )
  )
} else if (WHICH_TEST === 'pubsub') {
  // Pubsub implementation to come
} else if (WHICH_TEST === 'observer') {
  // Observer implementation to come
} else {
  throw new Error(`Unknown test: ${WHICH_TEST}`)
}
