# Issue Tracker — Backend

Production-ready REST API for an issue tracking application. Built with Express, TypeScript, Prisma, and MySQL.

## Highlights

- **Clean architecture** — routes → controllers → services → repositories
- **Type-safe end-to-end** — strict TypeScript, Zod-validated env and requests, Prisma-generated DB types
- **JWT auth with refresh token rotation** — access token in memory, refresh token in httpOnly cookie, reuse detection
- **Centralized error handling** — typed `AppError` class, consistent JSON error shape, Prisma error mapping
- **Security by default** — Helmet, CORS whitelist, rate limiting (global + auth-specific), bcrypt cost 12
- **Graceful shutdown** — drains in-flight requests on SIGTERM
- **Production Dockerfile** — multi-stage, non-root user, runs migrations on startup
- **50 realistic seed issues** — so your live demo doesn't look empty

## Tech Stack

| Layer       | Choice                          |
| ----------- | ------------------------------- |
| Runtime     | Node.js 20                      |
| Framework   | Express 4                       |
| Language    | TypeScript 5 (strict)           |
| ORM         | Prisma 5                        |
| Database    | MySQL 8                         |
| Validation  | Zod                             |
| Auth        | JWT (access + refresh) + bcrypt |
| Security    | Helmet, CORS, express-rate-limit |

## Project Structure

```
src/
├── config/
│   ├── env.ts              # Zod-validated environment variables
│   └── prisma.ts           # Prisma client singleton
├── middleware/
│   ├── auth.ts             # JWT verification → req.user
│   ├── validate.ts         # Zod request validation
│   ├── errorHandler.ts     # Centralized error handler
│   └── rateLimiter.ts      # Global + auth rate limiters
├── modules/
│   ├── auth/
│   │   ├── auth.schema.ts      # Zod schemas
│   │   ├── auth.service.ts     # Business logic
│   │   ├── auth.controller.ts  # HTTP handlers
│   │   └── auth.routes.ts      # Router
│   └── issues/
│       ├── issues.schema.ts
│       ├── issues.repository.ts  # Prisma queries
│       ├── issues.service.ts
│       ├── issues.controller.ts
│       └── issues.routes.ts
├── types/
│   └── express.d.ts        # Augments Request.user
├── utils/
│   ├── AppError.ts         # Typed error class + factories
│   ├── asyncHandler.ts     # Async route wrapper
│   └── jwt.ts              # Token signing/verification
├── app.ts                  # Express app wiring
└── server.ts               # Entrypoint + graceful shutdown
prisma/
├── schema.prisma           # DB schema with indexes
└── seed.ts                 # 50 realistic issues
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local MySQL) or access to a MySQL 8 instance
- npm

### Installation

```bash
# 1. Clone and enter the repo
git clone <your-repo-url>
cd issue-tracker-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env — at minimum set strong JWT secrets (`openssl rand -hex 32`)

# 4. Start MySQL (Docker) or point DATABASE_URL at your instance
docker compose up -d

# 5. Run database migrations
npm run prisma:migrate

# 6. Seed demo data (50 issues + demo@example.com / Demo1234!)
npm run prisma:seed

# 7. Start the dev server
npm run dev
```

The API will be available at `http://localhost:8080`.

### NPM Scripts

| Script                    | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Start dev server with hot reload (tsx watch) |
| `npm run build`           | Compile TypeScript → `dist/`                 |
| `npm start`               | Run compiled production build                |
| `npm run typecheck`       | Type-check without emitting                  |
| `npm run prisma:migrate`  | Create/apply migration in dev                |
| `npm run prisma:deploy`   | Apply migrations in prod                     |
| `npm run prisma:seed`     | Populate seed data                           |
| `npm run prisma:studio`   | Open Prisma Studio (DB browser)              |

## API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint         | Auth | Description                                 |
| ------ | ---------------- | ---- | ------------------------------------------- |
| POST   | `/auth/register` | No   | Create account. Returns access token + sets refresh cookie. |
| POST   | `/auth/login`    | No   | Log in. Returns access token + sets refresh cookie. |
| POST   | `/auth/refresh`  | No*  | Rotate tokens (reads refresh cookie).       |
| POST   | `/auth/logout`   | No*  | Revoke refresh token, clear cookie.         |
| GET    | `/auth/me`       | Yes  | Get current user info.                      |

*\* Uses refresh cookie, not access token.*

### Issues

All issue endpoints require `Authorization: Bearer <access_token>`.

