import { Decko, EDeckIds } from '../src/index'

describe('Decko Unit Tests with Mocks', () => {
  let decko: Decko

  beforeEach(() => {
    decko = new Decko()
  })

  test('초기화 시 2개의 데크가 생성되어야 한다', () => {
    const deck1 = decko.getDeck(EDeckIds.DECK_1)
    const deck2 = decko.getDeck(EDeckIds.DECK_2)
    expect(deck1).toBeDefined()
    expect(deck2).toBeDefined()
  })

  test('데크 1, 2에 오디오 파일을 로드할 수 있어야 한다', async () => {
    const blob = new Blob(['test'], { type: 'audio/mp3' })
    await decko.loadTrack(EDeckIds.DECK_1, blob)
    await decko.loadTrack(EDeckIds.DECK_2, blob)
    expect(decko.getDeck(EDeckIds.DECK_1)?.audioBuffer).toBeDefined()
    expect(decko.getDeck(EDeckIds.DECK_2)?.audioBuffer).toBeDefined()
  })
})
