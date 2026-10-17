# Pact

Pact помогает создавать личные обязательства, отмечать выполнение и отслеживать серии. Backend – Go и PostgreSQL; интерфейс – React, TypeScript и Vite.

## Запуск

Нужны Docker Desktop с Compose и Node.js 20.19+.

В первом терминале запусти backend:

```powershell
Copy-Item backend/.env.example backend/.env
# Добавь в backend/.env случайный JWT_SECRET длиной не менее 32 байт.
Set-Location backend
docker compose up --build
```

Во втором терминале запусти frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Открой URL, напечатанный Vite (обычно `http://localhost:5173`). Frontend обращается к API на `http://localhost:8080`; другой адрес задаётся через `VITE_API_URL` в `frontend/.env.local`.

## Проверки

```powershell
Set-Location frontend
npm run lint
npm run build
```

API-контракты, миграции и подробная конфигурация backend находятся в [backend/README.md](backend/README.md) и [backend/docs/openapi.yaml](backend/docs/openapi.yaml).

Редактирование и удаление обязательств пока не реализованы в backend API и поэтому не показаны как доступные действия в интерфейсе.

## GitHub Pages

После push в `main` GitHub Actions соберёт frontend и опубликует его по адресу https://nastylauf.github.io/Pact-project/.

Для первого запуска открой Settings → Pages и выбери GitHub Actions как источник публикации. Без переменной репозитория `VITE_API_URL` опубликованная версия доступна только для просмотра: для входа нужен публичный backend. Локальный `localhost:8080` с чужого устройства недоступен.