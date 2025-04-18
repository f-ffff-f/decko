import { ReactNode, useEffect, useRef } from 'react'
import { DeckoContext } from '@/contextVersion/context'

export const DeckoProvider = ({ children }: { children: ReactNode }) => {
  const deckoRef = useRef<InstanceType<any> | null>(null)

  useEffect(() => {
    import('@/contextVersion/Decko').then(module => {
      deckoRef.current = new module.Decko()
    })
  }, [])

  return (
    <DeckoContext.Provider value={deckoRef.current}>
      {children}
    </DeckoContext.Provider>
  )
}
