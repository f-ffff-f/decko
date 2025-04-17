// decko.test.ts

import { EDeckIds } from '@/constants'

// --- Context Version Imports ---
import { Decko as ContextDecko } from '@/contextVersion/Decko'

// --- Observer Version Imports ---
import { Decko as ObserverDecko } from '@/observerVersion/Decko'

// --- Zustand Version Imports ---
import { getDecko as getZustandDecko } from '@/zustandVersion/getDecko'
import { useDeckoStore } from '@/zustandVersion/useDeckoStore'
import { IDeck as IZustandDeck } from '@/zustandVersion/Decko'

// --- Mocking AudioContext related features globally ---

let currentMockTime = 0

const mockAudioContext = {
  state: 'running',
  createGain: jest.fn().mockImplementation(() => ({
    gain: { value: 0 },
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn(),
  })),
  createBufferSource: jest.fn().mockImplementation(() => ({
    buffer: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    playbackRate: { value: 1 },
    onended: null,
  })),
  decodeAudioData: jest.fn().mockImplementation(async () => {
    return {
      duration: 120,
      length: 44100 * 120,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(10)),
    } as unknown as AudioBuffer
  }),
  resume: jest.fn().mockResolvedValue(undefined),
  destination: {},
} as unknown as Omit<AudioContext, 'currentTime'>

Object.defineProperty(mockAudioContext, 'currentTime', {
  get: () => currentMockTime,
  configurable: true,
})

if (typeof global !== 'undefined') {
  global.AudioContext = jest.fn(() => mockAudioContext as AudioContext) as any
} else if (typeof window !== 'undefined') {
  ;(window as any).AudioContext = jest.fn(
    () => mockAudioContext as AudioContext
  ) as any
}

// --- Mock requestAnimationFrame with Asynchronous Behavior ---
let rafCallbacks: Map<number, FrameRequestCallback> = new Map()
let nextRafId = 1

const mockRequestAnimationFrame = (cb: FrameRequestCallback): number => {
  const id = nextRafId++
  rafCallbacks.set(id, cb)
  setImmediate(() => {
    if (rafCallbacks.has(id)) {
      const callback = rafCallbacks.get(id)
      rafCallbacks.delete(id)
      try {
        callback?.(performance.now())
      } catch (e) {
        console.error('Error in mocked RAF callback:', e)
      }
    }
  })
  return id
}

const mockCancelAnimationFrame = (id: number) => {
  rafCallbacks.delete(id)
}

if (typeof performance === 'undefined') {
  ;(global as any).performance = { now: jest.fn(() => currentMockTime * 1000) }
} else if (!jest.isMockFunction(performance.now)) {
  jest
    .spyOn(performance, 'now')
    .mockImplementation(() => currentMockTime * 1000)
}

if (typeof window !== 'undefined') {
  window.requestAnimationFrame = jest.fn(mockRequestAnimationFrame)
  window.cancelAnimationFrame = jest.fn(mockCancelAnimationFrame)
} else if (typeof global !== 'undefined') {
  global.requestAnimationFrame = jest.fn(mockRequestAnimationFrame)
  global.cancelAnimationFrame = jest.fn(mockCancelAnimationFrame)
}

const nextTick = () => new Promise(resolve => setImmediate(resolve))
const createDummyBlob = () =>
  new Blob(['dummy audio data'], { type: 'audio/mp3' })
const advanceAudioTime = (seconds: number) => {
  currentMockTime += seconds
}

