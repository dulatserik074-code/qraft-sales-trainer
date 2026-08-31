# Qraft Sales Trainer

Рабочий MVP адаптивного ИИ-тренажёра оптовых продаж. Без ключей запускается локальный конечный автомат: диалог, оценка с цитатами, рекомендации, каталог, сценарии, аналитика и настройки команды. Интерфейс адаптирован для телефонов от 320 px, поддерживает тёмную тему и языковой переключатель RU/KZ/EN.

## Быстрый запуск

```bash
npm install
npm run dev
```

Откройте адрес из консоли. Production: `npm run build`, затем `npm run start`. Проверки: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` (перед E2E один раз выполните `npx playwright install chromium`).

## Supabase

1. Создайте бесплатный проект Supabase.
2. Примените `supabase/migrations/001_initial.sql` через CLI (`supabase db push`) или SQL Editor.
3. Разверните шлюз: `supabase functions deploy ai-gateway`.
4. Скопируйте `.env.example` в `.env.local`. Публичный anon key безопасен только вместе с включённым RLS; service-role key в браузер не добавляйте.
5. Секреты задавайте только серверно: `supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=...` и аналогично для OpenRouter.

Миграция создаёт мультитенантные таблицы, индексы, внешние ключи и базовые RLS-политики. Перед production расширьте политики записи на все административные операции под ваши бизнес-роли.

## AI-провайдеры

- Gemini и OpenRouter подключаются через `supabase/functions/ai-gateway`; модели задаются `GEMINI_MODEL` и `OPENROUTER_MODEL`.
- Cloudflare Workers AI и Ollama представлены в едином интерфейсе `AIProvider` и панели; для production добавьте соответствующий серверный адаптер, не проксируйте ключи через клиент.
- WebLLM — progressive enhancement для WebGPU-устройств.
- Deterministic Scenario Engine работает всегда, включая офлайн, и не отправляет данные наружу.

При 402/429/timeout шлюз выполняет ограниченный backoff; клиент может безопасно продолжить сценарным движком, не теряя диалог. Для конфиденциальных данных отключите облачный AI, оставив сценарный движок или корпоративный Ollama.

## PWA и бесплатный деплой

Manifest и service worker уже включены. Frontend можно бесплатно развернуть на Cloudflare Pages/Sites или Vercel; укажите build-команду `npm run build`. Supabase Free Plan обслуживает Auth/PostgreSQL/Edge Functions. Квоты бесплатных моделей меняются — проверяйте их у провайдера и не загружайте реальные цены, персональные данные или коммерческие тайны в публичные модели.

## Структура

- `app/` — интерфейс и маршрутизация рабочих разделов;
- `lib/scenario-engine.ts` — резервный конечный автомат и локальный оценщик;
- `lib/ai-provider.ts` — единый интерфейс AI gateway;
- `supabase/` — PostgreSQL/RLS и Edge Function;
- `e2e/` — Playwright-потоки;
- `public/` — PWA manifest, service worker и иконка.
