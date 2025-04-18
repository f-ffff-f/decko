import React from 'react'
import { EDeckIds } from '@/constants'
import { useDeckoState } from '@/observerVersion/useDeckState' // 경로 확인
import { useDeckoContext } from '@/observerVersion/useDeckoContext'
import { formatTime } from '@/util' // 경로 확인

interface DeckComponentProps {
  deckId: EDeckIds
}

const DeckComponent: React.FC<DeckComponentProps> = ({ deckId }) => {
  const decko = useDeckoContext() // 컨트롤 함수 사용 위함
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    speed,
    isTrackLoading,
    isSeeking, // 필요하다면 isSeeking 상태도 useDeckoState에 추가
  } = useDeckoState(deckId) // 커스텀 훅 사용

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
                    decko.loadTrack(deckId, file)
                  }
                }}
              />
            </div>
            <div className="controls">
              <button
                id="playPause1"
                onClick={() => decko.playPauseDeck(deckId)}
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
                    decko.setVolume(deckId, parseFloat(e.target.value))
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
                    decko.setSpeed(deckId, parseFloat(e.target.value))
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
                    decko.seekDeck(deckId, parseFloat(e.target.value))
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
