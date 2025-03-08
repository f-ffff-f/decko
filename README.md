# Decko

Decko is a deck management library for DJ applications based on the Web Audio API. This library provides basic features needed for DJ applications such as loading audio tracks, play/pause functionality, volume control, speed adjustment, and crossfader capabilities.

## Installation

You can install it using npm:

```bash
npm install @ghr95223/decko
```

## Key Features

- Management of two independent audio decks
- Loading and play/pause control of audio tracks
- Volume and playback speed adjustment
- Transition between two decks via crossfader
- Track position seeking
- Easy usage through singleton pattern

## Usage

### Example Code

Refer to the `example/basic.html` file for a complete example. This example demonstrates a simple DJ interface that implements loading audio files, play/pause functionality, volume control, speed adjustment, and crossfader features using two decks.

### Running the Example

To run the example:

1. Clone the repository:

   ```bash
   git clone https://github.com/f-ffff-f/decko.git
   cd decko
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Open the example in your browser:

   ```bash
   # Using a local server (e.g., with the 'serve' package)
   npx serve
   # Then navigate to http://localhost:3000/example/basic.html

   # Or using Python's built-in HTTP server
   python -m http.server
   # Then navigate to http://localhost:8000/example/basic.html

   # Or using PHP's built-in server
   php -S localhost:8000
   # Then navigate to http://localhost:8000/example/basic.html

   # Or using Node.js http-server
   npx http-server
   # Then navigate to http://localhost:8080/example/basic.html
   ```

### Basic Usage

```typescript
import { deckoSingleton, EDeckIds } from '@ghr95223/decko'

// Load a track
const loadTrack = async (file: File) => {
  await deckoSingleton.loadTrack(EDeckIds.DECK_1, file)
}

// Toggle play/pause
const togglePlayPause = () => {
  deckoSingleton.playPauseDeck(EDeckIds.DECK_1)
}

// Set volume
const setVolume = (volume: number) => {
  deckoSingleton.setVolume(EDeckIds.DECK_1, volume) // Value between 0 and 1
}

// Set playback speed
const setSpeed = (speed: number) => {
  deckoSingleton.setSpeed(EDeckIds.DECK_1, speed) // e.g., 0.5 to 2.0
}

// Set crossfader
const setCrossFade = (value: number) => {
  deckoSingleton.setCrossFade(value) // Value between 0 and 1 (0: deck1, 1: deck2)
}

// Seek to position in track
const seekTrack = (time: number) => {
  deckoSingleton.seekDeck(EDeckIds.DECK_1, time) // In seconds
}

// Get current playback time
const getCurrentTime = () => {
  return deckoSingleton.getPlaybackTime(EDeckIds.DECK_1)
}

// Get track duration
const getDuration = () => {
  return deckoSingleton.getAudioBufferDuration(EDeckIds.DECK_1)
}

// Check if playing
const isPlaying = () => {
  return deckoSingleton.isPlaying(EDeckIds.DECK_1)
}
```

### Example Code

Refer to the `example/basic.html` file for a complete example. This example demonstrates a simple DJ interface that implements loading audio files, play/pause functionality, volume control, speed adjustment, and crossfader features using two decks.

## API Reference

### Classes and Enums

#### `EDeckIds`

An enum representing deck IDs.

- `DECK_1 = 1`: First deck
- `DECK_2 = 2`: Second deck

#### `Decko`

A class for managing audio decks.

#### `deckoSingleton`

A singleton instance of the Decko class that can be used throughout the application.

### Main Methods

#### `loadTrack(deckId: EDeckIds, blob: Blob): Promise<void>`

Loads an audio track to the specified deck.

#### `playPauseDeck(deckId: EDeckIds): Promise<void>`

Toggles the playback state of the specified deck.

#### `seekDeck(deckId: EDeckIds, seekTime: number): void`

Changes the playback position of the specified deck.

#### `setVolume(deckId: EDeckIds, volume: number): void`

Sets the volume of the specified deck (value between 0 and 1).

#### `setSpeed(deckId: EDeckIds, speed: number): void`

Sets the playback speed of the specified deck.

#### `setCrossFade(value: number): void`

Sets the crossfade value between the two decks (value between 0 and 1).

#### `getAudioBuffer(deckId: EDeckIds): AudioBuffer | null`

Returns the audio buffer of the specified deck.

#### `getPlaybackTime(deckId: EDeckIds): number`

Returns the current playback time of the specified deck.

#### `getAudioBufferDuration(deckId: EDeckIds): number`

Returns the duration of the audio buffer of the specified deck.

#### `getVolume(deckId: EDeckIds): number`

Returns the current volume of the specified deck.

#### `getSpeed(deckId: EDeckIds): number`

Returns the current playback speed of the specified deck.

#### `getCrossFade(): number`

Returns the current crossfade value.

#### `isPlaying(deckId: EDeckIds): boolean`

Returns the playback state of the specified deck.

#### `isSeeking(deckId: EDeckIds): boolean`

Returns the seeking state of the specified deck.

## License

MIT

## Author

yu ganghyeon
