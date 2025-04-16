// src/custom-react-redux/Provider.js
import { ReactNode, useRef } from 'react'
import { DeckoContext } from '@/observerVersion/context'
import { Decko } from '@/observerVersion/Decko'

export const DeckoProvider = ({ children }: { children: ReactNode }) => {
  const deckoRef = useRef<InstanceType<typeof Decko> | null>(new Decko())

  return (
    <DeckoContext.Provider value={deckoRef.current}>
      {children}
    </DeckoContext.Provider>
  )
}
