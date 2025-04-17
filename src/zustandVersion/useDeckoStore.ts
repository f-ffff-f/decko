import { create } from 'zustand'
import { EDeckIds } from '@/constants'
import { Decko, IDeck } from './Decko'
// Optional import for shallow comparison

export interface DeckStore {
  decks: Partial<Record<EDeckIds, IDeck>>
  setDeck: (id: EDeckIds, patch: Partial<IDeck>) => void
  crossFade: number
  setCrossFade: (value: number) => void
}

export const useDeckoStore = create<DeckStore>(set => ({
  decks: {},
  setDeck: (id, patch) =>
    set(state => ({
      decks: {
        ...state.decks,
        [id]: {
          ...(state.decks[id] || ({} as IDeck)),
          ...patch,
        },
      },
    })),
  crossFade: 0.5,
  setCrossFade: value => set({ crossFade: value }),
}))

export const selectCrossFade = (state: DeckStore) => state.crossFade

export const selectDeck = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]

// 개별 속성 선택용 selector
export const selectDeckVolume = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.gainNode.gain.value ?? 0

export const selectDeckSpeed = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.speed ?? 1

export const selectDeckIsPlaying = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.isPlaying ?? false

export const selectDeckIsSeeking = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.isSeeking ?? false

export const selectDeckIsTrackLoading = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.isTrackLoading ?? false

export const selectDeckAudioBuffer = (id: EDeckIds) => (state: DeckStore) =>
  state.decks[id]?.audioBuffer ?? null

export const selectDeckAudioBufferDuration =
  (id: EDeckIds) => (state: DeckStore) =>
    state.decks[id]?.audioBuffer?.duration ?? 0
