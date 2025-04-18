import DeckComponent from '@/zustandVersion/DeckComponent'
import { EDeckIds } from '@/constants'
import { selectCrossFade, useDeckoStore } from '@/zustandVersion/useDeckoStore'
const deckIds = Object.values(EDeckIds).filter(key => !isNaN(Number(key)))
import { getDecko } from '@/zustandVersion/getDecko'

const ZustandApp = () => {
  const crossFade = useDeckoStore(selectCrossFade)

  return (
    <div>
      {deckIds.map(deckId => (
        <DeckComponent key={deckId} deckId={deckId as EDeckIds} />
      ))}
      <div>
        <label htmlFor="crossfader">Crossfader:</label>
        <input
          type="range"
          id="crossfader"
          className="crossfader"
          min="0"
          max="1"
          step="0.01"
          value={crossFade}
          onChange={e => getDecko().setCrossFade(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}

export default ZustandApp