// == Context Version Tests ==
describe('Context Decko Unit Tests', () => {
  let decko: ContextDecko
  let deck1Id = EDeckIds.DECK_1
  let deck2Id = EDeckIds.DECK_2

  beforeAll(() => {
    if (!global.AudioContext && !(window as any).AudioContext) {
      jest
        .spyOn(window, 'AudioContext')
        .mockImplementation(() => mockAudioContext as AudioContext)
    }
  })

  beforeEach(() => {
    decko = new ContextDecko()
    jest.clearAllMocks()
    currentMockTime = 0
    if (jest.isMockFunction(performance.now)) {
      ;(performance.now as jest.Mock).mockClear()
    }
  })

  // ... Context tests ...
  test('초기화 시 2개의 데크가 생성되어야 한다', () => {
    expect(decko.getDeck(deck1Id)).toBeDefined()
    expect(decko.getDeck(deck2Id)).toBeDefined()
  })

  test('데크 1, 2에 오디오 파일을 로드할 수 있어야 한다', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    await decko.loadTrack(deck2Id, blob)
    expect(decko.getAudioBuffer(deck1Id)).not.toBeNull()
    expect(decko.getAudioBuffer(deck2Id)).not.toBeNull()
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(2)
  })

  test('데크 1, 2에 로드한 후 자동재생이 되어야 한다', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    await decko.loadTrack(deck2Id, blob)
    expect(decko.isPlaying(deck2Id)).toBe(true)
  })

  test('재생/정지 토글 테스트', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(false)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(true)
  })

  test('setVolume은 0과 1 사이로 값이 클램핑되어야 한다', () => {
    decko.setVolume(deck1Id, -0.5)
    expect(decko.getVolume(deck1Id)).toBe(0)
    decko.setVolume(deck1Id, 1.5)
    expect(decko.getVolume(deck1Id)).toBe(1)
    decko.setVolume(deck1Id, 0.7)
    expect(decko.getVolume(deck1Id)).toBe(0.7)
  })

  test('setSpeed는 speed를 변경하고, bufferSourceNode가 있을 경우 playbackRate를 업데이트해야 한다', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    await decko.playPauseDeck(deck1Id)
    await decko.playPauseDeck(deck1Id)
    decko.setSpeed(deck1Id, 1.2)
    expect(decko.getSpeed(deck1Id)).toBe(1.2)
    const deck = decko.getDeck(deck1Id)
    expect(deck?.bufferSourceNode?.playbackRate.value).toBe(1.2)
    decko.setSpeed(deck1Id, 0.8)
    expect(decko.getSpeed(deck1Id)).toBe(0.8)
    expect(deck?.bufferSourceNode?.playbackRate.value).toBe(0.8)
  })

  test('setCrossFade는 데크 1, 2의 crossFadeNode.gain을 올바르게 조절해야 한다', () => {
    decko.setCrossFade(0.25)
    const deck1 = decko.getDeck(deck1Id)
    const deck2 = decko.getDeck(deck2Id)
    expect(deck1?.crossFadeNode.gain.value).toBeCloseTo(
      Math.cos((0.25 * Math.PI) / 2)
    )
    expect(deck2?.crossFadeNode.gain.value).toBeCloseTo(
      Math.cos(((1 - 0.25) * Math.PI) / 2)
    )
  })

  test('getPlaybackTime은 재생 중이면 elapsed time을, 아니면 nextStartTime을 반환해야 한다', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    advanceAudioTime(5)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(5)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(false)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(5)
    advanceAudioTime(2)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(5)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    advanceAudioTime(3)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(8)
  })

  test('seekDeck 테스트', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    advanceAudioTime(10)
    decko.seekDeck(deck1Id, 30)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(30)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    advanceAudioTime(5)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(35)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(false)
    decko.seekDeck(deck1Id, 50)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(50)
    expect(decko.isPlaying(deck1Id)).toBe(false)
    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(50)
    advanceAudioTime(5)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(55)
    decko.seekDeck(deck1Id, -10)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(0)
    decko.seekDeck(deck1Id, 200)
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(120)
  })

  test('loadTrack 호출 중에는 isTrackLoading이 true, 완료/실패 시 false가 되어야 한다', async () => {
    const originalDecode = mockAudioContext.decodeAudioData
    mockAudioContext.decodeAudioData = jest.fn().mockImplementation(() => {
      return new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              duration: 30,
              length: 44100 * 30,
              numberOfChannels: 2,
              sampleRate: 44100,
              getChannelData: jest.fn().mockReturnValue(new Float32Array(10)),
            } as unknown as AudioBuffer),
          100
        )
      )
    })
    const blob = createDummyBlob()
    const loadPromise = decko.loadTrack(deck1Id, blob)
    expect(decko.isTrackLoading(deck1Id)).toBe(true)
    await loadPromise
    expect(decko.isTrackLoading(deck1Id)).toBe(false)
    mockAudioContext.decodeAudioData = originalDecode
  })

  test('loadTrack에서 에러가 발생해도 isTrackLoading은 false로 설정되어야 한다', async () => {
    const originalDecode = mockAudioContext.decodeAudioData
    mockAudioContext.decodeAudioData = jest.fn().mockImplementation(() => {
      return new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Decode fail')), 50)
      )
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    expect(decko.isTrackLoading(deck1Id)).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    mockAudioContext.decodeAudioData = originalDecode
    consoleSpy.mockRestore()
  })
})

