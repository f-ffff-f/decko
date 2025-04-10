type TDeckIds = 1 | 2

interface IDeck {
  id: TDeckIds
  audioBuffer: AudioBuffer | null
  bufferSourceNode: AudioBufferSourceNode | null
  gainNode: GainNode | null
  crossFadeNode: GainNode | null
  speed: number
  prevStartTime: number
  nextStartTime: number
  isPlaying: boolean
  isSeeking: boolean
  isTrackLoading: boolean
}

export class Decko {
  private audioContext: AudioContext | null = null
  private nextId = 1
  private decks: IDeck[] = []
  private crossFadeValue = 0.5
  private isInitialized = false

  constructor() {
    // 생성자에서는 초기화하지 않음
  }

  /**
   * 브라우저 환경에서만 호출할 수 있는 초기화 함수
   * Next.js에서는 useEffect 내에서 호출해야 함
   */
  init() {
    // 이미 초기화되었거나 브라우저 환경이 아니면 실행하지 않음
    if (this.isInitialized || typeof window === 'undefined') return

    this.audioContext = new AudioContext()
    const masterGainNode = this.getMasterGainNode()
    if (masterGainNode) {
      this.addDeck(masterGainNode)
      this.addDeck(masterGainNode)
    }
    this.isInitialized = true
  }

  getMasterGainNode(): GainNode | null {
    if (!this.audioContext) return null

    const reductionNode = this.audioContext.createGain()
    reductionNode.gain.value = 0.25
    reductionNode.connect(this.audioContext.destination)
    return reductionNode
  }

  /** Deck을 추가 */
  addDeck(masterGainNode: GainNode): IDeck | null {
    if (!this.audioContext) return null

    const gainNode = this.audioContext.createGain()
    const crossFadeNode = this.audioContext.createGain()
    crossFadeNode.gain.value = this.crossFadeValue

    gainNode.connect(crossFadeNode).connect(masterGainNode)

    const deck: IDeck = {
      id: this.nextId++ as TDeckIds,
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
    }

    this.decks.push(deck)
    return deck
  }

  /** 특정 데크에 파일 로드 */
  async loadTrack(deckId: TDeckIds, blob: Blob) {
    if (!this.isInitialized) this.init()
    if (!this.audioContext) return

    const deck = this.findDeck(deckId)
    if (!deck) return

    try {
      deck.isTrackLoading = true
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      deck.audioBuffer = audioBuffer
    } catch (error) {
      console.error('Failed to load audio file:', error)
    } finally {
      deck.isTrackLoading = false
    }

    this.releaseBuffer(deck, 0)

    this.playPauseDeck(deckId)
  }

  /** 재생 정지 토글 */
  async playPauseDeck(deckId: TDeckIds) {
    if (!this.isInitialized) this.init()
    if (!this.audioContext) return

    const deck = this.findDeck(deckId)
    if (!deck || !deck.audioBuffer || !deck.gainNode) return

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    if (deck.isPlaying) {
      const playbackTime = this.getPlaybackTime(deckId)
      this.releaseBuffer(deck, playbackTime)
    } else {
      deck.bufferSourceNode = this.createSourceNode(deck)
      if (deck.bufferSourceNode) {
        deck.bufferSourceNode.playbackRate.value = deck.speed
        deck.bufferSourceNode.start(0, deck.nextStartTime)
        deck.prevStartTime = this.audioContext.currentTime
        deck.isPlaying = true
      }
    }
  }

  /** 데크 이동 */
  seekDeck(deckId: TDeckIds, seekTime: number) {
    if (!this.isInitialized) this.init()
    if (!this.audioContext) return

    const deck = this.findDeck(deckId)
    if (!deck || !deck.audioBuffer) return

    if (seekTime < 0) seekTime = 0
    if (seekTime > deck.audioBuffer.duration) {
      seekTime = deck.audioBuffer.duration
    }

    deck.isSeeking = true

    if (deck.isPlaying) {
      this.releaseBuffer(deck, seekTime)
      this.playPauseDeck(deckId)
    } else {
      deck.nextStartTime = seekTime
    }

    deck.isSeeking = false
  }

  /** 개별 볼륨 조절 */
  setVolume(deckId: TDeckIds, volume: number) {
    if (!this.isInitialized) this.init()

    const deck = this.findDeck(deckId)
    if (!deck || !deck.gainNode) return

    deck.gainNode.gain.value = this.clampGain(volume)
  }

  /** 개별 속도 조절 */
  setSpeed(deckId: TDeckIds, speed: number) {
    if (!this.isInitialized) this.init()

    const deck = this.findDeck(deckId)
    if (!deck) return

    deck.speed = speed

    if (!deck.bufferSourceNode) return
    deck.bufferSourceNode.playbackRate.value = speed
  }

