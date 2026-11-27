# API Summary

Base path: `http://localhost:8080/api`
Full request/response shapes: `docs/api-contract.md`
Importable Postman collection: `docs/postman_collection.json`

## Endpoints

| Method | Path | Purpose | Key rules |
|---|---|---|---|
| GET | `/customers?search=` | List/search customers | Read-only |
| POST | `/customers` | Create customer | `phone` must be exactly 10 digits |
| GET | `/customers/{id}` | Read one customer | `404` when absent |
| PUT | `/customers/{id}` | Update customer | `phone` must be exactly 10 digits |
| DELETE | `/customers/{id}` | Delete customer | `409` when vehicles exist |
| GET | `/vehicles?customerId=&search=` | List/filter vehicles | Read-only |
| POST | `/vehicles` | Create vehicle | Registration unique; customer must exist |
| GET | `/vehicles/{id}` | Read one vehicle | `404` when absent |
| PUT | `/vehicles/{id}` | Update vehicle | Customer must exist |
| DELETE | `/vehicles/{id}` | Delete vehicle | `409` when bookings exist |
| GET | `/technicians?availabilityStatus=&search=` | List/filter technicians | `AVAILABLE` or `UNAVAILABLE` |
| POST | `/technicians` | Create technician | `phone` must be exactly 10 digits |
| GET | `/technicians/{id}` | Read one technician | `404` when absent |
| PUT | `/technicians/{id}` | Update technician | `phone` must be exactly 10 digits |
| DELETE | `/technicians/{id}` | Delete technician | `409` when assigned to a job card |
| GET | `/service-bookings?status=&vehicleId=` | List/filter bookings | Statuses: `PENDING`, `CONFIRMED`, `CANCELLED`, `CONVERTED` |
| POST | `/service-bookings` | Create booking | Initial status `PENDING` or `CONFIRMED`; preferred date not before booking date |
| GET | `/service-bookings/{id}` | Read one booking | `404` when absent |
| PUT | `/service-bookings/{id}` | Update booking | Cannot set `CONVERTED` directly; cannot edit `CONVERTED` or reactivate `CANCELLED` |
| POST | `/service-bookings/{id}/cancel` | Cancel booking | Only `PENDING`/`CONFIRMED` |
| DELETE | `/service-bookings/{id}` | Delete booking | `409` when job card exists |
| GET | `/job-cards?status=&overdue=&technicianId=` | List/filter job cards | Read-only |
| POST | `/job-cards` | Create job card | Booking must be `CONFIRMED`; one card per booking; promised date not before opened date; technician must be `AVAILABLE` when supplied; backend calculates amounts |
| GET | `/job-cards/{id}` | Read one job card | Includes tasks and status history |
| PUT | `/job-cards/{id}` | Update job/tasks/status | Allowed transitions only; `COMPLETED` requires notes and only allows delivery; `DELIVERED` cannot be edited |
| DELETE | `/job-cards/{id}` | Delete job card | `409` for `COMPLETED`/`DELIVERED`; booking returns to `CONFIRMED` |
| GET | `/dashboard/summary` | Counts and overdue/upcoming totals | Derived from MySQL |
| GET | `/dashboard/job-status-counts` | Counts for all five statuses | Includes zero counts |
| GET | `/dashboard/delayed-jobs` | Overdue open jobs | `promisedDate < today`, not completed/delivered |
| GET | `/dashboard/upcoming-jobs` | Upcoming open jobs | `promisedDate >= today`, not completed/delivered |
| GET | `/reports/completed-job-cards` | Completed/delivered jobs | No query parameters; filter client-side |

## Status transitions

`OPEN → IN_PROGRESS | ON_HOLD`
`IN_PROGRESS → ON_HOLD | COMPLETED`
`ON_HOLD → IN_PROGRESS`
`COMPLETED → DELIVERED`
`DELIVERED → none`

## Response conventions

- `200 OK`: successful read/update.
- `201 Created`: successful create.
- `204 No Content`: successful delete.
- `400 Bad Request`: validation failure; `fieldErrors` maps field names to messages.
- `404 Not Found`: missing resource or foreign key.
- `409 Conflict`: invalid workflow/protected deletion/duplicate registration.

Phone validation message: `phone must be exactly 10 digits`.
