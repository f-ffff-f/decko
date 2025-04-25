import { deckoManager, DeckoManager } from '../src/DeckoManager'
import { deckoState, IState } from '../src/state'
import { snapshot } from 'valtio'
import { TDeckId, DECK_IDS } from '../src/constants'
import type { AudioBuffer, GainNode } from 'node-web-audio-api'

// --- jest.mock('../src/state', ...) 제거 ---

// 초기 상태 값 정의 (beforeEach에서 사용)
const getInitialStateValues = (): IState => ({
  decks: {
    [DECK_IDS.ID_1]: {
      id: DECK_IDS.ID_1,
      volume: 0.8,
      isPlaying: false,
      speed: 1,
      duration: 0,
      valtio_nextStartTime: 0,
      valtio_prevStartTime: 0,
      isTrackLoading: false,
      audioBufferLoaded: false,
      isSeeking: false,
      uiPlaybackTime: 0,
    },
    [DECK_IDS.ID_2]: {
      id: DECK_IDS.ID_2,
      volume: 0.8,
      isPlaying: false,
      speed: 1,
      duration: 0,
      valtio_nextStartTime: 0,
      valtio_prevStartTime: 0,
      isTrackLoading: false,
      audioBufferLoaded: false,
      isSeeking: false,
      uiPlaybackTime: 0,
    },
  },
  crossFade: 0.5,
  // IState에 정의된 다른 모든 초기 상태 포함
})

// Mock AudioBuffer 객체 정의 (decodeAudioData Mocking은 여전히 유용할 수 있음)
const mockAudioBuffer: Partial<AudioBuffer> = { duration: 180 }

