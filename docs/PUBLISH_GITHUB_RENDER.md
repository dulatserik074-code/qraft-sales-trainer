# Публикация на GitHub и Render

## 1. Создайте репозиторий GitHub

1. Откройте <https://github.com/new>.
2. Название: `qraft-sales-trainer`.
3. Visibility: **Public**.
4. Не добавляйте README, `.gitignore` и лицензию — они уже находятся в проекте.
5. Нажмите **Create repository**.

## 2. Загрузите проект

Самый простой способ без терминала:

1. Распакуйте релизный ZIP.
2. На странице пустого репозитория нажмите **uploading an existing file**.
3. Перетащите содержимое папки `qraft-sales-trainer`.
4. Commit message: `Release Qraft Sales Trainer v0.2.0`.
5. Нажмите **Commit changes**.

GitHub Actions автоматически запустит проверку. Дождитесь зелёной отметки в разделе **Actions**.

## 3. Разверните бесплатное офлайн-демо на Render

1. Войдите на <https://dashboard.render.com/> через GitHub.
2. Выберите **New → Blueprint**.
3. Подключите репозиторий `qraft-sales-trainer`.
4. Render обнаружит `render.yaml` и покажет сервис `qraft-sales-trainer`.
5. Нажмите **Deploy Blueprint**.
6. После успешного запуска откройте выданный адрес `*.onrender.com`.

Для первого запуска ключи не нужны: приложение автоматически работает в офлайн-режиме.

## 4. Добавьте облачный ИИ позже

1. Разверните `supabase/functions/ai-gateway` с включённой проверкой JWT.
2. Сохраните Gemini/OpenRouter ключ только в Supabase Secrets.
3. В Render добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`;
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
   - при необходимости `NEXT_PUBLIC_AI_GATEWAY_URL`;
   - `NEXT_PUBLIC_AI_PROVIDER=gemini` или `openrouter`.
4. Выберите **Save, rebuild, and deploy**.
5. В Supabase задайте `ALLOWED_ORIGINS` равным точному адресу Render.

Никогда не помещайте AI API key или Supabase service-role key в Render-переменные с префиксом `NEXT_PUBLIC_`.
