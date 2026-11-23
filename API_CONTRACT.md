# Medora API Contract

## Base URL and Request Conventions

- **Local API base URL:** `http://localhost:3000`
- **API prefix:** `/api`
- **Frontend local origin allowed by default:** `http://localhost:4200`
- Send JSON bodies with `Content-Type: application/json`.
- Protected endpoints require `Authorization: Bearer <token>`.
- The API accepts JSON bodies up to **10 KB**.
- Dates in JSON responses are **ISO 8601** strings.

> **Note:** The deployed base URL is environment-specific; this repository does not define it.

---

## Roles and Authorization

### Roles
- `ADMIN`
- `MEDICAL`
- `ADMIN_STAFF`
- `SUPERVISOR`

### Endpoint Access Matrix

| Endpoint | Access |
| :--- | :--- |
| `POST /api/auth/login` | Public |
| `GET /api/auth/me` | Any authenticated, active user |
| `POST /api/patients` | `ADMIN`, `ADMIN_STAFF` |
| `GET /api/patients`, `GET /api/patients/:id` | All four roles |
| `PATCH /api/patients/:id/status` | `ADMIN`, `MEDICAL` |
| `POST /api/reservations`, `PATCH /api/reservations/:id`, `DELETE /api/reservations/:id` | `ADMIN`, `ADMIN_STAFF`, `MEDICAL` |
| `GET /api/reservations` | All four roles |
| All `/api/users` endpoints | `ADMIN` only |

> Every protected request checks the user’s current active state and role from the backend. Deactivation or a role change therefore takes effect immediately for existing JWTs as well.

---

## Authentication

### `POST /api/auth/login`
Public endpoint.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "user-password"
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

- Invalid credentials, unknown accounts, and inactive accounts return `401 INVALID_CREDENTIALS` with the same response.
- Invalid input returns `400 VALIDATION_ERROR`.
- The response sets `Cache-Control: no-store`.

---

### `GET /api/auth/me`
Requires a bearer token (`Authorization: Bearer <token>`).

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

- A missing/invalid token or inactive/deleted account returns `401 UNAUTHENTICATED`.

---

## Patients

### Patient Object
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

- **`sex`:** `FEMALE`, `MALE`, `OTHER`, `UNKNOWN`.
- **`address` and `internalNotes`:** May be `null`.
- **`status`:** `WAITING`, `IN_PROGRESS`, `IN_EXAMINATION`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `DISCHARGED`, `TRANSFERRED`, `CANCELLED`.

---

### `POST /api/patients`
Requires `ADMIN` or `ADMIN_STAFF`.

- **Required fields:** `recordNumber`, `firstName`, `lastName`, `dateOfBirth`, `phone`, `arrivalReason`, `urgencyLevel`.
- **Optional fields:** `sex`, `address`, `internalNotes`.
- `sex` defaults to `UNKNOWN`.
- `status` is assigned as `WAITING` by the backend and must not be sent.

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

**Success (`201 Created`):**
```json
{
  "patient": { "...": "patient object" }
}
```

- `dateOfBirth` must be `YYYY-MM-DD` and cannot be in the future.
- `phone` must contain at least six digits and may use `+`, spaces, parentheses, periods, or hyphens.
- `recordNumber` and `phone` are unique; duplicates return `409 CONFLICT`.

---

### `GET /api/patients`
Requires any authenticated role.

**Query Parameters:**
- `page`: integer $\ge 1$; default `1`
- `pageSize`: integer $1$–$100$; default `20`
- `search`: optional; partial matching across `firstName`, `lastName`, `recordNumber`, and `phone`
- `status`: optional patient status

> Unknown query parameters are rejected (`400 VALIDATION_ERROR`).

