# Fluxquint™ Security Model

The current build is a static offline-capable application with no account system or server-side storage.

- No secrets are required in client code.
- No personal data is transmitted.
- Local settings and progress remain in browser storage.
- Replay files contain only game seed, ruleset, commands and checksum.
- GitHub Actions use least-privilege permissions.
- Dependency-free runtime reduces supply-chain exposure.

Security issues should be reported privately through GitHub's repository security reporting mechanism where available.
