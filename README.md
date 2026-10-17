# Pact API

REST API for personal commitments, check-ins, and streak tracking. The code is split into domain, repository, service, handler, middleware, and auth packages under `internal/`.

## Requirements

- Go 1.25 or Docker Desktop with Docker Compose
- PostgreSQL is started by Compose

## Configuration

Copy `.env.example` to `.env` if you do not already have a local `.env`:

```powershell
Copy-Item .env.example .env
```

Set `JWT_SECRET` to a private random value of at least 32 bytes. For example, generate one in PowerShell with:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Do not commit `.env`; it is excluded by `.gitignore`.

## Run with Docker Compose

```powershell
docker compose up --build
```

Compose starts PostgreSQL, applies pending migrations, then starts the API at `http://localhost:8080`. PostgreSQL is published on `localhost:5433` to avoid conflicting with a local PostgreSQL installation on port 5432.

To stop the services without deleting the database volume:

```powershell
docker compose down
```

## Run the API locally

Start PostgreSQL with `docker compose up -d postgres`, apply migrations, then run:

```powershell
$env:DATABASE_URL = "postgres://pact:pact@localhost:5433/pact?sslmode=disable"
go run ./cmd/api
```

The application reads `.env` automatically. Set `DATABASE_URL` as shown if the value in `.env` points somewhere else.

## HTTP API

| Method | Path                          | Authentication | Purpose                          |
|--------|-------------------------------|----------------|----------------------------------|
| `GET`  | `/healthz`                    | No             | Liveness check                   |
| `POST` | `/api/v1/auth/register`       | No             | Create an account                |
| `POST` | `/api/v1/auth/login`          | No             | Sign in and get a bearer token   |
| `GET`  | `/api/v1/pacts`               | Bearer token   | List the current user's pacts    |
| `POST` | `/api/v1/pacts`               | Bearer token   | Create a pact                    |
| `GET`  | `/api/v1/pacts/{id}`          | Bearer token   | Get one owned pact               |
| `POST` | `/api/v1/pacts/{id}/checkins` | Bearer token   | Record a check-in                |
| `GET`  | `/api/v1/pacts/{id}/checkins` | Bearer token   | List check-ins for an owned pact |

Register with JSON such as `{"email":"person@example.com","password":"at-least-8-chars","name":"Alex"}`. Use the returned `access_token` as `Authorization: Bearer <token>` for protected routes.

Create a pact with `title`, `frequency` (`daily` or `weekly`), and optional `description`, `start_date`, and `end_date` (`YYYY-MM-DD`). A check-in accepts optional `date` (`YYYY-MM-DD`) and `note`; omitted dates default to today. Daily pacts allow one check-in per date, weekly pacts one per Monday-based calendar week. Streak counters update when a check-in succeeds.

The OpenAPI 3.1 document is in [`docs/openapi.yaml`](docs/openapi.yaml) and can be imported into Swagger UI.
