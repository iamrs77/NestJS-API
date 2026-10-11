# Bookmarks API

[![CI](https://github.com/iamrs77/NestJS-API/actions/workflows/ci.yml/badge.svg)](https://github.com/iamrs77/NestJS-API/actions/workflows/ci.yml)

A REST API where people can sign up, log in and save their own bookmarks (links to websites).

It is built with **NestJS**, **Prisma** and **PostgreSQL**, and it has the parts a real backend needs: login with tokens, input checks, database migrations, unit and end-to-end tests, API docs, Docker and CI.

## What it does

- **Sign up and log in.** Passwords are hashed with argon2, never stored as plain text. Logging in gives you a JWT token that works for 15 minutes.
- **Profile.** See your own profile and change your email or name.
- **Bookmarks.** Create, list, view, change and delete bookmarks.
- **Privacy between users.** You can only see and change your own bookmarks. If you ask for someone else's bookmark, you get `404 Not Found`, the same answer as for a bookmark that does not exist. This way nobody can find out which bookmark ids are in use.
- **Input checks.** Every request body is checked. Bad data gets a clear `400` error. Fields you are not allowed to send (like `id` or `hash`) are removed before they reach the code.
- **Safe errors.** A wrong password and an unknown email give the same `401` message, so nobody can use the login form to find out who has an account.

## Tech stack

| Area       | Tools                                    |
| ---------- | ---------------------------------------- |
| Framework  | NestJS 10, TypeScript                    |
| Database   | PostgreSQL 17, Prisma ORM and migrations |
| Login      | Passport, JWT, argon2                    |
| Validation | class-validator, class-transformer       |
| API docs   | Swagger (OpenAPI), served at `/docs`     |
| Tests      | Jest (unit tests), Pactum (end-to-end)   |
| DevOps     | Docker, Docker Compose, GitHub Actions   |

## API endpoints

All `/users` and `/bookmarks` endpoints need a token: send it as `Authorization: Bearer <token>`.

| Method | Path              | What it does                                |
| ------ | ----------------- | ------------------------------------------- |
| POST   | `/auth/signup`    | Create an account, returns a token          |
| POST   | `/auth/signin`    | Log in, returns a token                     |
| GET    | `/users/me`       | Get your profile                            |
| PATCH  | `/users`          | Change your email, first name or last name  |
| GET    | `/bookmarks`      | List your bookmarks                         |
| POST   | `/bookmarks`      | Save a new bookmark                         |
| GET    | `/bookmarks/{id}` | Get one of your bookmarks                   |
| PATCH  | `/bookmarks/{id}` | Change one of your bookmarks                |
| DELETE | `/bookmarks/{id}` | Delete one of your bookmarks                |

When the API is running, the full docs are at **http://localhost:3000/docs**. You can try every endpoint from there.

## How to run it

### Option 1: with Docker only (easiest)

You only need [Docker](https://docs.docker.com/get-docker/). You don't need Node or PostgreSQL.

```bash
git clone https://github.com/iamrs77/NestJS-API.git
cd NestJS-API
docker compose up --build
```

This starts PostgreSQL, creates the tables and starts the API. When you see `Nest application successfully started`, open **http://localhost:3000/docs**.

Press `Ctrl+C` to stop it. Run `docker compose down` to remove the containers.

### Option 2: with Node (for working on the code)

You need **Node 22 or newer**, and Docker for the database.

```bash
git clone https://github.com/iamrs77/NestJS-API.git
cd NestJS-API
npm install
cp .env.example .env         # Windows PowerShell: copy .env.example .env
npm run db:up                # start PostgreSQL in Docker (port 5434)
npx prisma migrate deploy    # create the tables
npm run start:dev            # start the API, it restarts when you change code
```

The API runs on **http://localhost:3000**.

**No Docker?** Install PostgreSQL on your computer, create a database, and change `DATABASE_URL` in `.env` to point to it.

## Try it

**The easy way:** open http://localhost:3000/docs and

1. Open `POST /auth/signup`, click **Try it out**, and send an email and a password (at least 8 characters).
2. Copy the `access_token` from the response.
3. Click **Authorize** at the top of the page and paste the token.
4. Now you can call the `/users` and `/bookmarks` endpoints.

**With curl** (macOS, Linux or Git Bash on Windows):

```bash
# sign up and keep the token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"secret123"}' | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

# save a bookmark
curl -X POST http://localhost:3000/bookmarks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"NestJS docs","link":"https://docs.nestjs.com"}'

# list your bookmarks
curl http://localhost:3000/bookmarks -H "Authorization: Bearer $TOKEN"
```

## Tests

```bash
npm test               # unit tests, no database needed
npm run db:test:up     # start the test database in Docker (port 5435)
npm run test:e2e       # end-to-end tests against the test database
```

- **Unit tests** check the services on their own, with a fake database. For example: a database error during sign up is passed on and not hidden, and a bookmark that is not yours is never changed.
- **End-to-end tests** start the real app and send real HTTP requests to it. They cover every endpoint, including a second user trying to read, change and delete the first user's bookmark. The test database is emptied at the start of every run, and its settings are in `.env.test`.

GitHub Actions runs lint, build, unit tests and end-to-end tests on every push. It also checks that `docker compose up` really starts the API.

## Settings

The API reads these from `.env` (copy `.env.example` to start). If one of the first two is missing, the API stops at startup and tells you which one.

| Name           | What it is                                 | Example                                                     |
| -------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL` | Where the PostgreSQL database is           | `postgresql://postgres:123@localhost:5434/nest?schema=public` |
| `JWT_SECRET`   | Secret used to sign tokens, keep it secret | a long random string                                        |
| `PORT`         | Port for the API (optional)                | `3000`                                                      |

## Project structure

```
src/
  auth/          sign up, log in, JWT strategy, guard and @GetUser decorator
  user/          GET /users/me and PATCH /users
  bookmark/      bookmark endpoints with the "only your own" checks
  prisma/        database connection, shared by all modules
  common/        small helpers for DTOs (lowercase emails, optional but not null)
  config/        checks the settings when the app starts
  setup-app.ts   validation and Swagger setup, used by the app and the e2e tests
  main.ts        starts the app
prisma/
  schema.prisma  database tables
  migrations/    SQL for every change to the tables
test/            end-to-end tests
```

## Useful commands

| Command                  | What it does                                          |
| ------------------------ | ----------------------------------------------------- |
| `npm run start:dev`      | Start the API and restart it when code changes        |
| `npm run build`          | Compile to `dist/`                                    |
| `npm run start:prod`     | Run the compiled app                                  |
| `npm run db:up`          | Start the database in Docker                          |
| `npm run db:rm`          | Stop the database and delete its data                 |
| `npm run db:restart`     | Fresh empty database with all tables created          |
| `npx prisma studio`      | Look at the data in your browser                      |
| `npx prisma migrate dev` | Create a new migration after you change the schema    |
| `npm run lint`           | Find and fix code style problems                      |
| `npm run format`         | Format the code with Prettier                         |

## Ideas for later

- Refresh tokens, so users don't need to log in again every 15 minutes
- Rate limiting on login, to slow down password guessing
- Pages (pagination) for long bookmark lists
