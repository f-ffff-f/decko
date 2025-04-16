import { useDeckoContext } from '@/observerVersion/useDeckoContext'
import { useEffect, useState, useTransition } from 'react'

export const useCrossfade = () => {
  const decko = useDeckoContext()
  const [crossFade, setCrossFade] = useState(decko.getCrossFade())
  const [isPending, startTransition] = useTransition()

  const handleCrossfade = () => {
    startTransition(() => {
      setCrossFade(decko.getCrossFade())
    })
  }

  useEffect(() => {
    decko.subscribe('stateChange', handleCrossfade)
    return () => {
      decko.unsubscribe('stateChange', handleCrossfade)
    }
  }, [decko])

  return { crossFade }
}