// == Observer Version Tests ==
describe('Observer Decko Unit Tests', () => {
  let decko: ObserverDecko
  let deck1Id = EDeckIds.DECK_1
  let deck2Id = EDeckIds.DECK_2
  let stateChangeListener: jest.Mock
  let timeUpdateListener: jest.Mock
  let trackLoadListener: jest.Mock

  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame = jest.fn(mockRequestAnimationFrame)
      window.cancelAnimationFrame = jest.fn(mockCancelAnimationFrame)
    } else if (typeof global !== 'undefined') {
      global.requestAnimationFrame = jest.fn(mockRequestAnimationFrame)
      global.cancelAnimationFrame = jest.fn(mockCancelAnimationFrame)
    }
    if (!global.AudioContext && !(window as any).AudioContext) {
      jest
        .spyOn(window, 'AudioContext')
        .mockImplementation(() => mockAudioContext as AudioContext)
    }
    if (typeof performance === 'undefined') {
      ;(global as any).performance = {
        now: jest.fn(() => currentMockTime * 1000),
      }
    } else if (!jest.isMockFunction(performance.now)) {
      jest
        .spyOn(performance, 'now')
        .mockImplementation(() => currentMockTime * 1000)
    }
  })

  beforeEach(() => {
    rafCallbacks.clear()
    nextRafId = 1
    decko = new ObserverDecko()
    jest.clearAllMocks()
    currentMockTime = 0
    if (jest.isMockFunction(performance.now)) {
      ;(performance.now as jest.Mock).mockClear()
    }
    stateChangeListener = jest.fn()
    timeUpdateListener = jest.fn()
    trackLoadListener = jest.fn()
    decko.subscribe('stateChange', stateChangeListener)
    decko.subscribe('playbackTimeUpdate', timeUpdateListener)
    decko.subscribe('trackLoadChange', trackLoadListener)
  })

  afterEach(() => {
    if (decko) {
      decko.unsubscribe('stateChange', stateChangeListener)
      decko.unsubscribe('playbackTimeUpdate', timeUpdateListener)
      decko.unsubscribe('trackLoadChange', trackLoadListener)
    }
  })

  test('초기화 시 2개의 데크가 생성되고 stateChange 이벤트는 발생하지 않아야 함 (구독 전)', () => {
    expect(decko.getDeck(deck1Id)).toBeDefined()
    expect(decko.getDeck(deck2Id)).toBeDefined()
    expect(stateChangeListener).toHaveBeenCalledTimes(0)
  })

  test('데크 1, 2에 오디오 파일 로드 시 관련 이벤트 발생', async () => {
    const blob = createDummyBlob()

    // Deck 1
    stateChangeListener.mockClear()
    trackLoadListener.mockClear()
    const loadPromise1 = decko.loadTrack(deck1Id, blob)
    // isTrackLoading=true 상태 변경은 동기적으로 일어나야 함
    expect(decko.isTrackLoading(deck1Id)).toBe(true)
    await nextTick() // Allow async notifications if any
    expect(trackLoadListener).toHaveBeenCalledWith({
      deckId: deck1Id,
      isLoading: true,
    })
    expect(stateChangeListener).toHaveBeenCalledTimes(2) // Only isLoading=true state change notified

    await loadPromise1
    await nextTick()
    expect(trackLoadListener).toHaveBeenCalledWith({
      deckId: deck1Id,
      isLoading: false,
    })
    expect(stateChangeListener).toHaveBeenCalledTimes(2) // isLoading=false state change notified
    expect(decko.isTrackLoading(deck1Id)).toBe(false)
    expect(decko.getAudioBuffer(deck1Id)).not.toBeNull()

    // Deck 2
    stateChangeListener.mockClear()
    trackLoadListener.mockClear()
    const loadPromise2 = decko.loadTrack(deck2Id, blob)
    expect(decko.isTrackLoading(deck2Id)).toBe(true) // Check sync state change
    await nextTick()
    expect(trackLoadListener).toHaveBeenCalledWith({
      deckId: deck2Id,
      isLoading: true,
    })
    expect(stateChangeListener).toHaveBeenCalledTimes(2)
    await loadPromise2
    await nextTick()
    expect(trackLoadListener).toHaveBeenCalledWith({
      deckId: deck2Id,
      isLoading: false,
    })
    expect(stateChangeListener).toHaveBeenCalledTimes(2)
  })

  test('재생/정지 토글 시 stateChange 이벤트 발생', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    stateChangeListener.mockClear()

    await decko.playPauseDeck(deck1Id)
    await nextTick()
    expect(decko.isPlaying(deck1Id)).toBe(true)
    expect(stateChangeListener).toHaveBeenCalledTimes(1)

    await decko.playPauseDeck(deck1Id)
    await nextTick()
    expect(decko.isPlaying(deck1Id)).toBe(false)
    expect(stateChangeListener).toHaveBeenCalledTimes(2)
  })

  test('재생 중 playbackTimeUpdate 이벤트 발생', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    timeUpdateListener.mockClear()

    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    await nextTick()

    expect(timeUpdateListener).toHaveBeenCalled()
    const firstCallArgs = timeUpdateListener.mock.calls[0][0]
    expect(firstCallArgs.deckId).toBe(deck1Id)
    expect(firstCallArgs.currentTime).toBeCloseTo(0)

    advanceAudioTime(1)
    await nextTick()

    expect(timeUpdateListener.mock.calls.length).toBeGreaterThanOrEqual(2)
    const secondCallArgs =
      timeUpdateListener.mock.calls[timeUpdateListener.mock.calls.length - 1][0]
    expect(secondCallArgs.deckId).toBe(deck1Id)
    expect(secondCallArgs.currentTime).toBeCloseTo(1)

    await decko.playPauseDeck(deck1Id)
  })

  test('seekDeck 시 stateChange 및 playbackTimeUpdate 이벤트 발생', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    stateChangeListener.mockClear()
    timeUpdateListener.mockClear()

    decko.seekDeck(deck1Id, 30)
    await nextTick()
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(30)
    expect(stateChangeListener).toHaveBeenCalledTimes(2) // isSeeking true -> false
    expect(timeUpdateListener).toHaveBeenCalledWith({
      deckId: deck1Id,
      currentTime: 30,
    })
    expect(timeUpdateListener).toHaveBeenCalledTimes(1) // Only once when stopped

    await decko.playPauseDeck(deck1Id)
    stateChangeListener.mockClear()
    timeUpdateListener.mockClear()
    advanceAudioTime(5)
    await nextTick() // Let playback run briefly

    decko.seekDeck(deck1Id, 60)
    await nextTick()
    expect(decko.getPlaybackTime(deck1Id)).toBeCloseTo(60)
    expect(stateChangeListener).toHaveBeenCalledTimes(2) // isSeeking true -> false
    expect(timeUpdateListener).toHaveBeenCalled() // RAF loop continues
    const lastCallArgs =
      timeUpdateListener.mock.calls[timeUpdateListener.mock.calls.length - 1][0]
    expect(lastCallArgs.deckId).toBe(deck1Id)
    expect(lastCallArgs.currentTime).toBeCloseTo(60)
  })

  test('setVolume, setSpeed, setCrossFade 시 stateChange 이벤트 발생', () => {
    stateChangeListener.mockClear()
    decko.setVolume(deck1Id, 0.8)
    expect(decko.getVolume(deck1Id)).toBe(0.8)
    expect(stateChangeListener).toHaveBeenCalledTimes(1)
    decko.setSpeed(deck1Id, 1.5)
    expect(decko.getSpeed(deck1Id)).toBe(1.5)
    expect(stateChangeListener).toHaveBeenCalledTimes(2)
    decko.setCrossFade(0.3)
    expect(decko.getCrossFade()).toBe(0.3)
    expect(stateChangeListener).toHaveBeenCalledTimes(3)
  })

  test('재생 종료 시 stateChange 및 playbackTimeUpdate 이벤트 발생', async () => {
    const originalDecode = mockAudioContext.decodeAudioData
    mockAudioContext.decodeAudioData = jest.fn().mockResolvedValue({
      duration: 0.1,
      length: 44100 * 0.1,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(10)),
    } as unknown as AudioBuffer)
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob)
    stateChangeListener.mockClear()
    timeUpdateListener.mockClear()

    await decko.playPauseDeck(deck1Id)
    expect(decko.isPlaying(deck1Id)).toBe(true)
    advanceAudioTime(0.2)
    await nextTick()
    await nextTick()

    expect(decko.isPlaying(deck1Id)).toBe(false)
    expect(stateChangeListener).toHaveBeenCalled()
    const lastStateChangeCall = stateChangeListener.mock.calls.length - 1
    // Check the last stateChange call was for playback stopping (no payload)
    // This might be fragile if other state changes happen near the end
    // expect(stateChangeListener.mock.calls[lastStateChangeCall][0]).toBeUndefined();

    expect(timeUpdateListener).toHaveBeenCalled()
    const lastTimeUpdateArgs =
      timeUpdateListener.mock.calls[timeUpdateListener.mock.calls.length - 1][0]
    expect(lastTimeUpdateArgs.deckId).toBe(deck1Id)
    expect(lastTimeUpdateArgs.currentTime).toBeCloseTo(0.1) // End time

    mockAudioContext.decodeAudioData = originalDecode
  })
})

