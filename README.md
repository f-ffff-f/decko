# Decko

Decko is a deck management library for DJ applications using the Web Audio API and `valtio` for state management. This library provides basic features needed for DJ applications such as loading audio tracks, play/pause functionality, volume control, speed adjustment, and crossfader capabilities, all managed through a reactive state object.

## Installation

You can install it using your preferred package manager:

```bash
npm install @ghr95223/decko
# or
yarn add @ghr95223/decko
# or
pnpm add @ghr95223/decko
# or
bun add @ghr95223/decko
```

## Key Features

- Management of two independent audio decks via a reactive state object.
- Loading and play/pause control of audio tracks.
- Volume and playback speed adjustment.
- Transition between two decks via crossfader.
- Track position seeking.
- Reactive state management using `valtio`.

## Decko State Management: `deckoManager` and `useDeckoSnapshot`

This document briefly explains how to change Decko's state using `deckoManager` and how to subscribe to those state changes in React components using the `useDeckoSnapshot` hook.

## Core Concepts

1.  **`deckoState` (Valtio Proxy):** A central store containing all application state. It's created as a Valtio `proxy` object, allowing state changes to be tracked. (`src/state.ts`)
2.  **`deckoManager` (Singleton Class):** Encapsulates the Web Audio API logic and is responsible for directly **modifying** `deckoState`. For example, it performs tasks like playing/pausing tracks, adjusting volume, and updates the relevant state in `deckoState`. (`src/DeckoManager.ts`)
3.  **`useDeckoSnapshot` (React Hook):** Used within React components to **subscribe** to changes in specific parts of `deckoState` and retrieve their values. It's based on Valtio's `useSnapshot` and provides path-based access and type safety, supporting optimized re-renders. (`src/useDeckoSnapshot.ts`)

## Modifying State (Using `deckoManager`)

To change the application state, call methods on the `deckoManager` instance. `deckoManager` is provided as a singleton instance, so you can reference and use the same instance from anywhere.

```typescript
import { deckoManager, DECK_IDS } from './path/to/your/decko/library' // Adjust the actual path

// Example: Toggle play/pause for Deck 1
deckoManager.playPauseDeck(DECK_IDS.ID_1)

// Example: Set volume for Deck 2
deckoManager.setVolume(DECK_IDS.ID_2, 0.75)

// Example: Set the crossfader value
deckoManager.setCrossFade(0.3)

// Example: Load a track onto Deck 1 (Requires a Blob object)
async function loadAndPlay(trackBlob: Blob) {
  await deckoManager.loadTrack(DECK_IDS.ID_1, trackBlob)
  // Optionally play immediately after loading
  // deckoManager.playPauseDeck(DECK_IDS.ID_1);
}

// Example: Change the playback position of Deck 1 (in seconds)
deckoManager.seekDeck(DECK_IDS.ID_1, 30) // Seek to the 30-second mark
```

When you call a method on `deckoManager`, its internal logic runs, and the related state (e.g., `isPlaying`, `volume`, `crossFade`, `uiPlaybackTime`, etc.) is updated directly within the `deckoState` proxy object.

## Subscribing to State Changes (Using `useDeckoSnapshot`)

To detect changes in `deckoState` within a React component and update the UI, use the `useDeckoSnapshot` hook. This hook takes an array representing the path to the specific value within the state object.

```typescript
import React from 'react'
import { useDeckoSnapshot } from './path/to/your/decko/library' // Adjust the actual path
import { DECK_IDS } from './path/to/your/decko/library' // Adjust the actual path

function DeckStatus({
  deckId,
}: {
  deckId: typeof DECK_IDS.ID_1 | typeof DECK_IDS.ID_2
}) {
  // Subscribe to the isPlaying state for the corresponding deckId
  const isPlaying = useDeckoSnapshot(['decks', deckId, 'isPlaying'])
  // Subscribe to the current playback time (for UI) for the corresponding deckId
  const playbackTime = useDeckoSnapshot(['decks', deckId, 'uiPlaybackTime'])
  // Subscribe to the total duration for the corresponding deckId
  const duration = useDeckoSnapshot(['decks', deckId, 'duration'])
  // Subscribe to the volume for the corresponding deckId
  const volume = useDeckoSnapshot(['decks', deckId, 'volume'])

  // Format function (example)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  return (
    <div>
      <h3>Deck {deckId} Status</h3>
      <p>Status: {isPlaying ? 'Playing' : 'Paused/Stopped'}</p>
      <p>
        Time: {formatTime(playbackTime)} / {formatTime(duration)}
      </p>
      <p>Volume: {Math.round(volume * 100)}%</p>
      {/* Add buttons here for play/pause, seek, volume control, etc., calling deckoManager */}
    </div>
  )
}

function CrossfaderControl() {
  // Subscribe to the global crossFade state
  const crossFadeValue = useDeckoSnapshot(['crossFade'])

  return (
    <div>
      <h4>Crossfader</h4>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={crossFadeValue}
        onChange={e => deckoManager.setCrossFade(parseFloat(e.target.value))} // Change state via deckoManager
      />
      <p>Value: {crossFadeValue.toFixed(2)}</p>
    </div>
  )
}

export default function DjConsole() {
  return (
    <div>
      <DeckStatus deckId={DECK_IDS.ID_1} />
      <DeckStatus deckId={DECK_IDS.ID_2} />
      <CrossfaderControl />
    </div>
  )
}
```

**Key Features:**

- **Path-Based Subscription:** By specifying a path like `useDeckoSnapshot(['decks', DECK_IDS.ID_1, 'isPlaying'])`, the component will only re-render when the value of `deckoState.decks[1].isPlaying` changes. Unnecessary re-renders are avoided even if other parts of the state change.
- **Type Safety:** In a TypeScript environment, incorrect paths can be caught at compile time, and the type of the returned value is accurately inferred.

## Summary

- To **change** state, call methods on `deckoManager`.
- To **subscribe** to state changes and reflect them in the UI within React components, use the `useDeckoSnapshot` hook.
- `deckoState` serves as the central state store connecting these two.
