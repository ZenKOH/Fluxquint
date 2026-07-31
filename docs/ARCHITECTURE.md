# Fluxquint™ Architecture

## Separation of authority and presentation

`src/engine/` is the source of truth. It is independent of the browser interface and contains deterministic state creation, launch prediction, fusion, Quint detection, gravity, campaign definitions and replay verification.

`src/ui/` renders the state, collects commands, stores local settings and produces optional audio feedback. Animations illustrate already-calculated outcomes and cannot alter the board.

## State transition

A committed command contains launcher index, quantised aim, power, bank selection, fusion direction and optional gravity intervention. `commitLaunch()` resolves the entire turn in a fixed order and emits events for rendering and audit.

## Deployment

The project is dependency-free at runtime. The build script copies validated static assets to `dist/`. GitHub Actions publishes `dist/` to GitHub Pages.
