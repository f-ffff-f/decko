// src/state.ts
import { DECK_IDS, TDeckId } from './constants'
import { proxy } from 'valtio'

// 각 Deck의 상태 인터페이스
interface IDeckState {
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

export interface IState {
  decks: {
    [key in TDeckId]?: IDeckState
  }
  crossFade: number
}

// 초기 상태 정의
const initialDeckState = (id: TDeckId): IDeckState => ({
  id: id,
  audioBufferLoaded: false,
  duration: 0,
  speed: 1,
  valtio_prevStartTime: 0,
  valtio_nextStartTime: 0,
  isPlaying: false,
  isSeeking: false,
  isTrackLoading: false,
  volume: 0.8,
  uiPlaybackTime: 0, // uiPlaybackTime 초기화
})

export const deckoState = proxy<IState>({
  decks: {
    [DECK_IDS.ID_1]: initialDeckState(DECK_IDS.ID_1),
    [DECK_IDS.ID_2]: initialDeckState(DECK_IDS.ID_2),
  },
  crossFade: 0.5,
})