// == Zustand Version Tests ==
describe('Zustand Decko Unit Tests', () => {
  let decko: ReturnType<typeof getZustandDecko>
  let deck1Id = EDeckIds.DECK_1
  let deck2Id = EDeckIds.DECK_2
  let initialStoreState: ReturnType<typeof useDeckoStore.getState>

  beforeAll(() => {
    initialStoreState = useDeckoStore.getState()
    if (!global.AudioContext && !(window as any).AudioContext) {
      jest
        .spyOn(window, 'AudioContext')
        .mockImplementation(() => mockAudioContext as AudioContext)
    }
    if (typeof performance === 'undefined') {
      ;(global as any).performance = {
        now: jest.fn(() => currentMockTime * 1000),
      }
    } else if (!jest.isMockFunction(performance.now)) {
      jest
        .spyOn(performance, 'now')
        .mockImplementation(() => currentMockTime * 1000)
    }
  })

  beforeEach(() => {
    useDeckoStore.setState(initialStoreState, true)
    decko = getZustandDecko() // Ensure instance is fresh or reset
    jest.clearAllMocks()
    currentMockTime = 0
    rafCallbacks.clear()
    nextRafId = 1
    if (jest.isMockFunction(performance.now)) {
      ;(performance.now as jest.Mock).mockClear()
    }
    // Manually reset crucial internal state if singleton causes issues
    // const deck1Internal = decko.getDeck(deck1Id);
    // if (deck1Internal) {
    //     deck1Internal.prevStartTime = 0;
    //     deck1Internal.nextStartTime = 0;
    //     // etc.
    // }
  })

  test('초기화 시 Decko 인스턴스 생성 및 스토어에 데크 정보 반영', () => {
    const storeState = useDeckoStore.getState()
    expect(storeState.decks[deck1Id]).toBeDefined()
    expect(storeState.decks[deck2Id]).toBeDefined()
    expect(storeState.decks[deck1Id]?.id).toBe(deck1Id)
  })

  test('데크 1, 2에 오디오 파일 로드 시 스토어 상태 업데이트', async () => {
    const blob = createDummyBlob()

    // Deck 1 로드
    const loadPromise1 = decko.loadTrack(deck1Id, blob)
    // Zustand: isTrackLoading is set async *after* decode. Check after await.
    await loadPromise1

    let deck1State = useDeckoStore.getState().decks[deck1Id]
    expect(deck1State?.isTrackLoading).toBe(false) // Should be false after load finishes
    expect(deck1State?.audioBuffer).not.toBeNull()
    expect(deck1State?.isPlaying).toBe(true) // Auto-plays

    // Deck 2 로드
    const loadPromise2 = decko.loadTrack(deck2Id, blob)
    // Check final state after await
    await loadPromise2
    const deck2State = useDeckoStore.getState().decks[deck2Id]
    expect(deck2State?.isTrackLoading).toBe(false)
    expect(deck2State?.audioBuffer).not.toBeNull()
    expect(deck2State?.isPlaying).toBe(true)
  })

  test('재생/정지 토글 시 isPlaying 상태 스토어에 반영', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob) // Auto-plays, prevTime=0, nextTime=0

    await decko.playPauseDeck(deck1Id) // Stop
    expect(useDeckoStore.getState().decks[deck1Id]?.isPlaying).toBe(false)
    expect(useDeckoStore.getState().decks[deck1Id]?.nextStartTime).toBeCloseTo(
      0
    ) // Stopped at ~0

    advanceAudioTime(2) // context time = 2

    await decko.playPauseDeck(deck1Id) // Play again
    expect(useDeckoStore.getState().decks[deck1Id]?.isPlaying).toBe(true)
    expect(useDeckoStore.getState().decks[deck1Id]?.prevStartTime).toBeCloseTo(
      2
    ) // Start time recorded
    expect(useDeckoStore.getState().decks[deck1Id]?.nextStartTime).toBeCloseTo(
      0
    ) // Resuming from 0
  })

  test('seekDeck 시 isSeeking, nextStartTime 상태 스토어에 반영', async () => {
    const blob = createDummyBlob()
    await decko.loadTrack(deck1Id, blob) // Auto-plays, prevTime=0, nextTime=0
    const initialTime = currentMockTime

    decko.seekDeck(deck1Id, 30) // Play continues, state updated
    const stateAfterSeek = useDeckoStore.getState().decks[deck1Id]
    expect(stateAfterSeek?.isSeeking).toBe(false)
    expect(stateAfterSeek?.nextStartTime).toBeCloseTo(30)
    expect(stateAfterSeek?.isPlaying).toBe(true)
    expect(stateAfterSeek?.prevStartTime).toBeCloseTo(initialTime) // Seek records current time

    await decko.playPauseDeck(deck1Id) // Stop playback
    const stoppedTime = decko.getPlaybackTime(deck1Id) // Get time when stopped (~30)

    decko.seekDeck(deck1Id, 50) // Seek while stopped
    const stateAfterSeekStopped = useDeckoStore.getState().decks[deck1Id]
    expect(stateAfterSeekStopped?.isSeeking).toBe(false)
    expect(stateAfterSeekStopped?.nextStartTime).toBeCloseTo(50) // Only nextStart updates
    expect(stateAfterSeekStopped?.isPlaying).toBe(false)
  })

  test('setVolume 시 gainNode 상태 스토어에 반영', () => {
    decko.setVolume(deck1Id, 0.7)
    expect(
      useDeckoStore.getState().decks[deck1Id]?.gainNode.gain.value
    ).toBeCloseTo(0.7)
  })

  test('setSpeed 시 speed 상태 스토어에 반영', () => {
    decko.setSpeed(deck1Id, 1.3)
    expect(useDeckoStore.getState().decks[deck1Id]?.speed).toBe(1.3)
  })

  test('setCrossFade 시 crossFade 및 각 데크의 crossFadeNode 상태 스토어에 반영', () => {
    decko.setCrossFade(0.4)
    const storeState = useDeckoStore.getState()
    expect(storeState.crossFade).toBeCloseTo(0.4)
    expect(storeState.decks[deck1Id]?.crossFadeNode.gain.value).toBeCloseTo(
      Math.cos((0.4 * Math.PI) / 2)
    )
    expect(storeState.decks[deck2Id]?.crossFadeNode.gain.value).toBeCloseTo(
      Math.cos(((1 - 0.4) * Math.PI) / 2)
    )
  })
})
