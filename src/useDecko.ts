import { useContext } from 'react'
import { DeckoContext } from './context'

export const useDecko = () => {
  const decko = useContext(DeckoContext)
  if (!decko) throw new Error('DeckoContext not found')
  return decko
}
