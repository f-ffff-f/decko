import { EDeckIds } from '@/constants'
import DeckComponent from '@/observerVersion/DeckComponent'
import { useCrossfade } from '@/observerVersion/useCrossfade'
import { useDeckoContext } from '@/observerVersion/useDeckoContext'

const deckIds = Object.values(EDeckIds).filter(key => !isNaN(Number(key)))

const ObserverApp = () => {
  const decko = useDeckoContext()
  const { crossFade } = useCrossfade()

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
          onChange={e => decko.setCrossFade(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}

export default ObserverApp
