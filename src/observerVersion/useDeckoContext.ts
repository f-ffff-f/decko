import { useContext } from 'react'
import { DeckoContext } from '@/observerVersion/context'

export const useDeckoContext = () => {
  const decko = useContext(DeckoContext)
  if (!decko) throw new Error('DeckoContext not found')
  return decko
}
