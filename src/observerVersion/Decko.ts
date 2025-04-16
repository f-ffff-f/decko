import { EDeckIds } from '@/constants'

// 이벤트 타입 정의 (필요에 따라 더 구체적으로 정의 가능)
type DeckoEventType = 'stateChange' | 'playbackTimeUpdate' | 'trackLoadChange'

// 리스너 함수 타입 정의
type Listener = (payload?: any) => void

interface IDeck {
  id: EDeckIds
  audioBuffer: AudioBuffer | null
  bufferSourceNode: AudioBufferSourceNode | null
  gainNode: GainNode
  crossFadeNode: GainNode
  speed: number
  prevStartTime: number // 실제 오디오 컨텍스트 시작 시간
  nextStartTime: number // 오디오 버퍼 내 시작 오프셋
  isPlaying: boolean
  isSeeking: boolean
  isTrackLoading: boolean
  // 애니메이션 프레임 ID 추가 (재생 시간 업데이트용)
  animationFrameId: number | null
}

export class Decko {
  private audioContext: AudioContext
  private nextId = 1
  private decks: IDeck[] = []
  private crossFadeValue = 0.5

  // 이벤트 리스너 저장소
  private listeners: Map<DeckoEventType, Set<Listener>> = new Map()

  constructor() {
    this.audioContext = new AudioContext()
    this.init()
  }

