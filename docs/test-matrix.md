# Phase 7 Test Matrix

Run date: 2026-11-26
Base URL: `http://localhost:8080/api`
UI URL: `http://localhost:4200/`
Full machine-readable transcript: `docs/evidence/test-results.txt`
Screenshots: `docs/evidence/`

| ID | Prerequisites | Action | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| T01 | Running API and empty test customer code | Create customer, read it, edit address, read again | `201/200/200/200`; updated address persists | Read/edit/read `200`; address `2 Updated Road` | Pass | `07-api.png`, `05-update.png` |
| T02 | Customer from T01 | Add vehicle to that customer, update odometer, read again | Relationship and odometer persist | `201/200/200/200`; `customerId=19`, odometer `12500` | Pass | `07-api.png` |
| T03 | Vehicle from T02 | Register second vehicle with same registration | Duplicate rejected | `409`: `Vehicle registration number already exists` | Pass | `07-api.png` |
| T04 | Customer from T01 | Create vehicle with customer id `999999999` | Rejected with clear message | `404`: `Customer not found with id 999999999` | Pass | `07-api.png` |
| T05 | Vehicle from T02 | Create and confirm booking | Booking shows correct vehicle details | `200`; vehicle `P7-232898`, Toyota Hilux | Pass | `07-api.png`, `02-dashboard.png` |
| T06 | Confirmed booking from T05 | Create job card, then create another for same booking | First succeeds, second rejected | First `JC-2026-0014`; second `409` | Pass | `07-api.png`, `06-status.png` |
| T07 | Available and unavailable technicians; extra booking | Assign each technician to a new job card | Available accepted, unavailable rejected | Available id `10`; unavailable `409` | Pass | `07-api.png` |
| T08 | Job card from T06 | Add task with `1.5` hours at `40`; attempt negative hours | Backend estimate `60.00`; negative rejected | Estimate `60`; negative `400` | Pass | `07-api.png` |
| T09 | Open job card from T06 | `OPEN → IN_PROGRESS`, invalid `→ DELIVERED`, `→ ON_HOLD`, `→ IN_PROGRESS` | Allowed `200`; invalid `409` | `200/409/200/200` | Pass | `07-api.png`, `06-status.png` |
| T10 | Job card in `IN_PROGRESS` | Complete without notes, then with notes | Without notes `409`; with notes `200` | `409` then `200` | Pass | `07-api.png`, `06-status.png` |
| T11 | Completed job card from T10 | Delete job card | `409 Conflict` | `409`: completed/delivered cannot be deleted | Pass | `07-api.png` |
| T12 | Linked customer, vehicle, technician from T01/T02/T06 | Delete each linked master record | All `409`; dependents retained | Customer/vehicle/technician all `409` | Pass | `07-api.png`, `08-database.png` |
| T13 | Spring Boot restarted after phone-rule change | Read pre-restart E2E job and current job from report | Both remain available | `JC-2026-0010` and `JC-2026-0014` present | Pass | `07-api.png` |
| T14 | Jobs in overdue, upcoming, and completed states | Read dashboard summary, status counts, delayed/upcoming jobs, completed report | Counts grew; jobs appear in correct lists | Customers `14→15`, vehicles `16→20`; delayed/upcoming/report all true; 5 status buckets | Pass | `02-dashboard.png`, `07-api.png` |
| T15 | Running API | POST customer with 9, 11, and 10 character phones | 9/11 rejected; 10 accepted | `400/400/201` | Pass | `07-api.png`, `03-create.png` |
| T16 | MySQL, backend, Angular dev server running | Complete workflow through UI: customer → vehicle → booking → job card → completion → reports | Entire workflow works with no mock data | `E2E_SMOKE_OK customer=12 vehicle=13 booking=16 job=11 jobNumber=JC-2026-0010` | Pass | `03-create.png`, `04-read.png`, `05-update.png`, `06-status.png` |

## Required evidence index

| # | Required evidence | File |
|---|---|---|
| 1 | Project setup: Angular and Spring Boot folders/configuration | `docs/evidence/01-setup.png` |
| 2 | Dashboard: navigation, summary cards, status counts, alerts | `docs/evidence/02-dashboard.png` |
| 3 | Create: valid form submission and saved record | `docs/evidence/03-create.png` |
| 4 | Read: searchable list and record details | `docs/evidence/04-read.png` |
| 5 | Update: edited value visible after refresh | `docs/evidence/05-update.png` |
| 6 | Delete/status: valid status change with history | `docs/evidence/06-status.png` |
| 7 | API: GET/POST/PUT/DELETE/status behaviour | `docs/evidence/07-api.png` |
| 8 | Database: tables, sample rows, foreign keys | `docs/evidence/08-database.png` |

The Postman collection for evidence item 7 is `docs/postman_collection.json`.
