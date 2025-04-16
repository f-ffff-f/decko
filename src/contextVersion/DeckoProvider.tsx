import { ReactNode, useRef } from 'react'
import { DeckoContext } from '@/contextVersion/context'
import { Decko } from '@/contextVersion/Decko'

export const DeckoProvider = ({ children }: { children: ReactNode }) => {
  const deckoRef = useRef<InstanceType<typeof Decko> | null>(new Decko())

  return (
    <DeckoContext.Provider value={deckoRef.current}>
      {children}
    </DeckoContext.Provider>
  )
}
