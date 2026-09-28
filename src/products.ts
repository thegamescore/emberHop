// Local collectible names only: these are in-game finds, not redeemable prizes.
export const PRODUCTS = [
  'LEGO set', 'Nintendo Switch', 'Wireless headphones', 'Instant camera',
  'Bluetooth speaker', 'Kindle reader', 'Board game', 'Jigsaw puzzle',
  'Plush teddy bear', 'Remote-control car', 'Art supplies set', 'Football',
  'Skateboard', 'Winter scarf', 'Cozy mittens', 'Thermal flask',
  'Hot chocolate set', 'Gingerbread baking kit', 'Watercolor paint set', 'Star projector',
] as const;
export type Product = typeof PRODUCTS[number];