  /** 크로스페이드 조절 */
  setCrossFade(value: number) {
    if (!this.isInitialized) this.init()

    this.crossFadeValue = this.clampGain(value)

    if (this.decks[0] && this.decks[0].crossFadeNode) {
      this.decks[0].crossFadeNode.gain.value = Math.cos((value * Math.PI) / 2)
    }

    if (this.decks[1] && this.decks[1].crossFadeNode) {
      this.decks[1].crossFadeNode.gain.value = Math.cos(
        ((1 - value) * Math.PI) / 2
      )
    }
  }

  getDeck(deckId: TDeckIds): IDeck | undefined {
    return this.findDeck(deckId)
  }

  getAudioBuffer(deckId: TDeckIds): AudioBuffer | null {
    const deck = this.findDeck(deckId)
    return deck?.audioBuffer ?? null
  }

  /** 현재 플레이백 시간 */
  getPlaybackTime(deckId: TDeckIds): number {
    if (!this.audioContext) return 0

    const deck = this.findDeck(deckId)
    if (!deck) return 0

    return deck.isPlaying
      ? deck.nextStartTime + this.getElapsedTime(deck.prevStartTime, deck.speed)
      : deck.nextStartTime
  }

  /** 전체 재생 길이 */
  getAudioBufferDuration(deckId: TDeckIds): number {
    const deck = this.findDeck(deckId)
    return deck?.audioBuffer?.duration ?? 0
  }

  /** 개별 볼륨 */
  getVolume(deckId: TDeckIds): number {
    return this.findDeck(deckId)?.gainNode?.gain.value ?? 0
  }

  /** 개별 속도 */
  getSpeed(deckId: TDeckIds): number {
    return this.findDeck(deckId)?.speed ?? 1
  }

  /** 크로스페이드 */
  getCrossFade(): number {
    return this.crossFadeValue
  }

  /** 재생 여부 */
  isPlaying(deckId: TDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isPlaying : false
  }

  /** 이동 여부 */
  isSeeking(deckId: TDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isSeeking : false
  }

  /** 로딩 상태 확인 */
  isTrackLoading(deckId: TDeckIds): boolean {
    const deck = this.findDeck(deckId)
    return deck ? deck.isTrackLoading : false
  }

  /** 초기화 여부 확인 */
  isReady(): boolean {
    return this.isInitialized && !!this.audioContext
  }

  private clampGain(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  /** AudioBufferSourceNode 생성 */
  private createSourceNode(deck: IDeck): AudioBufferSourceNode | null {
    if (!this.audioContext || !deck.audioBuffer || !deck.gainNode) return null

    const sourceNode = this.audioContext.createBufferSource()
    sourceNode.buffer = deck.audioBuffer
    sourceNode.connect(deck.gainNode)
    return sourceNode
  }

  /** 데크 찾기 */
  private findDeck(deckId: TDeckIds): IDeck | undefined {
    return this.decks.find(d => d.id === deckId)
  }

  /** 버퍼 해제 */
  private releaseBuffer(deck: IDeck, nextStartTime: number) {
    if (!deck.bufferSourceNode) {
      return
    }

    deck.bufferSourceNode.stop()
    deck.bufferSourceNode = null
    deck.nextStartTime = nextStartTime
    deck.isPlaying = false
  }

  /** 기록한 시간 부터 경과된 시간 */
  private getElapsedTime(lastRecordedTime: number, speed: number): number {
    if (!this.audioContext) return 0

    const realTimeElapsed = this.audioContext.currentTime - lastRecordedTime
    return realTimeElapsed * speed
  }

  public debugManager() {
    if (!this.audioContext) return 'AudioContext not initialized'

    const _decks = this.decks.map(deck => ({
      id: deck.id,
      audioBuffer: deck.audioBuffer ? 'loaded' : 'not loaded',
      bufferSourceNode: deck.bufferSourceNode ? 'created' : 'not created',
      isPlaying: deck.isPlaying,
      isTrackLoading: deck.isTrackLoading,
      nextStartTime: deck.nextStartTime.toFixed(0),
      prevStartTime: deck.prevStartTime.toFixed(0),
    }))

    const str = JSON.stringify(_decks, null, 2)
      .replace(/^{|}$/g, '')
      .replace(/"([^"]+)":/g, '$1:')

    return `${str}
this.audioContext.currentTime: ${this.audioContext.currentTime.toFixed(0)}`
  }
}

/** @Singleton */
export const deckoSingleton = new Decko()
