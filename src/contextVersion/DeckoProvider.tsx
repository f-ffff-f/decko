// src/custom-react-redux/Provider.js
import { ReactNode, useRef } from 'react'
import { DeckoContext } from '@/contextVersion/context'
import { Decko } from '@/deckoSingleton'

export const DeckoProvider = ({ children }: { children: ReactNode }) => {
  const deckoRef = useRef<InstanceType<typeof Decko> | null>(new Decko())

  return (
    <DeckoContext.Provider value={deckoRef.current}>
      {children}
    </DeckoContext.Provider>
  )
}
