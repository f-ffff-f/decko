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
import { deckoManager, DECK_IDS } from '@ghr95223/decko'

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

To detect changes in `deckoState` within a React component and update the UI, use the `useDeckoSnapshot` hook. This hook returns the entire state object and automatically triggers re-renders when any part of the state changes that your component uses.

```typescript
import React from 'react'
import { useDeckoSnapshot } from '@ghr95223/decko'
import { DECK_IDS } from '@ghr95223/decko'

function DeckStatus({
  deckId,
}: {
  deckId: typeof DECK_IDS.ID_1 | typeof DECK_IDS.ID_2
}) {
  // Get the entire state snapshot
  const snapshot = useDeckoSnapshot()

  // Access specific properties from the snapshot
  const isPlaying = snapshot.decks[deckId].isPlaying
  const playbackTime = snapshot.decks[deckId].uiPlaybackTime
  const duration = snapshot.decks[deckId].duration
  const volume = snapshot.decks[deckId].volume

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
  // Get the entire state snapshot
  const snapshot = useDeckoSnapshot()

  // Access the crossFade value
  const crossFadeValue = snapshot.crossFade

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
```

## Summary

- To **change** state, call methods on `deckoManager`.
- To **subscribe** to state changes and reflect them in the UI within React components, use the `useDeckoSnapshot` hook.
- `deckoState` serves as the central state store connecting these two.
