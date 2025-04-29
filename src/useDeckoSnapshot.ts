import { useSnapshot } from 'valtio'
import { deckoState, IState } from './state'

export const useDeckoSnapshot = () => {
  const deckoSnapshot = useSnapshot(deckoState) as IState

  return deckoSnapshot
}