| Method | Endpoint            | Description                                       |
| ------ | ------------------- | ------------------------------------------------- |
| GET    | `/issues`           | List issues (paginated, filterable, searchable)   |
| GET    | `/issues/stats`     | Status counts (`?mine=true` for user's own)       |
| GET    | `/issues/:id`       | Get one issue                                     |
| POST   | `/issues`           | Create an issue                                   |
| PATCH  | `/issues/:id`       | Update (author only)                              |
| DELETE | `/issues/:id`       | Delete (author only)                              |

#### List query parameters

```
?page=1
&limit=20
&search=foo
&status=OPEN|IN_PROGRESS|RESOLVED|CLOSED
&priority=LOW|MEDIUM|HIGH|URGENT
&severity=TRIVIAL|MINOR|MAJOR|CRITICAL
&sortBy=createdAt|updatedAt|priority|status
&sortOrder=asc|desc
```

#### Response shapes

Success (list):
```json
{
  "data": [ { "id": "...", "title": "...", ... } ],
  "pagination": { "page": 1, "limit": 20, "total": 147, "totalPages": 8 }
}
```

Success (single):
```json
{ "data": { "id": "...", "title": "...", ... } }
```

Error:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [ { "path": "title", "message": "..." } ]
}
```

## Example Requests

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"me@example.com","password":"Secret123","name":"Me"}'

# Login (saves refresh cookie)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"demo@example.com","password":"Demo1234!"}'

# Create an issue (replace <TOKEN> with accessToken from login)
curl -X POST http://localhost:8080/api/issues \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first issue","description":"This is a test issue.","priority":"HIGH"}'

# List issues with filter
curl "http://localhost:8080/api/issues?status=OPEN&priority=HIGH&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"

# Refresh tokens (uses cookie)
curl -X POST http://localhost:8080/api/auth/refresh -b cookies.txt -c cookies.txt
```

## Authentication Flow

1. **Register / Login** → server issues:
   - Access token (JWT, 15 min) → returned in response body, client keeps it in memory
   - Refresh token (JWT, 7 days) → set as `httpOnly; Secure; SameSite=Strict` cookie
2. Client sends `Authorization: Bearer <access>` on every API call
3. When access expires (401), client calls `/auth/refresh` → server rotates both tokens
4. Old refresh token is marked `revokedAt` in the DB
5. If a revoked token is ever presented, **all user sessions are revoked** (reuse = potential theft)

### Why this pattern

- Access token in memory ≠ accessible to XSS
- Refresh token in httpOnly cookie ≠ accessible to JS
- Refresh token rotation + reuse detection ≠ indefinite access if stolen
- Short access TTL limits damage from a leaked access token

## Deployment (AWS)

### Recommended stack
- **Database:** RDS MySQL 8 `db.t3.micro` (free tier)
- **Backend:** AWS App Runner (reads the Dockerfile, auto-deploys from GitHub)
- **Frontend:** AWS Amplify or S3 + CloudFront

### Steps

1. **Create RDS instance** — MySQL 8, public access on, security group allows port 3306 from your IP + App Runner
2. **Note the connection string** — `mysql://admin:<pwd>@<endpoint>:3306/issue_tracker`
3. **Push to GitHub**
4. **App Runner → Create service** → source: your repo, runtime: Dockerfile, auto-deploy on push
5. **Environment variables** in App Runner:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (both 32+ chars)
   - `CORS_ORIGIN` (your frontend URL)
   - `NODE_ENV=production`
6. **Health check path:** `/health`
7. **Port:** `8080`

The Dockerfile runs `prisma migrate deploy` on startup, so schema is always in sync.

## Design Decisions

- **Modular monolith over microservices** — two domains don't justify the operational overhead of distributed systems
- **Repository layer** — isolates Prisma so the service layer is pure business logic and easy to unit-test
- **Refresh tokens stored in DB** — lets us revoke individual sessions (logout, password change, reuse detection). A stateless-only JWT approach can't do this
- **Hashed refresh tokens in DB** — if the DB is dumped, attackers can't use the stored values as bearer tokens
- **Zod for env validation** — misconfigured deployments fail at boot, not mid-request
- **`validate()` replaces `req.body`** — downstream code gets coerced types (e.g. `limit: number` not `"20"`)
- **`Prisma.PrismaClientKnownRequestError` mapping** — unique constraint violations become 409s, not 500s
- **Bcrypt runs even when user doesn't exist** — prevents timing attacks that distinguish "wrong password" from "no such user"

## Security Checklist

- [x] Passwords hashed with bcrypt cost 12
- [x] JWT secrets required to be 32+ chars (Zod-validated at boot)
- [x] Refresh token in `httpOnly; Secure; SameSite=Strict` cookie
- [x] Refresh tokens hashed before DB storage
- [x] Refresh token rotation with reuse detection
- [x] Rate limiting: 100/min global, 5/15min on auth routes
- [x] Helmet for security headers
- [x] CORS whitelist (not `*`)
- [x] SQL injection impossible (Prisma parameterizes everything)
- [x] Input validation on every endpoint (Zod)
- [x] Ownership checks on update/delete (403 for other users' issues)
- [x] Stack traces never leaked to clients in production
- [x] Non-root user in Docker image

## What to Build Next

- WebSocket channel for real-time issue updates across tabs
- Audit log per issue (who changed what, when)
- Role-based access (admin / reporter / viewer)
- File attachments via S3 presigned URLs
- Password reset flow with time-limited email tokens
- Swagger UI at `/api-docs`
- Vitest unit tests for service layer

## License

MIT
