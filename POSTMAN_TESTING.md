# Postman Testing Guide

Base URL: `http://localhost:5000/api`

Set up a Postman **Environment** with:
- `baseUrl` = `http://localhost:5000/api`
- `token` = (leave empty — you'll fill this after login)

## Test order

| # | Request | Method + URL | Expected |
|---|---|---|---|
| 1 | Register | `POST {{baseUrl}}/auth/register` | `201 Created`, copy `token` into the `token` env var |
| 2 | Login | `POST {{baseUrl}}/auth/login` | `200`, returns a fresh `token` |
| 3 | Current user | `GET {{baseUrl}}/auth/me` (Bearer `{{token}}`) | `200` |
| 4 | Upload review | `POST {{baseUrl}}/review/upload` (form-data) | `200` + report |
| 5 | Pasted-code review | `POST {{baseUrl}}/review/code` (JSON) | `200` + report |
| 6 | Review history | `GET {{baseUrl}}/review` (Bearer) | `200`, array of reviews |
| 7 | Single review | `GET {{baseUrl}}/review/:id` (Bearer) | `200`, full report |
| 8 | No token | `GET {{baseUrl}}/review` (no header) | `401` |

## Step-by-step

### 1. Register
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```
Copy the `token` field from the response into your Postman environment's `token` variable.

### 2. Login
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Current user
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

### 4. Upload review
```
POST {{baseUrl}}/review/upload
Authorization: Bearer {{token}}
Body → form-data
  Key: codeFile   Type: File   Value: hello.java (or any small source file)
```

### 5. Pasted-code review
```
POST {{baseUrl}}/review/code
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "language": "javascript",
  "fileName": "example.js",
  "code": "const password = 'hardcoded123'; eval(userInput);"
}
```
This sample intentionally trips two static rules (hardcoded secret, `eval`)
so you can confirm findings appear even if the AI provider is not configured.

### 6. Review history
```
GET {{baseUrl}}/review
Authorization: Bearer {{token}}
```

### 7. Single review
```
GET {{baseUrl}}/review/<id from step 5 or 6>
Authorization: Bearer {{token}}
```

### 8. No token (should fail)
```
GET {{baseUrl}}/review
```
(no Authorization header) → expect `401 Not authorized, no token`.

## Notes

- If `OPENROUTER_API_KEY` is not set, review requests still succeed —
  `aiStatus` will be `"unavailable"` and `findings` will contain static-scan
  results only. This confirms graceful degradation.
- To test file-type rejection, try uploading a `.exe` — expect `400`.
- To test size rejection, upload a file over 2MB — expect `400`.
