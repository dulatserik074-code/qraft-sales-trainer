# Security Policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a vulnerability

Please use GitHub's private **Security → Report a vulnerability** flow. Do not publish credentials, tokens, personal data, or exploit details in a public issue.

Include:

- affected file or route;
- impact and realistic attack scenario;
- reproduction steps with non-sensitive test data;
- suggested mitigation, if known.

## Deployment rules

- Keep Supabase JWT verification enabled for `ai-gateway`.
- Store Gemini/OpenRouter keys only in Supabase server secrets.
- Never expose a service-role key through `NEXT_PUBLIC_*` variables.
- Configure `ALLOWED_ORIGINS` for the production Render URL.
- Keep RLS enabled and test policies before connecting real organizations.
- Do not process confidential customer data through free public models without authorization.
