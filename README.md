# Maria's Game

A match-3 game for Maria, told as a Tree of Life: seven branches, eighty leaves, then open sky. Each branch has its own pieces, palette, board shapes, music and cheers. Four dogs join along the way as helpers, and bonus rounds open as surprises.

The whole game ships as one self-contained HTML file. It has no server, no network calls and no dependencies at runtime, and it runs offline. Progress is saved in the browser's `localStorage`.

## Play

Open `dist/index.html` in a browser, or host it on any static host (GitHub Pages, Netlify, S3). On a phone, "Add to Home Screen" runs it full screen.

## Build

```sh
python3 scripts/build.py            # writes dist/index.html
```

The build inlines the fonts, art and scripts from `src/` into `src/shell.html`. It needs Python 3 and nothing else.

## Test

```sh
node tests/story.js 8 [from] [to]   # bot plays each story leaf 8 times, prints win rates
node tests/bonus.js 8               # same for every bonus round
python3 tests/smoke.py              # loads dist/index.html in headless Chromium (needs Playwright)
```

The bots run the engine headless and deterministically, without animation. Use them after any change to levels or rules. Aim for every leaf to win at least about 75% of the time.

## Layout

| Path | What it holds |
| --- | --- |
| `src/engine.js` | Board rules: matching, specials, gravity, coverings, rocks, fish, dog powers. No DOM. |
| `src/levels.js` | Branches, palettes, per-leaf beats, level generator, cheers. |
| `src/festivals.js` | Bonus rounds and where they sit on the tree (inlined into `levels.js`). |
| `src/pieces.js` | Piece sets per branch and bonus round; draws pieces (inlined into `ui.js`). |
| `src/art.js`, `src/artlib.js` | Illustrated SVG pieces for the seven branches, rasterised at load. |
| `src/ui.js` | Rendering, animation, sound, screens, saving. |
| `src/shell.html` | Page skeleton and CSS with build placeholders. |
| `assets/fonts/` | Rozha One and Mulish (latin subsets) with their licenses. |
| `scripts/build.py` | Single-file build. |
| `tests/` | Headless bots and a browser smoke test. |

## Fonts

Rozha One (Indian Type Foundry) and Mulish (The Mulish Project Authors) are used under the SIL Open Font License 1.1. See `assets/fonts/`.
