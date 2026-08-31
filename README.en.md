# Qraft Sales Trainer

Qraft Sales Trainer is an open-source MVP for practicing wholesale B2B sales. A seller negotiates with a virtual buyer, receives evidence-based scoring, reviews weak skills, and learns stronger sales language.

[Русская версия](README.md)

> Status: working public MVP. The deterministic scenario runs without API keys. Gemini or OpenRouter can be enabled through a protected Supabase Edge Function. Corporate features marked as `roadmap` intentionally do not pretend to persist data.

## Available now

- end-to-end text negotiation with a virtual buyer;
- deterministic offline mode with no external AI dependency;
- Gemini and OpenRouter gateway with timeout, retry, validation, and fallback;
- nine-skill evaluation with transcript evidence;
- dynamic improvement priorities and example scripts;
- demo catalog search;
- responsive UI from 320 px, dark mode, and PWA support;
- multi-tenant Supabase schema with Row Level Security;
- GitHub Actions checks and a Render Blueprint.

## MVP limitations

- Auth, persistence, team invitations, and catalog CRUD are not connected to the UI yet;
- only the first scenario is interactive;
- the current interface is Russian-only; KZ and EN are on the roadmap;
- Cloudflare AI, Ollama, and WebLLM are roadmap adapters;
- free AI quotas change over time and are not unlimited.

## Local development

Node.js 22.13 or newer and lower than Node.js 25 is required.

```bash
npm ci
npm run dev
```

With no `.env.local`, the app automatically runs in offline scenario mode.

```bash
npm run check
```

## Cloud AI setup

1. Create a Supabase project and apply `supabase/migrations/001_initial.sql`.
2. Deploy `supabase/functions/ai-gateway` with JWT verification enabled.
3. Add a Gemini or OpenRouter key as a Supabase server secret.
4. Copy `.env.example` to `.env.local` and fill only the public `NEXT_PUBLIC_*` values.

Never expose provider keys or the Supabase service-role key in browser variables or GitHub.

## Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dulatserik074-code/qraft-sales-trainer)

The root `render.yaml` creates a free Node Web Service, runs the production build, and checks `/healthz`. No Supabase variables are required for an offline-only public demo; add them in Render and rebuild when enabling cloud AI.

## Contributing

The project is looking for full-stack/Supabase contributors, LLM evaluation specialists, B2B sales methodologists, and pilot wholesale companies. Read [ROADMAP.md](ROADMAP.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Apache License 2.0. Copyright 2026 Dulat Serik.
