# Fluxquint™

**Current release: v1.1.1**

**Aim. Fuse. Complete the five. Control the shift.**

Fluxquint™ is an original deterministic kinetic logic strategy game. Players launch ranked Cores into an 8×8 magnetic lattice, selectively fuse equal ranks, construct straight Quints containing ranks 1–5, and plan around forecast gravity shifts.

## Playable systems

- Deterministic seeded engine with reproducible Daily challenges
- Quantised launcher, vector, impulse and controlled-bank inputs
- Selective fusion from rank 1 through rank 5
- Basic, Harmonic, Shift, Cross and Cascade Quints
- Five-launch gravity cycle and programmable Flux Choices
- Endless Flux, Daily Quint, seven-level Campaign and Creative Laboratory
- Replay export, state checksums and local progress
- Mouse, touch and keyboard controls
- Reduced-motion, high-contrast, symbolic-rank and sound settings
- Offline Progressive Web App support
- Responsive desktop and mobile interface

## Run locally

Fluxquint™ has no runtime package dependencies.

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validate

```bash
npm run check
```

This runs source-layout and brand validation, confirms that the browser-ready Pages assets match their source fragments, executes deterministic engine and UI regression tests, verifies replay integrity, and creates the production build.

## Production build

```bash
npm run build
```

The deployable site is written to `dist/`.

## Controls

- **Left / Right arrows:** move launcher
- **Up / Down arrows:** adjust aim vector
- **Space or Enter:** commit launch
- **R:** restart current mode
- Touch and mouse controls are available throughout the interface.

## Architecture

The authoritative game rules live in framework-independent JavaScript modules under `src/engine/`. The repository keeps the three largest browser modules in ordered, readable source fragments; `npm run build` assembles them into normal runtime files. The materialisation workflow also commits those browser-ready files to the repository root so either GitHub Pages publishing mode can serve a functioning game. Visual movement never determines scoring or board state. A launch command produces a deterministic capture cell, fusion chain, Quint resolution and gravity result.

See:

- [`docs/GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DETERMINISM.md`](docs/DETERMINISM.md)
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)
- [`docs/ORIGINALITY_AUDIT.md`](docs/ORIGINALITY_AUDIT.md)
- [`docs/IP_REGISTER.md`](docs/IP_REGISTER.md)

## Intellectual property

Fluxquint™ and its distinctive game identity are claimed as proprietary intellectual property. The ™ symbol denotes a claimed trademark; it does not represent confirmation of registration. See [`LICENSE`](LICENSE) and the IP documentation before reuse or contribution.

## Deployment

The preferred GitHub Pages source is **GitHub Actions**, which validates and publishes `dist/`. Fluxquint™ v1.1.1 also includes materialised `src/styles.css`, `src/ui/app.js`, `src/engine/game.js`, and `.nojekyll` at repository root, so direct deployment from the `main` branch works as a fallback.

Expected URL: `https://zenkoh.github.io/Fluxquint/`

If only “Skip to game board” appears, the site is serving an older root snapshot without the materialised browser assets. Wait for the Pages deployment to finish, then perform a hard refresh or clear the old service-worker/site data once.
