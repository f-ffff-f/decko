import { ChangeEvent } from 'react'
import { DECK_IDS, deckoManager, useDeckoSnapshot } from '../../src/'
import Deck from './components/Deck'

const App = () => {
  const handleCrossFadeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.setCrossFade(value)
  }

  const snapshot = useDeckoSnapshot()

  return (
    <div className="app-container">
      <h1>Decko Test App</h1>

      <div className="decks-container">
        <Deck deckId={DECK_IDS.ID_1} />

        <div className="crossfade-control">
          <label>
            Crossfade: {snapshot.crossFade.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={snapshot.crossFade}
              onChange={handleCrossFadeChange}
            />
          </label>
        </div>

        <Deck deckId={DECK_IDS.ID_2} />
      </div>
    </div>
  )
}

export default App
