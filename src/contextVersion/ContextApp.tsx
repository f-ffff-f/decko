import { startTransition, useEffect, useReducer } from 'react'
import { EDeckIds } from '@/constants'
import { useDeckoContext } from '@/contextVersion/useDeckoContext'
import { formatTime } from '@/util'

// Define types for our state and actions
type DJState = {
  decks: {
    [key in EDeckIds]: {
      volume: number
      speed: number
      playbackTime: number
      audioDuration: number
      isPlaying: boolean
    }
  }
  crossFade: number
}

type DJAction =
  | {
      type: 'UPDATE_DECK'
      deckId: EDeckIds
      payload: Partial<DJState['decks'][EDeckIds]>
    }
  | { type: 'UPDATE_CROSSFADE'; value: number }

const djReducer = (state: DJState, action: DJAction): DJState => {
  switch (action.type) {
    case 'UPDATE_DECK':
      return {
        ...state,
        decks: {
          ...state.decks,
          [action.deckId]: {
            ...state.decks[action.deckId],
            ...action.payload,
          },
        },
      }
    case 'UPDATE_CROSSFADE':
      return {
        ...state,
        crossFade: action.value,
      }
    default:
      return state
  }
}

/**
 * Main application component
 */
const ContextApp = () => {
  const decko = useDeckoContext()

  const initialState: DJState = {
    decks: Object.fromEntries(
      [EDeckIds.DECK_1, EDeckIds.DECK_2].map(deckId => [
        deckId,
        {
          volume: decko.getDeck(deckId)?.gainNode?.gain.value ?? 0,
          speed: decko.getDeck(deckId)?.speed ?? 1,
          playbackTime: decko.getPlaybackTime(deckId) ?? 0,
          audioDuration: decko.getAudioBufferDuration(deckId) ?? 0,
          isPlaying: decko.getDeck(deckId)?.isPlaying ?? false,
        },
      ])
    ) as DJState['decks'],
    crossFade: decko.getCrossFade(),
  }

  const [state, dispatch] = useReducer(djReducer, initialState)

  // Throttle UI updates to roughly 30fps
  useEffect(() => {
    let rafId: number
    let lastUpdate = performance.now()
    const throttleInterval = 33 // roughly 30fps

    const updateDecks = () => {
      const now = performance.now()
      if (now - lastUpdate >= throttleInterval) {
        lastUpdate = now

        startTransition(() => {
          ;[EDeckIds.DECK_1, EDeckIds.DECK_2].forEach(deckId => {
            dispatch({
              type: 'UPDATE_DECK',
              deckId,
              payload: {
                volume: decko.getVolume(deckId),
                speed: decko.getSpeed(deckId),
                playbackTime: decko.getPlaybackTime(deckId),
                audioDuration: decko.getAudioBufferDuration(deckId),
                isPlaying: decko.isPlaying(deckId),
              },
            })
          })

          dispatch({
            type: 'UPDATE_CROSSFADE',
            value: decko.getCrossFade(),
          })
        })
      }
      rafId = requestAnimationFrame(updateDecks)
    }

    updateDecks()
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="app-container">
      <main>
        <div className="deck-container">
          <div className="deck" id="deck1">
            <h2>Deck 1</h2>
            <div className="file-input">
              <input
                type="file"
                id="file1"
                accept="audio/*"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    decko.loadTrack(EDeckIds.DECK_1, file)
                  }
                }}
              />
            </div>
            <div className="controls">
              <button
                id="playPause1"
                onClick={() => decko.playPauseDeck(EDeckIds.DECK_1)}
              >
                Play/Pause
              </button>
              <div>
                <label htmlFor="volume1">Volume:</label>
                <input
                  type="range"
                  id="volume1"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.decks[EDeckIds.DECK_1].volume}
                  onChange={e =>
                    decko.setVolume(EDeckIds.DECK_1, parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <label htmlFor="speed1">Speed:</label>
                <input
                  type="range"
                  id="speed1"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={state.decks[EDeckIds.DECK_1].speed}
                  onChange={e =>
                    decko.setSpeed(EDeckIds.DECK_1, parseFloat(e.target.value))
                  }
                />
                <span id="speedValue1">1.00</span>
              </div>
              <div>
                <label htmlFor="seek1">Seek:</label>
                <input
                  type="range"
                  id="seek1"
                  min="0"
                  max="100"
                  value={state.decks[EDeckIds.DECK_1].playbackTime}
                  onChange={e =>
                    decko.seekDeck(EDeckIds.DECK_1, parseFloat(e.target.value))
                  }
                />
                <span id="time1">
                  {formatTime(state.decks[EDeckIds.DECK_1].playbackTime)} /
                  {formatTime(state.decks[EDeckIds.DECK_1].audioDuration)}
                </span>
              </div>
            </div>
          </div>

          <div className="deck" id="deck2">
            <h2>Deck 2</h2>
            <div className="file-input">
              <input
                type="file"
                id="file2"
                accept="audio/*"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    decko.loadTrack(EDeckIds.DECK_2, file)
                  }
                }}
              />
            </div>
            <div className="controls">
              <button
                id="playPause2"
                onClick={() => decko.playPauseDeck(EDeckIds.DECK_2)}
              >
                Play/Pause
              </button>
              <div>
                <label htmlFor="volume2">Volume:</label>
                <input
                  type="range"
                  id="volume2"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.decks[EDeckIds.DECK_2].volume}
                  onChange={e =>
                    decko.setVolume(EDeckIds.DECK_2, parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <label htmlFor="speed2">Speed:</label>
                <input
                  type="range"
                  id="speed2"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={state.decks[EDeckIds.DECK_2].speed}
                  onChange={e =>
                    decko.setSpeed(EDeckIds.DECK_2, parseFloat(e.target.value))
                  }
                />
                <span id="speedValue2">1.00</span>
              </div>
              <div>
                <label htmlFor="seek2">Seek:</label>
                <input
                  type="range"
                  id="seek2"
                  min="0"
                  max="100"
                  value={state.decks[EDeckIds.DECK_2].playbackTime}
                  onChange={e =>
                    decko.seekDeck(EDeckIds.DECK_2, parseFloat(e.target.value))
                  }
                />
                <span id="time2">
                  {formatTime(state.decks[EDeckIds.DECK_2].playbackTime)} /
                  {formatTime(state.decks[EDeckIds.DECK_2].audioDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="crossfader">Crossfader:</label>
          <input
            type="range"
            id="crossfader"
            className="crossfader"
            min="0"
            max="1"
            step="0.01"
            value={state.crossFade}
            onChange={e => decko.setCrossFade(parseFloat(e.target.value))}
          />
        </div>
      </main>
    </div>
  )
}

export default ContextApp
