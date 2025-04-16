// src/hooks/useDeckoState.ts (새 파일 또는 적절한 위치)
import { useState, useEffect, useCallback, useTransition } from 'react'
import { useDeckoContext } from '@/observerVersion/useDeckoContext'
import { EDeckIds } from '@/constants'

interface DeckState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  speed: number
  isSeeking: boolean
  isTrackLoading: boolean
}

const initialState = (
  decko: InstanceType<typeof import('@/observerVersion/Decko').Decko>,
  deckId: EDeckIds
): DeckState => ({
  isPlaying: decko.isPlaying(deckId),
  currentTime: decko.getPlaybackTime(deckId),
  duration: decko.getAudioBufferDuration(deckId),
  volume: decko.getVolume(deckId),
  speed: decko.getSpeed(deckId),
  isSeeking: decko.isSeeking(deckId),
  isTrackLoading: decko.isTrackLoading(deckId),
})

export const useDeckoState = (deckId: EDeckIds): DeckState => {
  const decko = useDeckoContext()
  const [deckState, setDeckState] = useState<DeckState>(() =>
    initialState(decko, deckId)
  )
  const [isPending, startTransition] = useTransition()

  // 상태 업데이트 콜백 (메모이제이션)
  const handleStateChange = useCallback(() => {
    // console.log(`[useDeckoState ${deckId}] Received stateChange event`);
    startTransition(() => {
      setDeckState(initialState(decko, deckId))
    })
  }, [decko, deckId])

  // 재생 시간 업데이트 콜백 (메모이제이션)
  const handlePlaybackTimeUpdate = useCallback(
    (payload?: { deckId: EDeckIds; currentTime: number }) => {
      if (payload && payload.deckId === deckId) {
        // console.log(`[useDeckoState ${deckId}] Received playbackTimeUpdate event: ${payload.currentTime.toFixed(2)}`);
        setDeckState(prevState => ({
          ...prevState,
          currentTime: payload.currentTime,
          // 혹시 모를 재생 종료 동기화
          isPlaying: decko.isPlaying(deckId),
        }))
      }
    },
    [decko, deckId]
  )

  // 트랙 로딩 상태 변경 콜백 (메모이제이션)
  const handleTrackLoadChange = useCallback(
    (payload?: { deckId: EDeckIds; isLoading: boolean }) => {
      if (payload && payload.deckId === deckId) {
        // console.log(`[useDeckoState ${deckId}] Received trackLoadChange event: isLoading=${payload.isLoading}`);
        setDeckState(prevState => ({
          ...prevState,
          isTrackLoading: payload.isLoading,
          // 로딩 완료 시 duration 업데이트 등 추가 작업 가능
          duration: payload.isLoading
            ? 0
            : decko.getAudioBufferDuration(deckId),
          currentTime: 0, // 로딩 완료 시 시간 초기화
        }))
      }
    },
    [decko, deckId]
  )

  useEffect(() => {
    // console.log(`[useDeckoState ${deckId}] Subscribing to events`);
    // 이벤트 구독
    decko.subscribe('stateChange', handleStateChange)
    decko.subscribe('playbackTimeUpdate', handlePlaybackTimeUpdate)
    decko.subscribe('trackLoadChange', handleTrackLoadChange)

    // 초기 상태 한 번 더 동기화 (구독 전에 변경된 사항 반영)
    handleStateChange()

    // 클린업 함수: 컴포넌트 언마운트 시 구독 취소
    return () => {
      // console.log(`[useDeckoState ${deckId}] Unsubscribing from events`);
      decko.unsubscribe('stateChange', handleStateChange)
      decko.unsubscribe('playbackTimeUpdate', handlePlaybackTimeUpdate)
      decko.unsubscribe('trackLoadChange', handleTrackLoadChange)
    }
  }, [
    decko,
    deckId,
    handleStateChange,
    handlePlaybackTimeUpdate,
    handleTrackLoadChange,
  ]) // 의존성 배열에 콜백 함수 포함

  return deckState
}
