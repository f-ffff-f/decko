export const DECK_IDS = {
  ID_1: 1 as const,
  ID_2: 2 as const,
} as const

export type TDeckId = (typeof DECK_IDS)[keyof typeof DECK_IDS]
