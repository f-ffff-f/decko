import { Decko, EDeckIds } from '../src/index'

// 한 번만 인스턴스 생성 (모든 테스트가 같은 인스턴스를 공유)
const decko = new Decko()
const deck1 = decko.getDeck(EDeckIds.DECK_1)
const deck2 = decko.getDeck(EDeckIds.DECK_2)

if (!deck1 || !deck2) {
  throw new Error('deck1 or deck2 is undefined')
}

const allDecks = [deck1, deck2]

describe('Decko Unit Tests with Single Instance', () => {
  test('초기화 시 2개의 데크가 생성되어야 한다', () => {
    allDecks.forEach(deck => {
      expect(deck).toBeDefined()
    })
  })

  test('데크 1, 2에 오디오 파일을 로드할 수 있어야 한다', async () => {
    const blob = new Blob(['test'], { type: 'audio/mp3' })
    await Promise.all(
      allDecks.map(async deck => {
        await decko.loadTrack(deck.id, blob)
      })
    )
    allDecks.forEach(deck => {
      expect(decko.getDeck(deck.id)?.audioBuffer).toBeDefined()
    })
  })

  test('데크 1, 2에 로드한 후 자동재생이 되어야 한다', () => {
    allDecks.forEach(deck => {
      expect(decko.isPlaying(deck.id)).toBe(true)
    })
  })

  test('재생/정지 토글 테스트', async () => {
    // 첫 번째 호출: 재생 중인 데크를 정지
    allDecks.forEach(deck => {
      decko.playPauseDeck(deck.id)
      expect(decko.isPlaying(deck.id)).toBe(false)
    })
    // 두 번째 호출: 다시 재생으로 토글
    allDecks.forEach(deck => {
      decko.playPauseDeck(deck.id)
      expect(decko.isPlaying(deck.id)).toBe(true)
    })
  })

  test('getMasterGainNode는 0.25의 gain value를 가진 GainNode를 반환해야 한다', () => {
    const masterGain = decko.getMasterGainNode()
    expect(masterGain).toBeDefined()
    expect(masterGain.gain.value).toBe(0.25)
  })

  test('addDeck는 새로운 데크를 생성하며, 올바른 프로퍼티들을 가져야 한다', () => {
    const masterGain = decko.getMasterGainNode()
    const newDeck = decko.addDeck(masterGain)
    expect(newDeck).toBeDefined()
    expect(newDeck.id).toBeGreaterThan(EDeckIds.DECK_2)
    expect(newDeck.gainNode).toBeDefined()
    expect(newDeck.crossFadeNode).toBeDefined()
    expect(newDeck.isPlaying).toBe(false)
  })

  test('setVolume은 0과 1 사이로 값이 클램핑되어야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    decko.setVolume(testDeck.id, -0.5)
    expect(testDeck.gainNode.gain.value).toBe(0)
    decko.setVolume(testDeck.id, 1.5)
    expect(testDeck.gainNode.gain.value).toBe(1)
    decko.setVolume(testDeck.id, 0.7)
    expect(testDeck.gainNode.gain.value).toBe(0.7)
  })

  test('setSpeed는 speed를 변경하고, bufferSourceNode가 있을 경우 playbackRate를 업데이트해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    decko.setSpeed(testDeck.id, 1.2)
    expect(testDeck.speed).toBe(1.2)
    // bufferSourceNode가 있을 경우 업데이트 검증
    testDeck.bufferSourceNode = { playbackRate: { value: 1 } } as any
    decko.setSpeed(testDeck.id, 0.8)
    expect(testDeck.speed).toBe(0.8)
    // null 체크 추가
    expect(testDeck.bufferSourceNode?.playbackRate.value).toBe(0.8)
  })

  test('setCrossFade는 데크 1, 2의 crossFadeNode.gain을 올바르게 조절해야 한다', () => {
    decko.setCrossFade(0.25)
    expect(allDecks[0].crossFadeNode.gain.value).toBeCloseTo(
      Math.cos((0.25 * Math.PI) / 2)
    )
    expect(allDecks[1].crossFadeNode.gain.value).toBeCloseTo(
      Math.cos(((1 - 0.25) * Math.PI) / 2)
    )
  })

  test('getAudioBuffer는 audioBuffer를 올바르게 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.audioBuffer = { duration: 50 } as any
    expect(decko.getAudioBuffer(testDeck.id)).toEqual(testDeck.audioBuffer)
  })

  test('getPlaybackTime은 재생 중이면 elapsed time을, 아니면 nextStartTime을 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.nextStartTime = 5
    testDeck.isPlaying = false
    expect(decko.getPlaybackTime(testDeck.id)).toBe(5)
    testDeck.isPlaying = true
    // @ts-ignore - audioContext는 private이지만 테스트를 위해 접근
    testDeck.prevStartTime = decko.audioContext.currentTime - 5
    expect(decko.getPlaybackTime(testDeck.id)).toBeCloseTo(5, 1)
  })

  test('getAudioBufferDuration은 audioBuffer가 있을 경우 duration을, 없으면 0을 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.audioBuffer = { duration: 70 } as any
    expect(decko.getAudioBufferDuration(testDeck.id)).toBe(70)
    testDeck.audioBuffer = null
    expect(decko.getAudioBufferDuration(testDeck.id)).toBe(0)
  })

  test('getVolume은 gainNode의 gain value를 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.gainNode.gain.value = 0.85
    expect(decko.getVolume(testDeck.id)).toBe(0.85)
  })

  test('getSpeed는 speed 값을 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.speed = 1.5
    expect(decko.getSpeed(testDeck.id)).toBe(1.5)
  })

  test('getCrossFade는 현재 crossFade 값을 반환해야 한다', () => {
    decko.setCrossFade(0.6)
    expect(decko.getCrossFade()).toBeCloseTo(0.6)
  })

  test('isPlaying은 재생 상태를 올바르게 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.isPlaying = true
    expect(decko.isPlaying(testDeck.id)).toBe(true)
    testDeck.isPlaying = false
    expect(decko.isPlaying(testDeck.id)).toBe(false)
  })

  test('isSeeking은 탐색 상태를 올바르게 반환해야 한다', () => {
    // 첫 번째 데크에 대해서만 테스트
    const testDeck = allDecks[0]
    testDeck.isSeeking = true
    expect(decko.isSeeking(testDeck.id)).toBe(true)
    testDeck.isSeeking = false
    expect(decko.isSeeking(testDeck.id)).toBe(false)
  })
})
