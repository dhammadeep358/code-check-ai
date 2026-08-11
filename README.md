# AI-Powered Code Review Assistant

A full-stack cybersecurity web application. A user logs in, uploads or pastes
source code, and receives an automated review combining **deterministic
static security checks** with **AI-generated explanations and
recommendations**, plus security/quality scores and saved review history.

Uploaded/pasted source code is treated as **untrusted text and is never
executed**.

## Stack

| Component      | Technology                  |
|-----------------|------------------------------|
| Frontend        | React + Vite                 |
| Backend         | Node.js + Express             |
| Database        | MongoDB (Mongoose)            |
| AI              | OpenRouter (swappable for OpenAI) |
| Authentication  | JWT + bcryptjs                |
| Upload          | Multer                        |
| Testing         | Browser + Postman             |

## Project structure

```
AI-Code-Review-Assistant/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/{authController,reviewController}.js
│   │   ├── middleware/{authMiddleware,errorMiddleware,upload}.js
│   │   ├── models/{User,Review}.js
│   │   ├── routes/{authRoutes,reviewRoutes}.js
│   │   ├── services/{aiService,reviewService,staticAnalyzer,scoringService}.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, ProtectedRoute, FindingCard, ScoreBadge)
│   │   ├── pages/ (Login, Register, Dashboard, NewReview, ReviewReport, History)
│   │   ├── services/api.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx, main.jsx
│   │   └── index.css
│   └── package.json
├── README.md
├── API_DOCUMENTATION.md
├── POSTMAN_TESTING.md
└── .gitignore
```

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a MongoDB instance)
- An [OpenRouter](https://openrouter.ai) API key (optional — the app still
  works with static-only results if this is not configured)

## 2. Setup

### Backend

```bash
cd backend
cp .env.example .env
# edit .env and fill in JWT_SECRET and OPENROUTER_API_KEY
npm install
npm run dev        # or: npm start
```

Expected output:
```
Server running on http://localhost:5000
MongoDB Connected Successfully
```

### Frontend

```bash
cd frontend
cp .env.example .env   # optional, defaults to http://localhost:5000/api
npm install
npm run dev
```

Open the URL Vite prints — normally **http://localhost:5173**.

## 3. Using the app

1. Register a new account.
2. Log in.
3. Go to **New Review** → paste code or upload a source file.
4. Click **Review Code** and wait for the report.
5. View the report: scores, risk level, findings (with explanation,
   recommendation, and suggested fix per finding).
6. Refresh the browser and open **History** — the review persists in MongoDB.

## 4. Security notes

- `OPENROUTER_API_KEY` lives only in `backend/.env` and is never sent to the
  frontend.
- Passwords are hashed with bcrypt; hashes are never returned by the API.
- All `/api/review/*` routes require a valid JWT and only return the
  requesting user's own reviews.
- Uploaded files are validated by extension and size, stored under a random
  server-generated filename, read as text, and deleted from disk immediately
  after being read — **never executed**.
- The AI provider is called through a single `generateCodeReview()` function
  (`backend/src/services/aiService.js`), so swapping providers later (e.g. to
  OpenAI) means writing a new provider module, not touching controllers or
  the frontend.

## 5. Switching AI provider (OpenRouter → OpenAI)

Keep the interface `generateCodeReview({ language, fileName, code,
staticFindings })` identical. Create
`backend/src/services/ai/openaiProvider.js` with the same return shape
(`{ ok: true, data }` or `{ ok: false, reason }`) and swap the import inside
`reviewService.js`. No other file needs to change.

## 6. Deploying to Netlify (serverless)

The project already contains everything needed:

```
netlify.toml                  ← build + redirect config (repo root)
netlify/functions/api.js      ← Express app wrapped with serverless-http
netlify/package.json          ← deps for the function bundle
```

How it works: Netlify builds `frontend/` as a static site and deploys
`netlify/functions/api.js` as one serverless function. `netlify.toml`
rewrites `/api/*` → that function, so the frontend keeps calling `/api/...`
exactly as it does locally — no frontend code changes needed.

**Steps**

1. Push this repo to GitHub (`backend/`, `frontend/`, `netlify/`, and
   `netlify.toml` all at the same repo root — don't restructure).
2. In Netlify: **Add new site → Import from Git** → pick the repo. Netlify
   will read `netlify.toml` automatically (base `frontend`, publish
   `frontend/dist`, functions in `../netlify/functions`).
3. **Site settings → Environment variables**, add:
   ```
   MONGODB_URI=<your Atlas connection string>
   JWT_SECRET=<your generated secret>
   JWT_EXPIRES_IN=7d
   OPENROUTER_API_KEY=<your key>
   OPENROUTER_MODEL=deepseek/deepseek-r1-0528
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   FRONTEND_URL=https://<your-site-name>.netlify.app
   ```
   Do **not** set `VITE_API_BASE_URL` — leaving it unset makes the frontend
   call same-origin `/api`, which the redirect handles.
4. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0` (Netlify
   functions run on rotating IPs, so a fixed IP allow-list won't work).
5. Deploy. Netlify runs `npm run build` in `frontend/`, publishes
   `frontend/dist`, and bundles `netlify/functions/api.js` (with
   `netlify/package.json`'s dependencies) into a Lambda function.
6. Visit your `*.netlify.app` URL — register, log in, and run a review to
   confirm the function, redirects, and Atlas connection all work.

**Notes specific to serverless:**
- File uploads use `multer.memoryStorage()` (already configured) since
  serverless functions have a read-only filesystem — the file is read
  straight from an in-memory buffer, never written to disk.
- MongoDB connections are reused across warm invocations
  (`ensureDbConnection()` in `api.js`) instead of reconnecting per request.
- Local development is unaffected — `backend/` still runs standalone via
  `npm run dev` exactly as before; `netlify/functions/api.js` just re-uses
  the same `backend/src` routes/controllers/services.

## 7. Troubleshooting

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) and
[`POSTMAN_TESTING.md`](./POSTMAN_TESTING.md), and the table below.

| Error | Fix |
|---|---|
| `Cannot GET /api/auth/login` | Login is a POST route — use Postman or the frontend form, not a browser address bar. |
| Multer `Unexpected field` | The form-data key must be exactly `codeFile`. |
| `401` from AI provider | Check `OPENROUTER_API_KEY` in `backend/.env` and restart the server. |
| `404` model unavailable | Change `OPENROUTER_MODEL` to a model your account can access. |
| `429` quota exceeded | Switch model/provider or wait for quota reset. The static scanner result is still returned. |
| MongoDB connection error | Ensure MongoDB is running and `MONGODB_URI` is correct. |
| Frontend can't reach backend | Check `VITE_API_BASE_URL` and the backend's `FRONTEND_URL` (CORS). |
| `.env` change not applied | Restart the backend process after editing `.env`. |

## Definition of done (verified)

- [x] MongoDB connects successfully
- [x] Backend starts without errors
- [x] Frontend starts without errors
- [x] Register and login work
- [x] JWT protects review APIs
- [x] File upload works using field `codeFile`
- [x] Pasted code review works
- [x] Static findings are generated deterministically
- [x] AI review works when provider key/quota is valid
- [x] Provider errors are handled cleanly (graceful degradation to static-only)
- [x] Security and quality scores are shown
- [x] Review is saved to MongoDB
- [x] History works after refresh
- [x] Individual report works
- [x] No API key is exposed in frontend
- [x] No uploaded code is executed
