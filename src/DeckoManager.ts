// src/DeckoManager.ts
import { DECK_IDS } from './constants'
import { IDeckState, IGlobalState, IState, TDeckId } from './type'
import subscribers from './subscribers'
export class DeckoManager {
  private audioContext: AudioContext
  private masterGainNode: GainNode | null = null

  private gainNodes = new Map<TDeckId, GainNode>()
  private crossFadeNodes = new Map<TDeckId, GainNode>()
  private bufferSourceNodes = new Map<TDeckId, AudioBufferSourceNode | null>()
  audioBuffers = new Map<TDeckId, AudioBuffer | null>()

  // 단일 requestAnimationFrame ID
  private animationFrameId: number | null = null
  // 상태 업데이트를 위한 스로틀링 설정 (ms)
  private playbackUpdateInterval = 100
  private lastPlaybackUpdateTime = 0

  constructor() {
    let audioContext: AudioContext | null = null
    if (typeof window !== 'undefined') {
      audioContext = new AudioContext()
    } else {
      console.warn(
        'AudioContext cannot be created outside of a browser environment.'
      )
    }
    this.audioContext = audioContext!

    if (this.audioContext) {
      this.init()
    }
  }

  init() {
    if (!this.audioContext) return

    this.masterGainNode = this.audioContext.createGain()
    this.masterGainNode.gain.value = 0.5
    this.publish([DECK_IDS.GLOBAL, 'crossFade'], 0.5)
    this.masterGainNode.connect(this.audioContext.destination)

    Object.values(DECK_IDS).forEach(deckId => {
      this.setupDeck(deckId, this.masterGainNode!)
    })

    this.applyCrossFade(deckoState.crossFade)
  }

  private setupDeck(deckId: TDeckId, masterGainNode: GainNode) {
    if (!this.audioContext || !deckoState.decks[deckId]) return

    const deckState = deckoState.decks[deckId]!

    const gainNode = this.audioContext.createGain()
    const crossFadeNode = this.audioContext.createGain()

    gainNode.connect(crossFadeNode).connect(masterGainNode)

    this.gainNodes.set(deckId, gainNode)
    this.crossFadeNodes.set(deckId, crossFadeNode)
    this.bufferSourceNodes.set(deckId, null)
    this.audioBuffers.set(deckId, null)

    const initialVolume = this.clampGain(deckState.volume)
    this.publish([deckId, 'volume'], initialVolume)
    gainNode.gain.value = initialVolume
  }

  async loadTrack(deckId: TDeckId, blob: Blob) {
    const deckState = deckoState.decks[deckId]
    if (!deckState || !this.audioContext) return

    if (deckState.isPlaying) {
      // 재생 중인 경우, 새로운 트랙 로드 시 현재 재생 시간으로 멈추고,
      // 로드 완료 후에는 0초부터 시작하도록 합니다.
      const currentPlaybackTime = this.getPlaybackTime(deckId)
      this.stopDeckInternal(deckId, currentPlaybackTime) // 현재 위치 저장 후 정지
      deckState.valtio_nextStartTime = 0 // 로드 후 시작 위치는 0
    } else {
      // 정지 상태인 경우, 다음 시작 위치를 0으로 설정
      deckState.valtio_nextStartTime = 0
    }

    this.releaseBufferSourceNode(deckId)

    this.publish([deckId, 'isTrackLoading'], true)
    deckState.isTrackLoading = true
    deckState.audioBufferLoaded = false
    deckState.duration = 0
    deckState.uiPlaybackTime = 0 // UI 시간 초기화
    this.audioBuffers.set(deckId, null)

    try {
      const arrayBuffer = await blob.arrayBuffer()
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.audioBuffers.set(deckId, audioBuffer)

      // valtio 상태 업데이트
      this.publish([deckId, 'audioBufferLoaded'], true)
      this.publish([deckId, 'duration'], audioBuffer.duration)
      deckState.audioBufferLoaded = true
      deckState.duration = audioBuffer.duration
      // valtio_nextStartTime은 위에서 설정했거나 0임
    } catch (error) {
      console.error(`[Deck ${deckId}] Failed to load audio file:`, error)
      this.publish([deckId, 'audioBufferLoaded'], false)
      this.publish([deckId, 'duration'], 0)
      deckState.audioBufferLoaded = false
      deckState.duration = 0
      deckState.uiPlaybackTime = 0 // UI 시간 초기화
      this.audioBuffers.set(deckId, null)
    } finally {
      this.publish([deckId, 'isTrackLoading'], false)
      deckState.isTrackLoading = false
    }
  }

