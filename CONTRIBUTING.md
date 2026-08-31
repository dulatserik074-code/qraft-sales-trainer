# Contributing

Thank you for helping build Qraft Sales Trainer.

## Before you start

1. Check existing issues and `ROADMAP.md`.
2. For a large change, open an issue and describe the user problem first.
3. Never add real customer data, provider keys, access tokens, or commercial price lists.

## Development

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add or update tests when changing conversation logic, scoring, security boundaries, or deployment behavior.

## Pull requests

- Keep one pull request focused on one problem.
- Explain what changed, why it changed, and how it was tested.
- Mark demo-only behavior clearly; do not present a toast or static value as persisted data.
- Keep AI output structured and validated before displaying it.
- Preserve the offline fallback.

By contributing, you agree that your contribution is licensed under Apache License 2.0.
