# Fluxquint™ Determinism Contract

Fluxquint™ guarantees that an identical ruleset version, seed and ordered command list produce the same board, score and checksum.

## Mechanisms

- String seeds are converted to stable 32-bit values.
- Rank bags and gravity forecasts use the same seeded generator.
- Trajectories are quantised to launcher, vector, power and bank selections.
- Capture uses fixed lane scanning rather than render-frame physics.
- Fusion and gravity tie-breaks have documented directional order.
- Replays store commands rather than animation frames.
- Checksums exclude presentation-only state.

Historical Daily challenges must retain their original ruleset version.
