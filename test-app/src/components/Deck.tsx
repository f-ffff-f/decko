import { ChangeEvent, useRef, memo } from 'react'
import { deckoManager, TDeckId, useDeckoSnapshot } from '../../../src'

interface DeckProps {
  deckId: TDeckId
}

const formatTime = (seconds: number) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const FileControl = memo(({ deckId }: DeckProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="file-control">
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileUpload}
      />
    </div>
  )
})

const PlaybackControl = memo(({ deckId }: DeckProps) => {
  const snapshot = useDeckoSnapshot()

  const handlePlayPause = () => {
    deckoManager.playPauseDeck(deckId)
  }

  return (
    <div className="playback-control">
      <button onClick={handlePlayPause}>
        {snapshot.decks[deckId].isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="time-display">
        {formatTime(snapshot.decks[deckId].uiPlaybackTime)} /{' '}
        {formatTime(snapshot.decks[deckId].duration)}
      </div>
    </div>
  )
})

const SeekControl = memo(({ deckId }: DeckProps) => {
  const snapshot = useDeckoSnapshot()

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.seekDeck(deckId, value)
  }

  return (
    <div className="seek-control">
      <input
        type="range"
        min="0"
        max={snapshot.decks[deckId].duration || 1}
        step="0.01"
        value={snapshot.decks[deckId].uiPlaybackTime}
        onChange={handleSeek}
        disabled={!snapshot.decks[deckId].audioBufferLoaded}
      />
    </div>
  )
})

const VolumeControl = memo(({ deckId }: DeckProps) => {
  const snapshot = useDeckoSnapshot()

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.setVolume(deckId, value)
  }

  return (
    <div className="volume-control">
      <label>
        Volume: {snapshot.decks[deckId].volume.toFixed(2)}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={snapshot.decks[deckId].volume}
          onChange={handleVolumeChange}
        />
      </label>
    </div>
  )
})

const SpeedControl = memo(({ deckId }: DeckProps) => {
  const snapshot = useDeckoSnapshot()

  const handleSpeedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    deckoManager.setSpeed(deckId, value)
  }

  return (
    <div className="speed-control">
      <label>
        Speed: {snapshot.decks[deckId].speed.toFixed(2)}x
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.01"
          value={snapshot.decks[deckId].speed}
          onChange={handleSpeedChange}
        />
      </label>
    </div>
  )
})

const StatusDisplay = memo(({ deckId }: DeckProps) => {
  const snapshot = useDeckoSnapshot()

  return (
    <div className="status">
      {snapshot.decks[deckId].isTrackLoading ? 'Loading...' : ''}
      {!snapshot.decks[deckId].audioBufferLoaded &&
      !snapshot.decks[deckId].isTrackLoading
        ? 'No track loaded'
        : ''}
    </div>
  )
})

const Deck = ({ deckId }: DeckProps) => {
  return (
    <div className="deck">
      <h2>Deck {deckId}</h2>

      <div className="deck-controls">
        <FileControl deckId={deckId} />
        <PlaybackControl deckId={deckId} />
        <SeekControl deckId={deckId} />
        <VolumeControl deckId={deckId} />
        <SpeedControl deckId={deckId} />
        <StatusDisplay deckId={deckId} />
      </div>
    </div>
  )
}

export default memo(Deck)
