import { ChangeEvent, useRef } from 'react'
import { deckoManager, TDeckId, useDeckoSnapshot } from '../../../src'

interface DeckProps {
  deckId: TDeckId
}

const Deck = ({ deckId }: DeckProps) => {
  const deckState = useDeckoSnapshot(['decks', deckId])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!deckState) return null

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      try {
        await deckoManager.loadTrack(deckId, file)
      } catch (error) {
        console.error('Error loading track:', error)
      }
    }
  }

  const handlePlayPause = () => {
    deckoManager.playPauseDeck(deckId)
  }

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.seekDeck(deckId, value)
  }

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.setVolume(deckId, value)
  }

  const handleSpeedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.setSpeed(deckId, value)
  }

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="deck">
      <h2>Deck {deckId}</h2>

      <div className="deck-controls">
        <div className="file-control">
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            onChange={handleFileUpload}
          />
        </div>

        <div className="playback-control">
          <button onClick={handlePlayPause}>
            {deckState.isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="time-display">
            {formatTime(deckState.uiPlaybackTime)} /{' '}
            {formatTime(deckState.duration)}
          </div>
        </div>

        <div className="seek-control">
          <input
            type="range"
            min="0"
            max={deckState.duration || 1}
            step="0.01"
            value={deckState.uiPlaybackTime}
            onChange={handleSeek}
            disabled={!deckState.audioBufferLoaded}
          />
        </div>

        <div className="volume-control">
          <label>
            Volume: {deckState.volume.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deckState.volume}
              onChange={handleVolumeChange}
            />
          </label>
        </div>

        <div className="speed-control">
          <label>
            Speed: {deckState.speed.toFixed(2)}x
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.01"
              value={deckState.speed}
              onChange={handleSpeedChange}
            />
          </label>
        </div>

        <div className="status">
          {deckState.isTrackLoading ? 'Loading...' : ''}
          {!deckState.audioBufferLoaded && !deckState.isTrackLoading
            ? 'No track loaded'
            : ''}
        </div>
      </div>
    </div>
  )
}

export default Deck
