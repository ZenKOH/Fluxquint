# Fluxquint™

**Aim. Fuse. Complete the five. Control the shift.**

Fluxquint™ is an original deterministic kinetic logic strategy game. Players launch ranked Cores into an 8×8 magnetic lattice, selectively fuse equal ranks, construct straight Quints containing ranks 1–5, and plan around forecast gravity shifts.

## Playable systems

- Deterministic seeded engine with reproducible Daily challenges
- Quantised launcher, vector, impulse and controlled-bank inputs
- Selective fusion from rank 1 through rank 5
- Basic, Harmonic, Shift, Cross and Cascade Quints
- Five-launch gravity cycle and programmable Flux Choices
- Endless Flux, Daily Quint, seven-level Campaign and Creative Laboratory
- Replay export, state checksums and local progression
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

This runs source validation, deterministic engine tests and the production build.

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

The authoritative game rules live in framework-independent JavaScript modules under `src/engine/`. Visual movement never determines scoring or board state. A launch command produces a deterministic capture cell, fusion chain, Quint resolution and gravity result.

See:

- [`docs/GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DETERMINISM.md`](docs/DETERMINISM.md)
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)
- [`docs/ORIGINALITY_AUDIT.md`](docs/ORIGINALITY_AUDIT.md)
- [`docs/IP_REGISTER.md`](docs/IP_REGISTER.md)

## Intellectual property

Fluxquint™ and its distinctive game identity are claimed as proprietary intellectual property. The ™ symbol denotes a claimed trademark; it does not represent confirmation of registration. See [`LICENSE`](LICENSE) and the IP documentation before reuse or contribution.
