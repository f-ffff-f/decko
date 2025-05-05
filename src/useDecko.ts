import { useLayoutEffect, useState } from 'react'
import subscribers from './subscribers'
import { IDeckState, IGlobalState, TDeckId } from './type'

const useGetDecko = <T extends keyof IDeckState | keyof IGlobalState>(
  key: [TDeckId, T]
) => {
  const [state, setState] = useState<
    IDeckState[keyof IDeckState] | IGlobalState[keyof IGlobalState]
  >()

  useLayoutEffect(() => {
    subscribers.set(key, setState)

    return () => {
      subscribers.delete(key)
    }
  }, [key])

  return state
}

export default useGetDecko
