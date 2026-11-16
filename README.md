# Maria's Game

A match-3 game for Maria, told as a Tree of Life: seven branches, eighty leaves, then open sky. Each branch has its own pieces, palette, board shapes, music and cheers. Four dogs join along the way as helpers, and bonus rounds open as surprises.

The game itself is one self-contained HTML file. It makes no network calls, has no runtime dependencies and runs offline. Progress is saved in the browser's `localStorage`.

## Run

Needs Node 22 or later. There are no dependencies to install.

```sh
npm run build      # writes dist/index.html, the whole game in one file
npm start          # serves it on $PORT (default 3000)
```

`dist/index.html` also works opened straight from disk, offline. On a phone, "Add to Home Screen" runs it full screen.

The server (`server.mjs`) serves only the game page and `/healthz`. It compresses with brotli or gzip and revalidates with an ETag, so each deploy shows up on the next load. It sends a Content Security Policy that allows the page's own inline scripts by hash and nothing else.

## Deploy (Railway)

Railway builds this with Railpack and needs no config file. It runs `npm ci`, then `npm run build`, then `npm start`, and the server listens on the `PORT` Railway provides. In the service settings, set the healthcheck path to `/healthz` and generate a public domain.

Any host that runs Node works the same way. For a static host, run `npm run build` and publish `dist/`.

## Test

```sh
npm test           # build checks, server checks, and every leaf and bonus round played once headless
npm run balance    # bots play each leaf and bonus round 8 times and print win rates
```

Run the balance bots after any change to levels or rules. Aim for every leaf to win at least about 75% of the time. CI runs `npm test` on every push and pull request.

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
| `scripts/build.mjs` | Single-file build. |
| `server.mjs` | Production server: compression, caching, CSP, health check. |
| `tests/` | Node test suite and the balance bots. |

## Fonts

Rozha One (Indian Type Foundry) and Mulish (The Mulish Project Authors) are used under the SIL Open Font License 1.1. See `assets/fonts/`.
