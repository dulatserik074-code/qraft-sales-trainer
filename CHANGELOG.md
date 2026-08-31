# Changelog

## 0.2.1 — 2026-08-31

- Isolated AI rate limits per authenticated user instead of sharing the anonymous project key.
- Made browser access to the AI gateway fail closed when `ALLOWED_ORIGINS` is missing or mismatched.
- Prevented organization admins from modifying or granting the owner role.
- Added an upgrade migration for existing Supabase installations.

## 0.2.0 — 2026-08-31

- Connected the optional Gemini/OpenRouter gateway to the buyer conversation.
- Added structured response validation, authorization headers, CORS, limits, and offline fallback.
- Made skill weaknesses evidence-driven and removed baseline points without seller evidence.
- Added working catalog search and honest roadmap states for unfinished controls.
- Strengthened Supabase RLS coverage and secure organization onboarding.
- Added a Render production server, Blueprint, health endpoint, GitHub CI, and open-source documentation.
- Updated vulnerable dependencies and removed the unused `xlsx` package.

## 0.1.0

- Initial interactive MVP and deterministic scenario engine.
