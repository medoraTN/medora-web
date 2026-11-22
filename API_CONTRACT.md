# API Contract — Medora Backend

**Sources of Truth:** This contract and `SPECDOC`. Always cross-check endpoint behavior, edge cases, and business rules against `SPECDOC` before implementing frontend features.

---

## Base URL and Authentication

- **Local default base URL:** `http://localhost:3000`
- **API prefix:** `/api`
- **Content-Type:** Send JSON request bodies with `Content-Type: application/json`.
- **Protected endpoints:** Require `Authorization: Bearer <token>`.
- **JWT & Login:** Login is public. The API issues JWTs using `HS256`; token expiry is configured by the backend.

---

## Roles

Supported roles: `ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR`.

| Endpoint | Allowed roles |
| :--- | :--- |
| `POST /api/auth/login` | Public |
| `GET /api/auth/me` | Any authenticated role |
| `POST /api/patients` | `ADMIN`, `ADMIN_STAFF` |
| `GET /api/patients` | `ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR` |
| `GET /api/patients/:id` | `ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR` |
| `PATCH /api/patients/:id/status` | `ADMIN`, `MEDICAL` |

---

## Authentication

### `POST /api/auth/login`

Public endpoint. Both `email` and `password` are required. `email` is trimmed and matched case-insensitively.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Success (`200 OK`):**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Sam",
    "lastName": "Example",
    "role": "MEDICAL"
  }
}
```

- Sets `Cache-Control: no-store`.
- Never returns the password or password hash.
- Invalid credentials, unknown email, and inactive account all return `401 INVALID_CREDENTIALS`.
- Invalid request data returns `400 VALIDATION_ERROR`.

---

### `GET /api/auth/me`

Requires a valid bearer token (`Authorization: Bearer <token>`).

**Success (`200 OK`):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Sam",
    "lastName": "Example",
    "role": "MEDICAL"
  }
}
```

- Missing, invalid, expired, or unusable authentication returns `401 UNAUTHENTICATED`.

---

## Patient Data

### Patient Object Shape