**Success (`200 OK`):**
```json
{
  "items": [{ "...": "patient object" }],
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
Requires any authenticated role.

**Success (`200 OK`):**
```json
{
  "patient": { "...": "patient object" }
}
```

- Missing patient returns `404 NOT_FOUND`.

---

### `PATCH /api/patients/:id/status`
Requires `ADMIN` or `MEDICAL`.

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Success (`200 OK`):**
```json
{
  "patient": { "...": "updated patient object" }
}
```

- Invalid status returns `400 VALIDATION_ERROR`.
- Missing patient returns `404 NOT_FOUND`.
- Disallowed transition returns `409 INVALID_STATUS_TRANSITION`.

**Allowed Status Transitions:**
- `WAITING` $\rightarrow$ `IN_PROGRESS`, `TRANSFERRED`, `CANCELLED`
- `IN_PROGRESS` $\rightarrow$ `IN_EXAMINATION`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, `CANCELLED`
- `IN_EXAMINATION` $\rightarrow$ `IN_PROGRESS`, `WAITING_RESULT`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, `CANCELLED`
- `WAITING_RESULT` $\rightarrow$ `IN_PROGRESS`, `IN_EXAMINATION`, `READY_FOR_DISCHARGE`, `TRANSFERRED`, `CANCELLED`
- `READY_FOR_DISCHARGE` $\rightarrow$ `IN_PROGRESS`, `DISCHARGED`, `TRANSFERRED`
- `DISCHARGED`, `TRANSFERRED`, and `CANCELLED` are **terminal**.

---

## Reservations

A reservation represents a single service/prestation. `practitioner` and `examination` are optional.

### Reservation Object
```json
{
  "id": "reservation-id",
  "patientId": "patient-id",
  "service": "Imaging",
  "practitioner": "Dr Example",
  "examination": "X-ray",
  "scheduledAt": "2026-12-01T09:00:00.000Z",
  "durationMinutes": 30,
  "status": "PENDING",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

- **Statuses:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

---

### `POST /api/reservations`
Requires `ADMIN`, `ADMIN_STAFF`, or `MEDICAL`.

- **Required:** `patientId`, `service`, `scheduledAt`, `durationMinutes`.
- **Optional and nullable:** `practitioner`, `examination`.
- `scheduledAt` must be an ISO 8601 date-time with a timezone and must be in the future.
- `durationMinutes` must be a positive integer.
- The backend sets `status` to `PENDING`.

**Request:**
```json
{
  "patientId": "patient-id",
  "service": "Imaging",
  "practitioner": "Dr Example",
  "examination": "X-ray",
  "scheduledAt": "2026-12-01T09:00:00.000Z",
  "durationMinutes": 30
}
```

**Success (`201 Created`):**
```json
{
  "reservation": { "...": "reservation object" }
}
```

- Invalid fields or a past schedule return `400 VALIDATION_ERROR`.
- An unknown patient returns `404 NOT_FOUND`.

---

### `GET /api/reservations`
Requires any authenticated role.

**Optional Query Filters:**
- `date=YYYY-MM-DD`: filters the UTC calendar day
- `status`: reservation status (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`)
- `patientId`: patient ID

**Success (`200 OK`):**
```json
{
  "items": [{ "...": "reservation object" }]
}
```

> This endpoint currently does not return pagination.

---

### `PATCH /api/reservations/:id`
Requires `ADMIN`, `ADMIN_STAFF`, or `MEDICAL`.

- Send one or more of: `service`, `practitioner`, `examination`, `scheduledAt`, `durationMinutes`, `status`.
- `patientId` cannot be changed.
- At least one field is required.
- A provided `scheduledAt` must be a future ISO 8601 date-time with a timezone.

**Request:**
```json
{
  "scheduledAt": "2026-12-01T10:00:00.000Z",
  "status": "CONFIRMED"
}
```

**Success (`200 OK`):**
```json
{
  "reservation": { "...": "updated reservation object" }
}
```

- Missing reservation returns `404 NOT_FOUND`.
- Invalid status transitions or edits to terminal reservations return `409 INVALID_RESERVATION_TRANSITION`.

**Allowed Status Transitions:**
- `PENDING` $\rightarrow$ `CONFIRMED` or `CANCELLED`
- `CONFIRMED` $\rightarrow$ `CANCELLED` or `COMPLETED`
- `CANCELLED` and `COMPLETED` are **terminal**.

---

### `DELETE /api/reservations/:id`
Requires `ADMIN`, `ADMIN_STAFF`, or `MEDICAL`. Performs a **soft cancellation**; it does not delete the reservation row.

**Success (`200 OK`):**
```json
{
  "reservation": { "...": "reservation object with status: CANCELLED" }
}
```

- Repeating cancellation returns the already-cancelled reservation (`200 OK`).
- Cancelling a `COMPLETED` reservation returns `409 INVALID_RESERVATION_TRANSITION`.
- Missing ID returns `404 NOT_FOUND`.

---

## User Administration

All `/api/users` endpoints require an active `ADMIN` account. User responses never include `passwordHash`.

### User Object
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "Sam",
  "lastName": "Example",
  "role": "MEDICAL",
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

---

### `GET /api/users`
Requires `ADMIN`.

**Query Parameters:**
- `page`: integer $\ge 1$; default `1`
- `pageSize`: integer $1$–$100$; default `20`
- `search`: optional partial match on `email`, `firstName`, or `lastName`
- `role`: optional user role (`ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR`)
- `isActive`: optional literal `true` or `false`

**Success (`200 OK`):**
```json
{
  "items": [{ "...": "user object" }],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### `POST /api/users`
Requires `ADMIN`. Creates an active account.

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "Sam",
  "lastName": "Example",
  "role": "MEDICAL",
  "password": "initial-password"
}
```

- `email` is trimmed and lowercased.
- `password` length must be $1$–$128$ characters; the backend hashes it with `scrypt`.

**Success (`201 Created`):**
```json
{
  "user": { "...": "user object" }
}
```

- Duplicate email returns `409 CONFLICT`.

---

### `PATCH /api/users/:id/role`
Requires `ADMIN`.

**Request:**
```json
{
  "role": "ADMIN_STAFF"
}
```

**Success (`200 OK`):**
```json
{
  "user": { "...": "updated user object" }
}
```

- Allowed roles: `ADMIN`, `MEDICAL`, `ADMIN_STAFF`, `SUPERVISOR`.

---

### `PATCH /api/users/:id/status`
Requires `ADMIN`. Activates or deactivates the account.

**Request:**
```json
{
  "isActive": false
}
```

**Success (`200 OK`):**
```json
{
  "user": { "...": "updated user object" }
}
```

- Deactivated users cannot log in, and their existing tokens are rejected immediately.

---

### `POST /api/users/:id/password-reset`
Requires `ADMIN`. Admin-initiated password reset (there is no self-service email recovery flow).

**Request:**
```json
{
  "newPassword": "replacement-password"
}
```

**Success (`200 OK`):**
```json
{
  "user": { "...": "updated user object" }
}
```

- The response does not include password data.

---

### Administrative Safeguards & Auditing
- An administrator cannot demote or deactivate their own account (`409 SELF_MODIFICATION_FORBIDDEN`).
- The backend prevents removal or deactivation of the last active administrator (`409 LAST_ADMIN_REQUIRED`).
- User creation, role changes, activation/deactivation, and password resets are audit-logged; the API does not currently expose an audit-list endpoint.

---

## Error Format

All API errors use the following envelope:

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

> `details` is optional.

### HTTP Status & Error Codes

| HTTP Status | Error Code(s) | Meaning |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Invalid body, path parameter, or query |
| `400` | `BAD_REQUEST` | Malformed JSON |
| `401` | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` | Missing/invalid auth, inactive account, or failed login |
| `403` | `FORBIDDEN` | Authenticated role is not allowed |
| `404` | `NOT_FOUND` | Route, patient, reservation, or user does not exist |
| `409` | `CONFLICTDuplicate patient dossier/phone or user email` | — |
| `409` | `INVALID_STATUS_TRANSITION`, `INVALID_RESERVATION_TRANSITION` | Disallowed patient/reservation status change |
| `409` | `SELF_MODIFICATION_FORBIDDEN`, `LAST_ADMIN_REQUIRED` | Admin safeguard triggered |
| `413` | `PAYLOAD_TOO_LARGE` | Request body exceeds 10 KB |
| `500` | `INTERNAL_ERROR` | Unexpected server error |