  // --- 이벤트 에미터 관련 메서드 ---
  subscribe(eventType: DeckoEventType, listener: Listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)?.add(listener)
  }

  unsubscribe(eventType: DeckoEventType, listener: Listener) {
    this.listeners.get(eventType)?.delete(listener)
  }

  private notify(eventType: DeckoEventType, payload?: any) {
    this.listeners.get(eventType)?.forEach(listener => listener(payload))
    // 모든 상태 변경 시 'stateChange' 이벤트도 발생시켜 범용적인 업데이트 처리 가능
    if (eventType !== 'stateChange' && eventType !== 'playbackTimeUpdate') {
      this.listeners.get('stateChange')?.forEach(listener => listener())
    }
  }
  // --- ---

  init() {
    const masterGainNode = this.getMasterGainNode()
    this.addDeck(masterGainNode)
    this.addDeck(masterGainNode)
  }

  getMasterGainNode() {
    const reductionNode = this.audioContext.createGain()
    reductionNode.gain.value = 0.25
    reductionNode.connect(this.audioContext.destination)
    return reductionNode
  }

  addDeck(masterGainNode: GainNode) {
    const gainNode = this.audioContext.createGain()
    const crossFadeNode = this.audioContext.createGain()
    crossFadeNode.gain.value = this.crossFadeValue

    gainNode.connect(crossFadeNode).connect(masterGainNode)

    const deck: IDeck = {
      id: this.nextId++ as EDeckIds,
      audioBuffer: null,
      bufferSourceNode: null,
      gainNode,
      crossFadeNode,
      speed: 1,
      prevStartTime: 0,
      nextStartTime: 0,
      isPlaying: false,
      isSeeking: false,
      isTrackLoading: false,
      animationFrameId: null, // 초기화
    }

    this.decks.push(deck)
    this.notify('stateChange') // 데크 추가 시 상태 변경 알림
    return deck
  }

  async loadTrack(deckId: EDeckIds, blob: Blob) {
    const deck = this.findDeck(deckId)
    if (!deck) return

    // 이전 버퍼 해제 및 재생 시간 업데이트 중지
    this.stopPlaybackTimeUpdate(deck)
    if (deck.bufferSourceNode) {
      this.releaseBuffer(deck, 0) // 로드 시에는 시간 0으로 초기화
    }

    try {
      deck.isTrackLoading = true
      this.notify('trackLoadChange', { deckId, isLoading: true }) // 로딩 시작 알림
      this.notify('stateChange')
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      deck.audioBuffer = audioBuffer
      deck.nextStartTime = 0 // 성공 시 시간 초기화
    } catch (error) {
      console.error('Failed to load audio file:', error)
      deck.audioBuffer = null // 실패 시 버퍼 null 처리
    } finally {
      deck.isTrackLoading = false
      this.notify('trackLoadChange', { deckId, isLoading: false }) // 로딩 완료/실패 알림
      this.notify('stateChange')
    }
  }

  async playPauseDeck(deckId: EDeckIds) {
    const deck = this.findDeck(deckId)
    if (!deck || !deck.audioBuffer || deck.isTrackLoading) return

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    if (deck.isPlaying) {
      // --- 정지 ---
      const playbackTime = this.getPlaybackTimeInternal(deck) // 내부 함수 사용
      this.releaseBuffer(deck, playbackTime) // nextStartTime 업데이트됨
      this.stopPlaybackTimeUpdate(deck) // 재생 시간 업데이트 중지
    } else {
      // --- 재생 ---
      deck.bufferSourceNode = this.createSourceNode(deck)
      deck.bufferSourceNode.playbackRate.value = deck.speed
      // deck.nextStartTime부터 재생 시작
      deck.bufferSourceNode.start(0, deck.nextStartTime)
      // 시작 시점의 audioContext.currentTime 기록
      deck.prevStartTime = this.audioContext.currentTime
      deck.isPlaying = true
      this.startPlaybackTimeUpdate(deck) // 재생 시간 업데이트 시작
    }
    // isPlaying 상태가 변경되었으므로 알림
    this.notify('stateChange')
  }

  seekDeck(deckId: EDeckIds, seekTime: number) {
    const deck = this.findDeck(deckId)
    if (!deck || !deck.audioBuffer || deck.isTrackLoading) return

    let newSeekTime = Math.max(0, seekTime)
    if (newSeekTime > deck.audioBuffer.duration) {
      newSeekTime = deck.audioBuffer.duration
    }

    deck.isSeeking = true
    this.notify('stateChange') // 탐색 시작 알림 (필요 시)

    const wasPlaying = deck.isPlaying
    if (wasPlaying) {
      this.stopPlaybackTimeUpdate(deck) // 업데이트 잠시 중지
      this.releaseBuffer(deck, newSeekTime) // 버퍼 해제 및 nextStartTime 업데이트
      // 다시 재생 시작
      deck.bufferSourceNode = this.createSourceNode(deck)
      deck.bufferSourceNode.playbackRate.value = deck.speed
      deck.bufferSourceNode.start(0, deck.nextStartTime) // 업데이트된 nextStartTime 사용
      deck.prevStartTime = this.audioContext.currentTime // 시간 재기록
      deck.isPlaying = true // isPlaying 상태 유지
      this.startPlaybackTimeUpdate(deck) // 업데이트 다시 시작
    } else {
      // 재생 중이 아니면 nextStartTime만 업데이트
      deck.nextStartTime = newSeekTime
      // 재생 중이 아니므로 즉시 재생 시간 업데이트 이벤트 발생 (UI 반영 위함)
      this.notify('playbackTimeUpdate', {
        deckId,
        currentTime: deck.nextStartTime,
      })
    }

    deck.isSeeking = false
    this.notify('stateChange') // 탐색 완료 및 상태 변경 알림
  }

  setVolume(deckId: EDeckIds, volume: number) {
    const deck = this.findDeck(deckId)
    if (!deck) return
    deck.gainNode.gain.value = this.clampGain(volume)
    this.notify('stateChange') // 볼륨 변경 알림
  }

  setSpeed(deckId: EDeckIds, speed: number) {
    const deck = this.findDeck(deckId)
    if (!deck || deck.speed === speed) return // 변경 없으면 리턴

    const oldSpeed = deck.speed
    const currentTime = this.getPlaybackTimeInternal(deck) // 현재 재생 시간 계산

    deck.speed = speed

    if (deck.isPlaying && deck.bufferSourceNode) {
      // 재생 중일 때만 playbackRate 즉시 적용
      deck.bufferSourceNode.playbackRate.value = speed
      // 속도 변경 시, 현재 재생 시간을 기준으로 prevStartTime, nextStartTime 재설정 필요
      deck.nextStartTime = currentTime // 계산된 현재 시간을 새로운 시작 오프셋으로
      deck.prevStartTime = this.audioContext.currentTime // 현재 audioContext 시간을 새로운 기준 시간으로
    }
    // 재생 중이 아닐 때는 speed 값만 저장했다가 재생 시 반영됨

    this.notify('stateChange') // 속도 변경 알림
  }

  setCrossFade(value: number) {
    this.crossFadeValue = this.clampGain(value)
    const deck1 = this.decks[0]
    const deck2 = this.decks[1]

    if (deck1) {
      deck1.crossFadeNode.gain.value = Math.cos(
        (this.crossFadeValue * Math.PI) / 2
      )
    }
    if (deck2) {
      deck2.crossFadeNode.gain.value = Math.cos(
        ((1 - this.crossFadeValue) * Math.PI) / 2
      )
    }
    this.notify('stateChange') // 크로스페이드 변경 알림
  }

  // --- 재생 시간 업데이트 로직 ---

  private startPlaybackTimeUpdate(deck: IDeck) {
    // 이미 실행 중이면 중복 실행 방지
    if (deck.animationFrameId !== null) return

    const update = () => {
      if (!deck.isPlaying) {
        this.stopPlaybackTimeUpdate(deck) // 혹시 모를 상태 변화 감지
        return
      }
      const currentTime = this.getPlaybackTimeInternal(deck)
      this.notify('playbackTimeUpdate', { deckId: deck.id, currentTime })

      // 재생이 끝나면 업데이트 중지
      if (deck.audioBuffer && currentTime >= deck.audioBuffer.duration - 0.01) {
        // 오차 감안
        this.handlePlaybackEnd(deck)
      } else {
        deck.animationFrameId = requestAnimationFrame(update)
      }
    }
    deck.animationFrameId = requestAnimationFrame(update)
  }

  private stopPlaybackTimeUpdate(deck: IDeck) {
    if (deck.animationFrameId !== null) {
      cancelAnimationFrame(deck.animationFrameId)
      deck.animationFrameId = null
    }
  }

  // 재생 종료 처리
  private handlePlaybackEnd(deck: IDeck) {
    console.log(`Deck ${deck.id} playback finished`)
    this.releaseBuffer(deck, deck.audioBuffer?.duration ?? 0) // 끝 시간으로 설정
    this.stopPlaybackTimeUpdate(deck)
    this.notify('playbackTimeUpdate', {
      deckId: deck.id,
      currentTime: deck.nextStartTime,
    }) // 최종 시간 알림
    this.notify('stateChange') // isPlaying 상태 변경 알림
  }

  // --- Getter 메서드 (기존 유지 또는 필요시 수정) ---

  getDeck(deckId: EDeckIds): IDeck | undefined {
    return this.findDeck(deckId)
  }

  getAudioBuffer(deckId: EDeckIds): AudioBuffer | null {
    return this.findDeck(deckId)?.audioBuffer ?? null
  }

  // public 재생 시간 getter (UI용) - 상태 직접 접근
  getPlaybackTime(deckId: EDeckIds): number {
    const deck = this.findDeck(deckId)
    if (!deck) return 0
    // 재생 중이면 실시간 계산, 아니면 저장된 시간 반환
    return this.getPlaybackTimeInternal(deck)
  }

  // 내부 재생 시간 계산 로직 (private)
  private getPlaybackTimeInternal(deck: IDeck): number {
    if (!deck.audioBuffer) return 0

    let calculatedTime
    if (deck.isPlaying) {
      // (현재 AudioContext 시간 - 재생 시작 시점의 AudioContext 시간) * 속도 + 시작 오프셋
      const elapsedTime =
        (this.audioContext.currentTime - deck.prevStartTime) * deck.speed
      calculatedTime = deck.nextStartTime + elapsedTime
    } else {
      // 재생 중이 아니면 마지막으로 저장된 오프셋 반환
      calculatedTime = deck.nextStartTime
    }
    // 오디오 버퍼 길이를 넘지 않도록 제한
    return Math.min(calculatedTime, deck.audioBuffer.duration)
  }

  getAudioBufferDuration(deckId: EDeckIds): number {
    return this.findDeck(deckId)?.audioBuffer?.duration ?? 0
  }

  getVolume(deckId: EDeckIds): number {
    return this.findDeck(deckId)?.gainNode.gain.value ?? 0
  }

  getSpeed(deckId: EDeckIds): number {
    return this.findDeck(deckId)?.speed ?? 1
  }

  getCrossFade(): number {
    return this.crossFadeValue
  }

  isPlaying(deckId: EDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isPlaying : false
  }

  isSeeking(deckId: EDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isSeeking : false
  }

  isTrackLoading(deckId: EDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isTrackLoading : false
  }

  // --- Private Helper 메서드 ---

  private clampGain(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  private createSourceNode(deck: IDeck): AudioBufferSourceNode {
    const sourceNode = this.audioContext.createBufferSource()
    sourceNode.buffer = deck.audioBuffer
    sourceNode.connect(deck.gainNode)
    // sourceNode.onended = () => {
    //    // onended는 stop() 호출 시에도 발생하므로, 자연 종료 판별이 까다로움.
    //    // requestAnimationFrame 방식으로 종료 처리 권장.
    //    // if (deck.isPlaying) { // stop()에 의한 종료가 아닐 때만 처리
    //    //  this.handlePlaybackEnd(deck);
    //    // }
    // };
    return sourceNode
  }

  private findDeck(deckId: EDeckIds): IDeck | undefined {
    return this.decks.find(d => d.id === deckId)
  }

  // 버퍼 해제 및 다음 시작 시간 설정
  private releaseBuffer(deck: IDeck, nextStartTime: number) {
    if (deck.bufferSourceNode) {
      try {
        // 이미 종료된 노드에 stop()을 호출하면 에러 발생 가능성 있음
        if (deck.isPlaying) {
          // 재생 중이었던 노드만 명시적으로 stop
          deck.bufferSourceNode.stop()
          deck.bufferSourceNode.disconnect() // 연결 해제
        }
      } catch (e) {
        // console.warn("Error stopping buffer source:", e);
        // 에러 무시 또는 로깅
      }
      deck.bufferSourceNode = null
    }
    // nextStartTime 업데이트는 항상 수행
    deck.nextStartTime = Math.max(0, nextStartTime) // 0 미만 값 방지
    if (deck.audioBuffer) {
      deck.nextStartTime = Math.min(
        deck.nextStartTime,
        deck.audioBuffer.duration
      ) // 버퍼 길이 초과 방지
    }

    // isPlaying 상태는 playPauseDeck 또는 handlePlaybackEnd 등 호출하는 쪽에서 관리
    deck.isPlaying = false
  }

  // 사용하지 않게 됨 (getPlaybackTimeInternal로 대체)
  // private getElapsedTime(lastRecordedTime: number, speed: number): number {
  //   const realTimeElapsed = this.audioContext.currentTime - lastRecordedTime;
  //   return realTimeElapsed * speed;
  // }

  public debugManager() {
    const _decks = this.decks.map(deck => ({
      id: deck.id,
      audioBuffer: deck.audioBuffer
        ? `loaded (${deck.audioBuffer.duration.toFixed(2)}s)`
        : 'not loaded',
      bufferSourceNode: deck.bufferSourceNode ? 'created' : 'not created',
      gain: deck.gainNode.gain.value.toFixed(2),
      crossGain: deck.crossFadeNode.gain.value.toFixed(2),
      speed: deck.speed.toFixed(2),
      prevStartTime: deck.prevStartTime.toFixed(2),
      nextStartTime: deck.nextStartTime.toFixed(2),
      calculatedTime: this.getPlaybackTimeInternal(deck).toFixed(2),
      isPlaying: deck.isPlaying,
      isSeeking: deck.isSeeking,
      isTrackLoading: deck.isTrackLoading,
      animFrameId: deck.animationFrameId,
    }))

    const str = JSON.stringify(_decks, null, 2)
      .replace(/^{|}$/g, '')
      .replace(/"([^"]+)":/g, '$1:')

    return `${str}
  crossFadeValue: ${this.crossFadeValue.toFixed(2)}
  audioContext.currentTime: ${this.audioContext.currentTime.toFixed(2)}
  audioContext.state: ${this.audioContext.state}`
  }
}
