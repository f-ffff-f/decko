import { Decko, EDeckIds } from '../src/index'

describe('Decko Unit Tests with Mocks', () => {
  let decko: Decko

  beforeEach(() => {
    // 매 테스트마다 새 Decko 인스턴스 생성 (내부에서 init() 호출됨)
    decko = null
    //
  })

  test('초기화 시 2개의 데크가 생성되어야 한다', () => {
    const deck1 = decko.getDeck(EDeckIds.DECK_1)
    const deck2 = decko.getDeck(EDeckIds.DECK_2)
    expect(deck1).toBeDefined()
    expect(deck2).toBeDefined()
  })
})
