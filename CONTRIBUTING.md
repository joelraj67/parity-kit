# Contributing to parity-kit

Thanks for considering a contribution! This is a small, focused tool — keep changes minimal and boring.

## Quick start

```bash
git clone https://github.com/joelraj67/parity-kit.git
cd parity-kit
npm ci
npx playwright install chromium
npx parity-kit --help
```

## Ways to contribute
- Report bugs (with baseline/current URLs + viewport + diff%)
- Add framework route presets (`src/config-generator.js`)
- Improve zero-flake preprocessors (`src/preprocessors.js`)
- Docs & examples

## Pull requests
1. Fork → branch: `fix/short-desc` or `feat/short-desc`
2. `npm run lint` should pass (`node --check`)
3. Keep diff small — one concern per PR
4. Update `CHANGELOG.md` under `[Unreleased]`
5. Describe repro + before/after in PR body

## Commit messages
Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`. Squash is fine.

## Need help?
Open a [Discussion](https://github.com/joelraj67/parity-kit/discussions) or an issue. Be kind, see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
