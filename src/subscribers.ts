import { IDeckState, IGlobalState, IState } from './type'

const subscribers = new Map<
  [keyof IState, keyof IDeckState | keyof IGlobalState],
  (
    state: IDeckState[keyof IDeckState] | IGlobalState[keyof IGlobalState]
  ) => void
>()

export default subscribers
