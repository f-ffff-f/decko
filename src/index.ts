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
export { useDeckoStore as ZustandUseDeckoStore } from '@/zustandVersion/useDeckoStore'
export { getDecko as ZustandGetDecko } from '@/zustandVersion/getDecko'

export { selectDeckVolume as ZustandSelectDeckVolume } from '@/zustandVersion/useDeckoStore'
export { selectDeckSpeed as ZustandSelectDeckSpeed } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsPlaying as ZustandSelectDeckIsPlaying } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsSeeking as ZustandSelectDeckIsSeeking } from '@/zustandVersion/useDeckoStore'
export { selectDeckIsTrackLoading as ZustandSelectDeckIsTrackLoading } from '@/zustandVersion/useDeckoStore'
export { selectDeckAudioBuffer as ZustandSelectDeckAudioBuffer } from '@/zustandVersion/useDeckoStore'
export { selectDeckAudioBufferDuration as ZustandSelectDeckAudioBufferDuration } from '@/zustandVersion/useDeckoStore'
