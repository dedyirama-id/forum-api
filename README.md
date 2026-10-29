# Forum API

[![Continuous Integration](https://github.com/dedyirama-id/forum-api/actions/workflows/ci.yml/badge.svg)](https://github.com/dedyirama-id/forum-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A RESTful back-end for a discussion forum: users register, log in with JWT, start threads, comment, reply to comments, and like comments. It is built with **Hapi** and **PostgreSQL**, follows **Clean Architecture**, and is covered by unit, integration, and functional tests. It also ships with a CI/CD pipeline that deployed it to a VPS behind nginx.

> Final project for the Dicoding course *Menjadi Back-End Developer Expert dengan JavaScript*.

## Features

- **User registration** with bcrypt password hashing
- **Authentication** with short-lived access tokens and refresh tokens (`@hapi/jwt`)
- **Threads**: create a thread and view it with its nested comments and replies
- **Comments and replies**: only the owner can delete them; deletes are soft, so deleted content is shown as `**komentar telah dihapus**` / `**balasan telah dihapus**`
- **Comment likes**: toggle a like on a comment; `likeCount` appears in thread details
- **Rate limiting** on `/threads` (90 requests/minute per IP) at the nginx layer

## Tech Stack

| Concern        | Tools                                            |
| -------------- | ------------------------------------------------ |
| Runtime        | Node.js 20+                                      |
| HTTP framework | Hapi 20, @hapi/jwt                               |
| Database       | PostgreSQL 16, `pg`, `node-pg-migrate`           |
| DI container   | `instances-container`                            |
| Testing        | Jest (unit + integration), Postman/Newman (functional) |
| Code quality   | ESLint (Airbnb base)                             |
| CI/CD          | GitHub Actions, SSH deploy, PM2, nginx + Let's Encrypt |

## Architecture

The code follows Clean Architecture. Dependencies point inward: business rules don't know about Hapi or PostgreSQL. Concrete implementations are wired together in [`src/Infrastructures/container.js`](src/Infrastructures/container.js).

```
src/
├── Domains/           # Enterprise rules: entities + repository interfaces (users, threads, comments, authentications)
├── Applications/      # Application rules: use cases + security interfaces (PasswordHash, AuthenticationTokenManager)
├── Interfaces/        # HTTP adapters: Hapi plugins, routes, and handlers
├── Infrastructures/   # Frameworks & drivers: Postgres repositories, bcrypt, JWT, Hapi server, DI container
└── Commons/           # Shared exceptions + DomainErrorTranslator
```

Every layer keeps its tests next to the code in `_test/` folders. Database test helpers live in [`tests/`](tests).

## API Endpoints

🔒 = requires `Authorization: Bearer <accessToken>`

| Method | Path                                                         | Description                      |
| ------ | ------------------------------------------------------------ | -------------------------------- |
| POST   | `/users`                                                     | Register a user                  |
| POST   | `/authentications`                                           | Log in (returns access + refresh token) |
| PUT    | `/authentications`                                           | Refresh the access token         |
| DELETE | `/authentications`                                           | Log out (revoke refresh token)   |
| POST   | `/threads` 🔒                                                | Create a thread                  |
| GET    | `/threads/{threadId}`                                        | Get thread details with comments, replies, and like counts |
| POST   | `/threads/{threadId}/comments` 🔒                            | Add a comment                    |
| DELETE | `/threads/{threadId}/comments/{commentId}` 🔒                | Delete your comment (soft delete) |
| POST   | `/threads/{threadId}/comments/{commentId}/replies` 🔒        | Reply to a comment               |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` 🔒 | Delete your reply (soft delete) |
| PUT    | `/threads/{threadId}/comments/{commentId}/likes` 🔒          | Like / unlike a comment          |

Responses use the envelope `{ "status": "success" | "fail" | "error", "data" | "message": ... }`.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Docker (for the local PostgreSQL), or your own PostgreSQL 16 instance

### Setup

```bash
git clone https://github.com/dedyirama-id/forum-api.git
cd forum-api
npm ci

# Environment variables
cp .env.example .env
cp config/database/test.example.json config/database/test.json

# Start PostgreSQL (creates both the main and the test database)
docker compose up -d

# Run migrations
npm run migrate up
npm run migrate:test up

# Start the dev server (http://localhost:5000)
npm run start:dev
```

### Environment Variables

| Variable                          | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `HOST`, `PORT`                    | HTTP server address                              |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Main database connection   |
| `PG*_TEST`                        | Test database connection (used when `NODE_ENV=test`) |
| `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY` | Secrets for signing JWTs                   |
| `ACCESS_TOKEN_AGE`                | Access token lifetime in seconds                 |

## Testing

```bash
npm test               # all Jest tests, with coverage
npm run test:watch     # watch mode
npm run lint           # ESLint
```

The functional API tests are a Postman collection. Run them against a running server with `npm run test:postman` (needs the Postman CLI and access to the collection).

## Deployment

> The app used to run on a VPS that has since been shut down, so there is no live instance. The setup is kept here for reference.

- **CI** ([`ci.yml`](.github/workflows/ci.yml)): every pull request to `main` installs dependencies, lints, runs migrations, and runs the test suite on Node 20 and 22 against a PostgreSQL service.
- **CD** ([`cd.yml`](.github/workflows/cd.yml)): connects to the server over SSH, pulls the code, installs dependencies, runs migrations, and restarts the app with PM2. It used to run on every push to `main`; now it only runs when triggered manually.
- **Reverse proxy**: nginx terminates TLS (Let's Encrypt) and rate-limits `/threads`. See [`deploy/nginx/forumapi.conf`](deploy/nginx/forumapi.conf).

## License

[MIT](LICENSE) © Dedy Irama

## Acknowledgements

Project scaffold and requirements by [Dicoding Indonesia](https://www.dicoding.com/).
