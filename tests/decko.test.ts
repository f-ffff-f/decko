import { Decko, EDeckIds } from '../src/index'

describe('Decko Unit Tests with Mocks', () => {
  const decko = new Decko()

  const allDeckIds = [EDeckIds.DECK_1, EDeckIds.DECK_2]

  test('초기화 시 2개의 데크가 생성되어야 한다', () => {
    allDeckIds.forEach(deckId => {
      const deck = decko.getDeck(deckId)
      expect(deck).toBeDefined()
    })
  })

  test('데크 1, 2에 오디오 파일을 로드할 수 있어야 한다', async () => {
    const blob = new Blob(['test'], { type: 'audio/mp3' })
    allDeckIds.forEach(async deckId => {
      await decko.loadTrack(deckId, blob)
    })

    allDeckIds.forEach(deckId => {
      expect(decko.getDeck(deckId)?.audioBuffer).toBeDefined()
    })
  })

  test('데크 1, 2에 로드한 후 자동재생이 되어야 한다', async () => {
    allDeckIds.forEach(deckId => {
      expect(decko.isPlaying(deckId)).toBe(true)
    })
  })
})
