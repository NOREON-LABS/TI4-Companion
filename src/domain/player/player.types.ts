/** The eight TI4 plastic colours a player can claim at the table. */
export const PLAYER_COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'black',
  'orange',
  'pink',
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];