Patient response objects contain:
```json
{
  "id": "patient-id",
  "recordNumber": "D-1001",
  "firstName": "Alex",
  "lastName": "Patient",
  "dateOfBirth": "1990-05-17T00:00:00.000Z",
  "sex": "UNKNOWN",
  "phone": "+33123456789",
  "address": null,
  "arrivalReason": "Fever",
  "urgencyLevel": 2,
  "status": "WAITING",
  "internalNotes": null,
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

- Dates are returned as JSON date-time strings.
- `address` and `internalNotes` may be `null`.
- `sex` is one of: `FEMALE`, `MALE`, `OTHER`, `UNKNOWN`.
- **The eight patient statuses are:**
  `WAITING`, `IN_PROGRESS`, `IN_EXAMINATION`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `DISCHARGED`, `TRANSFERRED`, `CANCELLED`.

---

### `POST /api/patients`

Requires `ADMIN` or `ADMIN_STAFF`.

**Request:**
```json
{
  "recordNumber": "D-1001",
  "firstName": "Alex",
  "lastName": "Patient",
  "dateOfBirth": "1990-05-17",
  "sex": "UNKNOWN",
  "phone": "+33123456789",
  "address": null,
  "arrivalReason": "Fever",
  "urgencyLevel": 2,
  "internalNotes": null
}
```

- **Required fields:** `recordNumber`, `firstName`, `lastName`, `dateOfBirth`, `phone`, `arrivalReason`, `urgencyLevel`.
- **Optional / default fields:** `sex` is optional and defaults to `UNKNOWN`. `address` and `internalNotes` are optional and nullable.
- **Server-assigned fields:** The API assigns `status: "WAITING"` and generates `id`, `createdAt`, and `updatedAt`.
- **Strict payload:** Unknown request fields are rejected.

**Success (`201 Created`):**
```json
{
  "patient": {
    "id": "patient-id",
    "recordNumber": "D-1001",
    "firstName": "Alex",
    "lastName": "Patient",
    "dateOfBirth": "1990-05-17T00:00:00.000Z",
    "sex": "UNKNOWN",
    "phone": "+33123456789",
    "address": null,
    "arrivalReason": "Fever",
    "urgencyLevel": 2,
    "status": "WAITING",
    "internalNotes": null,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

- Invalid fields return `400 VALIDATION_ERROR` with field details.
- Duplicate `recordNumber` or `phone` returns `409 CONFLICT`.

---

### `GET /api/patients`

Requires any authenticated role (`ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR`).

**Query parameters:**
- `page`: integer greater than or equal to `1` (default: `1`)
- `pageSize`: integer from `1` to `100` (default: `20`)
- `search`: optional string, maximum `100` characters
- `status`: optional one of the eight patient statuses

**Behavior:**
- `search` matches first name, last name, dossier/record number, or phone.
- Name and dossier/record number matches are case-insensitive; phone matching is a substring search.
- Results are ordered by last name, first name, then ID.
- Unknown query parameters are rejected.
- Invalid query data returns `400 VALIDATION_ERROR`.

**Success (`200 OK`):**
```json
{
  "items": [
    {
      "id": "patient-id",
      "recordNumber": "D-1001",
      "firstName": "Alex",
      "lastName": "Patient",
      "dateOfBirth": "1990-05-17T00:00:00.000Z",
      "sex": "UNKNOWN",
      "phone": "+33123456789",
      "address": null,
      "arrivalReason": "Fever",
      "urgencyLevel": 2,
      "status": "WAITING",
      "internalNotes": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### `GET /api/patients/:id`

Requires any authenticated role (`ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR`).

**Success (`200 OK`):**
```json
{
  "patient": {
    "id": "patient-id",
    "recordNumber": "D-1001",
    "firstName": "Alex",
    "lastName": "Patient",
    "dateOfBirth": "1990-05-17T00:00:00.000Z",
    "sex": "UNKNOWN",
    "phone": "+33123456789",
    "address": null,
    "arrivalReason": "Fever",
    "urgencyLevel": 2,
    "status": "WAITING",
    "internalNotes": null,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

- Unknown patient ID returns `404 NOT_FOUND`.

---

### `PATCH /api/patients/:id/status`

Requires `ADMIN` or `MEDICAL`.

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

- The body must contain exactly one valid status value.

**Success (`200 OK`):**
```json
{
  "patient": {
    "id": "patient-id",
    "recordNumber": "D-1001",
    "firstName": "Alex",
    "lastName": "Patient",
    "dateOfBirth": "1990-05-17T00:00:00.000Z",
    "sex": "UNKNOWN",
    "phone": "+33123456789",
    "address": null,
    "arrivalReason": "Fever",
    "urgencyLevel": 2,
    "status": "IN_PROGRESS",
    "internalNotes": null,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:05:00.000Z"
  }
}
```

- Invalid or missing status returns `400 VALIDATION_ERROR`.
- A disallowed workflow transition returns `409 INVALID_STATUS_TRANSITION`.
- A patient that does not exist returns `404 NOT_FOUND`.
- Status history is persisted by the backend but is not included in this response.

**Implemented Status Transitions:**
- `WAITING` $\rightarrow$ `IN_PROGRESS`, `TRANSFERRED`, or `CANCELLED`
- `IN_PROGRESS` $\rightarrow$ `IN_EXAMINATION`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, or `CANCELLED`
- `IN_EXAMINATION` $\rightarrow$ `IN_PROGRESS`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, or `CANCELLED`
- `WAITING_RESULT` $\rightarrow$ `IN_PROGRESS`, `IN_EXAMINATION`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, or `CANCELLED`
- `READY_FOR_DISCHARGE` $\rightarrow$ `IN_PROGRESS`, `DISCHARGED`, or `TRANSFERRED`
- `DISCHARGED`, `TRANSFERRED`, and `CANCELLED` are terminal states.

---

## Error Response Format

Errors use this envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Données invalides.",
    "details": [
      { "field": "email", "message": "Adresse e-mail invalide." }
    ]
  }
}
```

- `details` is optional and contains `{ "field", "message" }` entries when validation errors identify fields.

| HTTP status | Error code | Meaning |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Request body, parameter, or query validation failed |
| `400` | `BAD_REQUEST` | Malformed JSON |
| `401` | `UNAUTHENTICATED` | Missing or invalid bearer token |
| `401` | `INVALID_CREDENTIALS` | Login credentials invalid, account missing, or account inactive |
| `403` | `FORBIDDEN` | Authenticated role cannot access the endpoint |
| `404` | `NOT_FOUND` | Route or patient not found |
| `409` | `CONFLICT` | Duplicate patient dossier number or phone |
| `409` | `INVALID_STATUS_TRANSITION` | Requested patient status transition is disallowed |
| `413` | `PAYLOAD_TOO_LARGE` | Oversized request body |
| `500` | `INTERNAL_ERROR` | Other unexpected failures |

---

## Notes & SPECDOC Alignment

Cross-check any incomplete notes here (such as any additional `GET /api/patients` behavior) directly against `SPECDOC` and update this file whenever new backend endpoints or rules are merged.