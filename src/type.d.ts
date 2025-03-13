declare module '@ghr95223/decko' {
  /**
   * Available deck identifiers
   */
  export enum EDeckIds {
    DECK_1 = 1,
    DECK_2 = 2,
  }

  /**
   * Interface representing a single deck in the audio system
   */
  export interface IDeck {
    /** Unique deck identifier */
    id: EDeckIds
    /** Currently loaded audio buffer */
    audioBuffer: AudioBuffer | null
    /** Current audio buffer source node */
    bufferSourceNode: AudioBufferSourceNode | null
    /** Gain node controlling deck volume */
    gainNode: GainNode
    /** Gain node for crossfade control */
    crossFadeNode: GainNode
    /** Playback speed multiplier */
    speed: number
    /** Previous recorded start time */
    prevStartTime: number
    /** Next start time for playback */
    nextStartTime: number
    /** Whether the deck is currently playing */
    isPlaying: boolean
    /** Whether the deck is currently in seeking mode */
    isSeeking: boolean
  }

  /**
   * Decko - Web Audio API based deck manager for DJ applications
   */
  export class Decko {
    /**
     * Initializes the deck system
     */
    init(): void

    /**
     * Gets the master gain node from the audio context
     */
    getMasterGainNode(): GainNode

    /**
     * Adds a new deck to the system
     * @param masterGainNode - Master gain node to connect the deck to
     */
    addDeck(masterGainNode: GainNode): IDeck

    /**
     * Loads an audio track into the specified deck
     * @param deckId - ID of the target deck
     * @param blob - Audio data blob to load
     */
    loadTrack(deckId: EDeckIds, blob: Blob): Promise<void>

    /**
     * Toggles play/pause state for the specified deck
     * @param deckId - ID of the target deck
     */
    playPauseDeck(deckId: EDeckIds): Promise<void>

    /**
     * Seeks to a specific time position in the specified deck
     * @param deckId - ID of the target deck
     * @param seekTime - Time position to seek to (in seconds)
     */
    seekDeck(deckId: EDeckIds, seekTime: number): void

    /**
     * Sets the volume for the specified deck
     * @param deckId - ID of the target deck
     * @param volume - Volume level (0.0 to 1.0)
     */
    setVolume(deckId: EDeckIds, volume: number): void

    /**
     * Sets the playback speed for the specified deck
     * @param deckId - ID of the target deck
     * @param speed - Playback speed multiplier
     */
    setSpeed(deckId: EDeckIds, speed: number): void

    /**
     * Sets the crossfade value between decks
     * @param value - Crossfade value (0.0 to 1.0)
     */
    setCrossFade(value: number): void

    /**
     * Gets a deck by its ID
     * @param deckId - ID of the target deck
     */
    getDeck(deckId: EDeckIds): IDeck | undefined

    /**
     * Gets the audio buffer for the specified deck
     * @param deckId - ID of the target deck
     */
    getAudioBuffer(deckId: EDeckIds): AudioBuffer | null

    /**
     * Gets the current playback time for the specified deck
     * @param deckId - ID of the target deck
     */
    getPlaybackTime(deckId: EDeckIds): number

    /**
     * Gets the total duration of the audio loaded in the specified deck
     * @param deckId - ID of the target deck
     */
    getAudioBufferDuration(deckId: EDeckIds): number

    /**
     * Gets the current volume for the specified deck
     * @param deckId - ID of the target deck
     */
    getVolume(deckId: EDeckIds): number

    /**
     * Gets the current playback speed for the specified deck
     * @param deckId - ID of the target deck
     */
    getSpeed(deckId: EDeckIds): number

    /**
     * Gets the current crossfade value
     */
    getCrossFade(): number

    /**
     * Checks if the specified deck is currently playing
     * @param deckId - ID of the target deck
     */
    isPlaying(deckId: EDeckIds): boolean

    /**
     * Checks if the specified deck is currently seeking
     * @param deckId - ID of the target deck
     */
    isSeeking(deckId: EDeckIds): boolean

    /**
     * Provides debug information about the deck manager
     */
    debugManager(): string
  }

  /**
   * Singleton instance of the Decko class
   */
  export const deckoSingleton: Decko
}