  async playPauseDeck(deckId: TDeckId) {
    const deckState = deckoState.decks[deckId]
    const audioBuffer = this.audioBuffers.get(deckId)

    if (!deckState || !audioBuffer || !this.audioContext) {
      console.warn(
        `[Deck ${deckId}] Cannot play/pause: Deck deckoState or buffer not ready.`
      )
      return
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    if (deckState.isPlaying) {
      // --- 일시정지 ---
      const currentPlaybackTime = this.getPlaybackTime(deckId)
      this.publish([deckId, 'isPlaying'], false)
      this.stopDeckInternal(deckId, currentPlaybackTime)
      // 모든 덱이 멈췄는지 확인하고 루프 중지
      this.checkAndStopPlaybackTimeUpdates()
    } else {
      // --- 재생 ---
      this.releaseBufferSourceNode(deckId)

      const sourceNode = this.createSourceNode(deckId, audioBuffer)
      if (!sourceNode) return

      this.bufferSourceNodes.set(deckId, sourceNode)

      sourceNode.start(0, deckState.valtio_nextStartTime)

      // valtio 상태 업데이트
      deckState.valtio_prevStartTime = this.audioContext.currentTime
      this.publish([deckId, 'isPlaying'], true)
      deckState.isPlaying = true
      // UI 재생 시간도 바로 업데이트 시작 (선택사항)
      deckState.uiPlaybackTime = this.getPlaybackTime(deckId)

      // 단일 rAF 루프 시작 (아직 실행 중이 아니면)
      this.startPlaybackTimeUpdates()
    }
  }

  seekDeck(deckId: TDeckId, seekTime: number) {
    const deckState = deckoState.decks[deckId]
    const audioBuffer = this.audioBuffers.get(deckId)

    if (!deckState || !audioBuffer || !this.audioContext) return

    const validSeekTime = Math.max(0, Math.min(seekTime, deckState.duration))

    this.publish([deckId, 'valtio_nextStartTime'], validSeekTime)
    this.publish([deckId, 'isSeeking'], true)
    deckState.isSeeking = true

    if (deckState.isPlaying) {
      this.stopDeckInternal(deckId, validSeekTime) // 내부 정지 (nextStartTime 업데이트)
      // 정지 후 새로운 위치에서 다시 재생 시작
      this.playPauseDeck(deckId) // playPauseDeck 내부에서 nextStartTime 사용
    } else {
      // 정지 상태: 다음 재생 시작 시간만 업데이트하고 UI 시간도 업데이트
      deckState.valtio_nextStartTime = validSeekTime
      deckState.uiPlaybackTime = validSeekTime // UI 시간도 바로 반영
    }

    deckState.isSeeking = false
    this.publish([deckId, 'isSeeking'], false)
  }

  setVolume(deckId: TDeckId, volume: number) {
    const gainNode = this.gainNodes.get(deckId)

    if (!gainNode) return

    const clampedVolume = this.clampGain(volume)
    this.publish([deckId, 'volume'], clampedVolume)
    gainNode.gain.linearRampToValueAtTime(
      clampedVolume,
      this.audioContext!.currentTime + 0.05
    )
  }

  setSpeed(deckId: TDeckId, speed: number) {
    const deckState = deckoState.decks[deckId]
    const bufferSourceNode = this.bufferSourceNodes.get(deckId)

    if (!deckState) return

    const clampedSpeed = Math.max(0.1, Math.min(speed, 4))
    this.publish([deckId, 'speed'], clampedSpeed)
    deckState.speed = clampedSpeed

    if (bufferSourceNode && deckState.isPlaying) {
      // 재생 중 속도 변경 시, 현재 재생 위치를 기준으로 다시 재생 시작
      const currentPlaybackTime = this.getPlaybackTime(deckId)
      this.stopDeckInternal(deckId, currentPlaybackTime) // 현재 위치 저장 후 정지
      // nextStartTime에 저장된 현재 위치부터 새 속도로 다시 재생 시작
      this.playPauseDeck(deckId)
    }
  }

  setCrossFade(value: number) {
    const clampedValue = this.clampGain(value)
    this.publish([1, 'volume'], clampedValue)
    deckoState.crossFade = clampedValue
    this.applyCrossFade(clampedValue)
  }

  // --- 단일 requestAnimationFrame 루프 관리 ---

  // 루프 시작
  startPlaybackTimeUpdates() {
    if (this.animationFrameId !== null) {
      // 이미 루프가 실행 중이면 중복 시작하지 않음
      return
    }
    console.log('Starting playback time update loop.')
    this.lastPlaybackUpdateTime = performance.now() // 시작 시 시간 초기화
    this.updatePlaybackTimes() // 첫 번째 업데이트 실행 및 루프 시작
  }

  // 루프 중지
  stopPlaybackTimeUpdates() {
    if (this.animationFrameId === null) {
      return // 루프가 실행 중이 아니면 중지할 것도 없음
    }
    console.log('Stopping playback time update loop.')
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
  }

  // 모든 덱이 멈췄는지 확인하고 루프 중지
  private checkAndStopPlaybackTimeUpdates() {
    const anyDeckIsPlaying = Object.values(DECK_IDS).some(
      deckId => deckoState.decks[deckId]?.isPlaying
    )
    if (!anyDeckIsPlaying) {
      this.stopPlaybackTimeUpdates()
    }
  }

  // requestAnimationFrame 콜백 함수
  private updatePlaybackTimes = () => {
    const now = performance.now()
    // 스로틀링 체크
    if (now - this.lastPlaybackUpdateTime >= this.playbackUpdateInterval) {
      this.lastPlaybackUpdateTime = now

      // 각 덱의 재생 시간을 업데이트
      Object.values(DECK_IDS).forEach(deckId => {
        const deckState = deckoState.decks[deckId]
        if (deckState?.isPlaying) {
          // 재생 중인 덱만 업데이트
          const calculatedTime = this.getPlaybackTime(deckId)
          // valtio 상태 업데이트
          this.publish([deckId, 'uiPlaybackTime'], calculatedTime)
          deckState.uiPlaybackTime = calculatedTime
        }
      })
    }

    // 다음 프레임 요청 (재생 중인 덱이 하나라도 있을 때만)
    const anyDeckIsPlaying = Object.values(DECK_IDS).some(
      deckId => deckoState.decks[deckId]?.isPlaying
    )
    if (anyDeckIsPlaying) {
      this.animationFrameId = requestAnimationFrame(this.updatePlaybackTimes)
    } else {
      // 모든 덱이 멈췄으면 루프를 완전히 중지
      this.stopPlaybackTimeUpdates()
      // 여기서 마지막으로 UI 시간을 확정 (재생 시간 = 총 길이)
      Object.values(DECK_IDS).forEach(deckId => {
        const deckState = deckoState.decks[deckId]
        if (deckState && !deckState.isPlaying) {
          const finalTime = deckState.duration
          this.publish([deckId, 'uiPlaybackTime'], finalTime)
          deckState.uiPlaybackTime = finalTime // 끝났으면 총 길이로 표시
        }
      })
    }
  }

  // --- 내부 헬퍼 함수 ---

  private publish<T extends keyof IDeckState | keyof IGlobalState>(
    key: [TDeckId, T],
    value: T extends keyof IDeckState
      ? IDeckState[T]
      : IGlobalState[keyof IGlobalState]
  ) {
    for (const subscriber of subscribers) {
      if (subscriber[0] === key) {
        subscriber[1](value)
      }
    }
  }

  private stopDeckInternal(deckId: TDeckId, nextStartTime: number) {
    const deckState = deckoState.decks[deckId]
    if (!deckState) return

    this.releaseBufferSourceNode(deckId)

    // valtio 상태 업데이트
    this.publish<'valtio_nextStartTime'>(
      [deckId, 'valtio_nextStartTime'],
      nextStartTime
    )
    deckState.valtio_nextStartTime = nextStartTime
    // UI 재생 시간은 다음 루프에서 업데이트되거나 정지 시 확정됨
  }

  private applyCrossFade(value: number) {
    const crossFadeNode1 = this.crossFadeNodes.get(1)
    const crossFadeNode2 = this.crossFadeNodes.get(2)

    const gain1 = Math.cos((value * Math.PI) / 2)
    const gain2 = Math.cos(((1 - value) * Math.PI) / 2)

    if (crossFadeNode1 && this.audioContext) {
      crossFadeNode1.gain.linearRampToValueAtTime(
        gain1,
        this.audioContext.currentTime + 0.05
      )
    }
    if (crossFadeNode2 && this.audioContext) {
      crossFadeNode2.gain.linearRampToValueAtTime(
        gain2,
        this.audioContext.currentTime + 0.05
      )
    }
  }

  private clampGain(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  private createSourceNode(
    deckId: TDeckId,
    audioBuffer: AudioBuffer
  ): AudioBufferSourceNode | null {
    if (!this.audioContext) return null
    const gainNode = this.gainNodes.get(deckId)
    const deckState = deckoState.decks[deckId]

    if (!gainNode || !deckState) return null

    const sourceNode = this.audioContext.createBufferSource()
    sourceNode.buffer = audioBuffer
    sourceNode.playbackRate.value = deckState.speed
    sourceNode.connect(gainNode)

    // 재생 종료 시 이벤트 리스너
    sourceNode.onended = () => {
      // isPlaying 상태가 true일 때만 (즉, 자연스럽게 끝났을 때만) 처리
      // 수동으로 멈췄을 때는 isPlaying이 이미 false일 것
      if (deckoState.decks[deckId]?.isPlaying) {
        console.log(`Deck ${deckId} finished playing.`)
        // 자연스럽게 끝난 경우, 재생 시간을 총 길이로 확정
        const finalDuration = deckoState.decks[deckId]!.duration
        this.publish<'uiPlaybackTime'>(
          [deckId, 'uiPlaybackTime'],
          finalDuration
        )
        deckoState.decks[deckId]!.uiPlaybackTime = finalDuration
        this.publish<'isPlaying'>([deckId, 'isPlaying'], false)
        this.stopDeckInternal(deckId, finalDuration) // 내부 상태 정지
        this.checkAndStopPlaybackTimeUpdates() // 모든 덱 멈췄는지 확인 후 루프 중지
      }
      // else { console.log(`Deck ${deckId} stopped manually.`); } // 수동 정지 로그 (디버깅용)
    }

    return sourceNode
  }

  private releaseBufferSourceNode(deckId: TDeckId) {
    const sourceNode = this.bufferSourceNodes.get(deckId)
    if (sourceNode) {
      try {
        sourceNode.stop()
      } catch (e) {
        // console.warn(`[Deck ${deckId}] Error stopping source node:`, e);
      }
      sourceNode.disconnect()
      sourceNode.onended = null
      this.bufferSourceNodes.set(deckId, null)
    }
  }

  // --- 상태 Getter 함수 (valtio 상태 기반) ---
  // 이제 UI에서 getPlaybackTime을 직접 호출하는 대신 valtio 상태를 바라봅니다.
  // 이 함수는 내부 계산용으로 유지됩니다.
  getPlaybackTime(deckId: TDeckId): number {
    const deckState = deckoState.decks[deckId]
    if (!deckState || !this.audioContext) return 0

    if (deckState.isPlaying) {
      const elapsedTime =
        (this.audioContext.currentTime - deckState.valtio_prevStartTime) *
        deckState.speed
      const calculatedTime = deckState.valtio_nextStartTime + elapsedTime
      // 총 길이를 넘지 않도록 하되, 마지막 프레임에서 duration으로 딱 떨어지도록
      return Math.min(calculatedTime, deckState.duration)
    } else {
      return deckState.valtio_nextStartTime
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const deckoManager = new DeckoManager()
