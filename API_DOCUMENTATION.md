# API Documentation

Base URL: `http://localhost:5000/api`

All authenticated routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth

### `POST /auth/register`
Register a new user.

**Body**
```json
{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "secret123" }
```

**201 Response**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "fullName": "Jane Doe", "email": "jane@example.com" }
}
```
Errors: `400` missing/invalid fields, `409` email already registered.

### `POST /auth/login`
**Body**
```json
{ "email": "jane@example.com", "password": "secret123" }
```
**200 Response** — same shape as register. `401` on invalid credentials.

### `GET /auth/me` *(auth required)*
Returns the current user's profile (no password hash).

---

## Reviews *(all routes below require auth)*

### `POST /review/upload`
`multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `codeFile` | File | required, ≤ 2MB, source-code extensions only |
| `language` | text | optional override; auto-detected from extension otherwise |

**200 Response** — see "Review object" below.

### `POST /review/code`
`application/json`
```json
{
  "language": "java",
  "fileName": "hello.java",
  "code": "public class Hello { ... }"
}
```
`language` and `fileName` are optional (defaults: auto-detect / `pasted-code.txt`).

### `GET /review`
Returns the caller's review history (no `sourceCode`, for a lightweight list):
```json
{
  "success": true,
  "reviews": [
    { "id": "...", "fileName": "...", "language": "...", "securityScore": 92,
      "qualityScore": 88, "riskLevel": "LOW", "aiStatus": "ok", "createdAt": "..." }
  ]
}
```

### `GET /review/:id`
Returns one full review (see "Review object"). `404` if not found or not owned by caller.

### `DELETE /review/:id`
Deletes one of the caller's reviews. `404` if not found or not owned by caller.

---

## Review object

```json
{
  "id": "665f...",
  "fileName": "hello.java",
  "language": "java",
  "sourceCode": "public class Hello { ... }",
  "securityScore": 92,
  "qualityScore": 88,
  "riskLevel": "LOW",
  "summary": "Overall the code is reasonably safe...",
  "findings": [
    {
      "title": "Hardcoded secret / credential",
      "severity": "HIGH",
      "category": "Security",
      "line": 12,
      "explanation": "...",
      "recommendation": "...",
      "suggestedFix": "...",
      "source": "static"
    }
  ],
  "positivePoints": ["Good input validation on the login endpoint"],
  "nextSteps": ["Move the API key out of source code"],
  "aiStatus": "ok",
  "createdAt": "2026-08-09T10:00:00.000Z"
}
```

`aiStatus` is `"ok"` when the AI model responded successfully, or
`"unavailable"` when the AI provider failed (bad key, model unavailable,
quota exceeded, etc.) — in that case `findings` still contains full static-scan
results.

---

## Health check

### `GET /`
```json
{ "success": true, "message": "AI Code Review Assistant API is running" }
```

## Error shape

All errors:
```json
{ "success": false, "message": "Human-readable message" }
```