describe('DeckoManager Integration Tests', () => {
  // 4. beforeEach에서 실제 deckoState 리셋
  beforeEach(() => {
    const initialState = getInitialStateValues()

    // 객체 속성을 안전하게 복사 (얕은 복사)
    Object.assign(
      deckoState.decks[DECK_IDS.ID_1]!,
      initialState.decks[DECK_IDS.ID_1]
    )
    Object.assign(
      deckoState.decks[DECK_IDS.ID_2]!,
      initialState.decks[DECK_IDS.ID_2]
    )

    // 스파이/목 복원
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    console.log('Running afterAll cleanup...')
    const context = (deckoManager as any).audioContext
    if (context && typeof context.close === 'function') {
      console.log('Closing AudioContext...')
      await context.close()
      console.log('AudioContext closed.')
    } else {
      console.warn('AudioContext could not be found or closed in afterAll.')
    }
  })

  it('should create and export a singleton instance of DeckoManager', () => {
    expect(deckoManager).toBeDefined()
    expect(deckoManager).toBeInstanceOf(DeckoManager)
  })

  it('should have an AudioContext after instantiation (from setup)', () => {
    expect((deckoManager as any).audioContext.constructor.name).toBe(
      'AudioContext'
    )
  })

  // --- init() 검증 테스트 ---
  it('should initialize correctly after instantiation', () => {
    const dm = deckoManager // 싱글톤 인스턴스 사용
    const dmAny = dm as any // private 속성 접근용

    // 1. Master Gain Node 검증
    const masterGainNode = dmAny.masterGainNode as GainNode | null
    expect(masterGainNode).toBeDefined() // 존재하는가?
    expect(masterGainNode).not.toBeNull() // null이 아닌가?
    // 초기 gain 값 확인 (부동 소수점 비교를 위해 toBeCloseTo 사용)
    expect(masterGainNode!.gain.value).toBeCloseTo(0.5)
    // destination 연결 여부는 직접 확인하기 어려움 (스파이가 init 전에 설정되어야 함)

    // 2. 내부 Map 크기 검증 (모든 덱에 대해 생성되었는지)
    const expectedDeckCount = Object.keys(DECK_IDS).length
    expect(dmAny.gainNodes.size).toBe(expectedDeckCount)
    expect(dmAny.crossFadeNodes.size).toBe(expectedDeckCount)
    expect(dmAny.bufferSourceNodes.size).toBe(expectedDeckCount) // 초기엔 null이라도 엔트리는 있어야 함
    expect(dmAny.audioBuffers.size).toBe(expectedDeckCount) // 초기엔 null이라도 엔트리는 있어야 함

    // 3. 각 덱별 설정 검증
    const initialSnapshot = snapshot(deckoState) // 검증에 사용할 초기 상태 스냅샷

    Object.values(DECK_IDS).forEach((deckId: TDeckId) => {
      // 3-1. 각 덱의 GainNode 검증
      const gainNode = dmAny.gainNodes.get(deckId) as GainNode | undefined
      expect(gainNode).toBeDefined()
      // 초기 볼륨 값 검증 (초기 상태 값과 비교)
      expect(gainNode!.gain.value).toBeCloseTo(
        initialSnapshot.decks[deckId]!.volume
      )

      // 3-2. 각 덱의 CrossFadeNode 검증
      const crossFadeNode = dmAny.crossFadeNodes.get(deckId) as
        | GainNode
        | undefined
      expect(crossFadeNode).toBeDefined()

      // 3-3. 다른 Map들의 초기 상태(null) 검증
      expect(dmAny.bufferSourceNodes.get(deckId)).toBeNull()
      expect(dmAny.audioBuffers.get(deckId)).toBeNull()

      // 3-4. 노드 연결 (gain -> crossFade -> master) 검증은 post-init 상태에서 어려움
    })
  })

  // --- 상태 변경 검증 로직 ---
  it('should set volume and update real valtio state', () => {
    const deckId = DECK_IDS.ID_1
    const newVolume = 0.8

    const gainNodesMap = (deckoManager as any).gainNodes as Map<
      TDeckId,
      GainNode
    >
    const targetGainNode = gainNodesMap.get(deckId)
    expect(targetGainNode).toBeDefined()
    const rampSpy = jest.spyOn(targetGainNode!.gain, 'linearRampToValueAtTime')

    // 5. 초기 상태 스냅샷 확인
    const initialStateSnapshot = snapshot(deckoState)
    expect(initialStateSnapshot.decks[deckId]?.volume).toBe(0.8)

    // Action: setVolume 호출
    deckoManager.setVolume(deckId, newVolume)

    // 부작용 확인 (GainNode 호출)
    expect(rampSpy).toHaveBeenCalledWith(newVolume, expect.any(Number))

    // 5. 변경된 상태 스냅샷 확인
    const updatedStateSnapshot = snapshot(deckoState)
    expect(updatedStateSnapshot.decks[deckId]?.volume).toBe(newVolume)
  })

  it('should apply crossfade and update real valtio state', () => {
    const crossFadeValue = 0.3
    // ... gain node, spy 설정 ...
    const crossFadeNodesMap = (deckoManager as any).crossFadeNodes as Map<
      TDeckId,
      GainNode
    >
    const cfNode1 = crossFadeNodesMap.get(DECK_IDS.ID_1)
    const cfNode2 = crossFadeNodesMap.get(DECK_IDS.ID_2)
    expect(cfNode1).toBeDefined()
    expect(cfNode2).toBeDefined()
    const rampSpy1 = jest.spyOn(cfNode1!.gain, 'linearRampToValueAtTime')
    const rampSpy2 = jest.spyOn(cfNode2!.gain, 'linearRampToValueAtTime')

    const initialStateSnapshot = snapshot(deckoState)
    expect(initialStateSnapshot.crossFade).toBe(0.5)

    // Action: setCrossFade 호출
    deckoManager.setCrossFade(crossFadeValue)

    // 부작용 확인 (GainNode 호출)
    const gain1 = Math.cos((crossFadeValue * Math.PI) / 2)
    const gain2 = Math.cos(((1 - crossFadeValue) * Math.PI) / 2)
    expect(rampSpy1).toHaveBeenCalledWith(gain1, expect.any(Number))
    expect(rampSpy2).toHaveBeenCalledWith(gain2, expect.any(Number))

    // 변경된 상태 스냅샷 확인
    const updatedStateSnapshot = snapshot(deckoState)
    expect(updatedStateSnapshot.crossFade).toBe(crossFadeValue)
  })

  it('should load track and update real valtio state', async () => {
    // 테스트 이름 명확화
    const deckId = DECK_IDS.ID_1
    const mockBlob = new Blob(['mock data'], { type: 'audio/mpeg' })
    jest.spyOn(mockBlob, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(8))

    const audioContext = (deckoManager as any).audioContext
    // decodeAudioData는 여전히 Mocking하는 것이 유용할 수 있음 (실제 디코딩 방지)
    const decodeSpy = jest
      .spyOn(audioContext, 'decodeAudioData')
      .mockResolvedValue(mockAudioBuffer as AudioBuffer)

    const initialStateSnapshot = snapshot(deckoState)
    expect(initialStateSnapshot.decks[deckId]?.audioBufferLoaded).toBe(false)
    expect(initialStateSnapshot.decks[deckId]?.duration).toBe(0)

    // Action: loadTrack 호출
    await deckoManager.loadTrack(deckId, mockBlob)

    // 부작용 확인 (decodeAudioData 호출, 버퍼 저장 등)
    expect(decodeSpy).toHaveBeenCalled()
    const audioBuffersMap = (deckoManager as any).audioBuffers as Map<
      TDeckId,
      AudioBuffer | null
    >
    expect(audioBuffersMap.get(deckId)).toEqual(mockAudioBuffer)

    // 변경된 상태 스냅샷 확인
    const updatedStateSnapshot = snapshot(deckoState)
    expect(updatedStateSnapshot.decks[deckId]?.audioBufferLoaded).toBe(true)
    expect(updatedStateSnapshot.decks[deckId]?.duration).toBe(
      mockAudioBuffer.duration
    )
    expect(updatedStateSnapshot.decks[deckId]?.isTrackLoading).toBe(false) // 로딩 완료 상태 확인
  })
})
