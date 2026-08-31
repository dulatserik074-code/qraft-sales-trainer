# Qraft Sales Trainer

[![CI](https://github.com/dulatserik074-code/qraft-sales-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/dulatserik074-code/qraft-sales-trainer/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Open-source MVP ИИ-тренажёра для оптовых B2B-продаж. Продавец ведёт переговоры с виртуальным покупателем, получает оценку с доказательствами из диалога, видит слабые навыки и изучает улучшенные формулировки.

[English README](README.en.md)

> Статус: рабочий публичный MVP. Офлайн-сценарий работает без ключей. Gemini или OpenRouter подключаются через защищённую Supabase Edge Function. Корпоративные функции, отмеченные `roadmap`, намеренно не имитируют сохранение данных.

## Что уже работает

- полноценный текстовый диалог продавца с покупателем;
- детерминированный офлайн-режим без API-ключей;
- реальный AI-шлюз для Gemini и OpenRouter с таймаутом, повторами и fallback;
- оценка девяти навыков с цитатами из разговора;
- динамические точки роста и примеры скриптов;
- поиск по демонстрационному каталогу;
- адаптивный интерфейс от 320 px, тёмная тема и PWA;
- базовая схема Supabase с мультитенантностью и RLS;
- готовые проверки GitHub Actions и Blueprint для Render.

## Честные ограничения MVP

- история, Auth, командные приглашения и CRUD каталога пока не подключены к интерфейсу;
- только первый сценарий является интерактивным;
- интерфейс пока на русском, KZ и EN находятся в roadmap;
- Cloudflare AI, Ollama и WebLLM указаны как будущие адаптеры;
- бесплатные квоты AI-провайдеров могут меняться и не гарантируют безлимитную работу.

## Быстрый запуск

Требуется Node.js 22.13 или новее, но ниже Node.js 25.

```bash
npm ci
npm run dev
```

Без `.env.local` приложение автоматически использует офлайн-сценарий.

Проверка релиза:

```bash
npm run check
```

## Подключение облачного ИИ

1. Создайте бесплатный проект Supabase.
2. Примените `supabase/migrations/001_initial.sql`.
3. Разверните функцию без отключения проверки JWT:

   ```bash
   supabase functions deploy ai-gateway
   ```

4. Добавьте серверные секреты:

   ```bash
   supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash
   supabase secrets set ALLOWED_ORIGINS=https://your-app.onrender.com
   ```

5. Скопируйте `.env.example` в `.env.local` и заполните только публичные переменные `NEXT_PUBLIC_*`.

Для OpenRouter задайте `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` и установите `NEXT_PUBLIC_AI_PROVIDER=openrouter`.

Никогда не добавляйте AI-ключи и Supabase service-role key в браузерные переменные или GitHub.

## Развёртывание на Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dulatserik074-code/qraft-sales-trainer)

В корне уже находится `render.yaml`. Он создаёт бесплатный Node Web Service, запускает production-сборку и проверяет `/healthz`.

После публикации репозитория:

1. В Render выберите **New → Blueprint**.
2. Подключите репозиторий `qraft-sales-trainer`.
3. Для офлайн-демо переменные добавлять не нужно. Для облачного ИИ добавьте публичные переменные Supabase в настройках Render и запустите новую сборку.
4. Нажмите **Deploy Blueprint**.

Сервер слушает `0.0.0.0` и переменную `PORT`, как требует Render.

Пошаговая инструкция без терминала: [публикация на GitHub и Render](docs/PUBLISH_GITHUB_RENDER.md).

## Структура

- `app/` — интерфейс приложения;
- `lib/scenario-engine.ts` — офлайн-диалог и оценщик;
- `lib/ai-provider.ts` — типизированный клиент AI-шлюза;
- `supabase/` — схема PostgreSQL, RLS и Edge Function;
- `server.mjs` и `render.yaml` — production-запуск на Render;
- `e2e/` — проверки основного пользовательского пути и адаптивности.

## Ищем участников команды

Проект особенно нуждается в:

- full-stack разработчике с опытом Supabase и безопасности;
- AI/LLM специалисте по structured output и оцениванию диалогов;
- методологе B2B-продаж и пилотных оптовых компаниях.

Начните с [ROADMAP.md](ROADMAP.md) и [CONTRIBUTING.md](CONTRIBUTING.md). Для небольших задач используйте GitHub Issues с метками `good first issue` и `help wanted`.

## Безопасность и данные

Не загружайте реальные персональные данные, цены, коммерческие тайны и закрытые договоры в публичные AI-модели. Для чувствительных сценариев используйте локальный режим или отдельную корпоративную модель. Уязвимости сообщайте по инструкции в [SECURITY.md](SECURITY.md).

## Лицензия

Apache License 2.0. Автор проекта — Dulat Serik. Лицензия разрешает использование и доработку кода при сохранении уведомлений об авторстве; название и репутация проекта не должны использоваться для ложного заявления о поддержке автором.
