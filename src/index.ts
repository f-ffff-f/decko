/* context version */
export { DeckoProvider as ContextDeckoProvider } from '@/contextVersion/DeckoProvider'
export { useDeckoContext as ContextUseDeckoContext } from '@/contextVersion/useDeckoContext'

/* observer version */
export { DeckoProvider as ObserverDeckoProvider } from '@/observerVersion/DeckoProvider'
export { useDeckoContext as ObserverUseDeckoContext } from '@/observerVersion/useDeckoContext'
export { useDeckoState as ObserverUseDeckoState } from '@/observerVersion/useDeckState'
export { useCrossfade as ObserverUseCrossfade } from '@/observerVersion/useCrossfade'

export { EDeckIds } from '@/constants'

/* zustand version */
export { useDeckoStore } from '@/zustandVersion/useDeckoStore'
export { getDecko } from '@/zustandVersion/getDecko'

export { selectCrossFade } from '@/zustandVersion/useDeckoStore'
export { selectDeck } from '@/zustandVersion/useDeckoStore'
export { selectDeckVolume } from '@/zustandVersion/useDeckoStore'
export { selectDeckSpeed } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsPlaying } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsSeeking } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsTrackLoading } from '@/zustandVersion/useDeckoStore'
export { selectDeckAudioBuffer } from '@/zustandVersion/useDeckoStore'
export { selectDeckAudioBufferDuration } from '@/zustandVersion/useDeckoStore'
