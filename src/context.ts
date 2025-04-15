import { createContext } from 'react'
import { Decko } from './deckoSingleton'

// 초기값은 null로 설정합니다. Provider가 없을 경우를 대비합니다.
export const DeckoContext = createContext<InstanceType<typeof Decko> | null>(
  null
)
