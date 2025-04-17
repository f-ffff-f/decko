import React, { useEffect, useState } from 'react'
import { EDeckIds } from '@/constants'
import { formatTime } from '@/util' // 경로 확인
import {
  selectDeckSpeed,
  selectDeckVolume,
  useDeckoStore,
  selectDeckAudioBufferDuration,
} from '@/zustandVersion/useDeckoStore'
import { getDecko } from '@/zustandVersion/getDecko'

interface DeckComponentProps {
  deckId: EDeckIds
}

const DeckComponent: React.FC<DeckComponentProps> = ({ deckId }) => {
  const [currentTime, setCurrentTime] = useState(0)

  const volume = useDeckoStore(selectDeckVolume(deckId))
  const speed = useDeckoStore(selectDeckSpeed(deckId))
  const duration = useDeckoStore(selectDeckAudioBufferDuration(deckId))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getDecko().getPlaybackTime(deckId))
    }, 100)

    return () => clearInterval(interval)
  }, [deckId])

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
                    getDecko().loadTrack(deckId, file)
                  }
                }}
              />
            </div>
            <div className="controls">
              <button
                id="playPause1"
                onClick={() => getDecko().playPauseDeck(deckId)}
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
                  value={volume}
                  onChange={e =>
                    getDecko().setVolume(deckId, parseFloat(e.target.value))
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
                  value={speed}
                  onChange={e =>
                    getDecko().setSpeed(deckId, parseFloat(e.target.value))
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
                  value={currentTime}
                  onChange={e =>
                    getDecko().seekDeck(deckId, parseFloat(e.target.value))
                  }
                />
                <span id="time1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DeckComponent
