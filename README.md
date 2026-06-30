# Blog Platform — Backend (Node.js + Express + TypeScript + MongoDB)

Standalone REST API, separate from the Next.js frontend/admin panel. Auth uses JWT (stored in an httpOnly cookie, also returned in the response body so it can be used as a Bearer token from a separate frontend like Next.js).

## Setup

```bash
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, CLIENT_URL, ADMIN_REGISTER_SECRET
npm run dev
```

Server runs at `http://localhost:5000`. Health check: `GET /health`.

## Folder structure

```
src/
  config/db.ts          MongoDB connection
  models/                User, Blog, Comment (Mongoose schemas)
  middleware/auth.ts      protect (require login), adminOnly (require admin), optionalAuth
  middleware/errorHandler.ts
  controllers/            business logic
  routes/                 public routes (auth, blogs, comments)
  routes/admin/            admin-only routes (blogs CRUD, comment moderation)
  app.ts                  Express app + middleware wiring
  server.ts               entrypoint
```

## Auth

JWT-based. On register/login, a token is set as an httpOnly cookie (`token`) **and** returned in the JSON response, so any frontend (Next.js, React, mobile) can use either cookie-based auth or `Authorization: Bearer <token>`.

- `role` is `"admin"` or `"user"` on the same `User` model.
- To register as admin, you must pass the correct `adminSecret` (matches `ADMIN_REGISTER_SECRET` in `.env`); otherwise the account is created as a normal `user`.

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/register` | Public | `{ name, email, password, role?, adminSecret? }` |
| POST | `/login` | Public | `{ email, password }` |
| POST | `/logout` | Public | clears cookie |
| GET | `/me` | Logged-in | returns current user |

### Blogs (public) — `/api/blogs`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/?page=&limit=&category=&search=` | Public | Only `published` |
| GET | `/:id` | Public | `_id` or slug; increments views |

### Comments (public) — `/api/comments`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/?blogId=` | Public | Only `approved` comments |
| POST | `/` | Logged-in user | `{ blogId, content }` → created as `pending` |
| DELETE | `/:id` | Admin or comment owner | — |

### Admin Blogs — `/api/admin/blogs`  (all routes require admin JWT)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/?page=&limit=&status=&search=` | Any status (draft + published) |
| POST | `/` | `{ title, excerpt, content, coverImage?, category?, tags?, status? }` |
| GET | `/:id` | Fetch for editing |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Admin Comments — `/api/admin/comments`  (all routes require admin JWT)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/?status=pending` | Moderation queue |
| PATCH | `/:id` | `{ status: "approved" \| "rejected" }` |

## Connecting this to a Next.js frontend

Set `CLIENT_URL` in `.env` to your Next.js app's URL (for CORS). From the frontend, call this API with `credentials: "include"` so the JWT cookie is sent, e.g.:

```ts
fetch("http://localhost:5000/api/blogs", { credentials: "include" });
```

Or store the returned `token` and send it as `Authorization: Bearer <token>` instead.
