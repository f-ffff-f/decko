import { Decko } from '@/zustandVersion/Decko'

let deckoInstance: Decko | null = null

/**
 * Returns a singleton Decko instance.
 * Only initializes on the client where AudioContext exists.
 */
export function getDecko(): Decko {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    // throw new Error('Decko can only be initialized in a browser environment')
  }
  if (!deckoInstance) {
    deckoInstance = new Decko()
  }
  return deckoInstance
}
