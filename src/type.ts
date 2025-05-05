import { DECK_IDS } from './constants'

export type TDeckId = (typeof DECK_IDS)[keyof typeof DECK_IDS]

export interface IDeckState {
  id: TDeckId
  audioBufferLoaded: boolean
  duration: number
  speed: number
  valtio_prevStartTime: number
  valtio_nextStartTime: number
  isPlaying: boolean
  isSeeking: boolean
  isTrackLoading: boolean
  volume: number
  uiPlaybackTime: number
}

export interface IGlobalState {
  crossFade: number
}

export interface IState {
  [DECK_IDS.ID_1]: IDeckState
  [DECK_IDS.ID_2]: IDeckState
  [DECK_IDS.GLOBAL]: IGlobalState
}
