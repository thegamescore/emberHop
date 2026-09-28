# Ember Hop

A standalone Christmas flight game for the gamesCore_ library. Guide a tiny red robin in a Santa hat through snowy pine-green ruins. One tap gives an upward boost; gravity does the rest.

## Run

Requires Node.js 20.19+ (or 22.12+) and npm.

```sh
npm ci
npm run dev
```

Open **http://localhost:4193**. For a production build:

```sh
npm run build
npm run preview
```

Deploy the complete `dist/` directory to any static web host. Asset paths are relative, so subdirectory hosting works. The game needs no API, account, SDK, external fonts, or runtime network services. Embedded hosts can allow fullscreen with the iframe `allowfullscreen` attribute.

## Play

- **Tap / click the playfield / Space:** start or hop. Holding Space does not repeat boosts.
- **Try Again / Space after failure:** restart immediately.
- **P / Escape / pause button:** pause or resume.
- **M / speaker button:** mute or unmute all sounds and music.
- **F / fullscreen button:** enter or exit fullscreen where supported.

Each obstacle pair passed earns one point. Touching an obstacle or the ground ends the attempt; the ceiling gently limits upward movement. Difficulty gradually increases with score and active play time, then caps. There are **no levels, gift stops, or automatic intermissions**. Switching away pauses the game and audio until you explicitly resume.

An optional present appears after the opening obstacles, then every 3–5 pairs. Presents sit away from the ordinary flight path in the open space between obstacles, requiring a deliberate hop or dive and recovery. Collecting one briefly reveals a product name; your finds appear on the game-over screen. Missing one does not end the attempt or reduce your score. These are game collectibles, not redeemable prizes.

Edit the 20 names in `src/products.ts` to change the product pool, including LEGO set, Nintendo Switch, headphones, and an instant camera. Presents do not change the one-point-per-pair score.

## Design and assets

The winter postcard design uses crisp pixel artwork, evergreen framing, warm paper panels, red ornaments, snowy fir trees, and gingerbread ground. The requested palette is used throughout:

| Element | Color |
| --- | --- |
| Sky | `#8ED8E8` |
| Character | `#E94B4B` |
| Gold details | `#FFD166` |
| Obstacles | `#287A52` |
| Snow | `#FFF9F0` |
| Ground | `#A96A46` |

Original sprites and scenery are defined locally in `src/art.ts`. `public/fonts/ember-pixel.otf` is an original pixel display font; regenerate it with `node scripts/make-font.mjs`. No copied Flappy Bird graphics or third-party audio recordings are used.

`src/audio.ts` synthesizes gameplay effects and a bell arrangement of the public-domain “Jingle Bells” melody. Audio starts only after interaction. Reduced-motion preferences suppress snow, trails, particles, and idle movement. The simulation uses a fixed 120 Hz timestep with bounded catch-up, independent of the display refresh rate.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
```

Browser tests use installed Google Chrome through Playwright and launch a separate production preview at port 4297. If Chrome is unavailable, install it with `npx playwright install chrome` or change the Playwright channel configuration to a locally installed browser. Screenshots are written to `test-results/`.

Tests cover scoring, collisions, resets, continuous play, increasing difficulty, presents, long runs, and equivalent physics at 30/60/120/144 Hz. Browser checks cover touch, mouse, keyboard, held keys, mute, audio suspend/resume, fullscreen, and layouts at 360×640, 390×844, 844×390, 1024×768, and 1440×900.

Device checks are browser emulation, not physical phone/tablet or Safari testing. Automated audio checks verify the audio lifecycle; they do not replace listening on real speakers.

## Source map

- `src/game.ts`: simulation, collisions, difficulty, scoring, presents.
- `src/art.ts`, `src/style.css`, `index.html`: pixel artwork and responsive interface.
- `src/main.ts`: input, lifecycle, menus, fullscreen.
- `src/audio.ts`, `src/products.ts`: local music/effects and product pool.
- `tests/`: simulation and browser acceptance checks.

The `?test` query enables a read-only state snapshot used by browser tests; it cannot change game state.
