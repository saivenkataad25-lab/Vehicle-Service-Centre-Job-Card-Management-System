# Phase 7 Test Matrix

Run date: 2026-11-27
Base URL: `http://localhost:8080/api`
UI URL: `http://localhost:4200/`
Full machine-readable transcript: `docs/evidence/test-results.txt`
Reproducible API script: `npm run test:api` (`scripts/api-tests.mjs`)
Browser workflow script: `npm run test:e2e` (`scripts/evidence/e2e-smoke.mjs`)
Screenshots: `docs/evidence/`

| ID | Prerequisites | Action | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| T01 | Running API and unique test customer code | Create customer, read it, edit address, read again | `201/200/200/200`; updated address persists | `201/200/200/200`; address `2 Updated Road` | Pass | `07-api.png`, `05-update.png` |
| T02 | Customer from T01 | Add vehicle to that customer, update odometer, read again | Relationship and odometer persist | `201/200/200/200`; `customerId=10`, odometer `12500` | Pass | `07-api.png` |
| T03 | Vehicle from T02 | Register second vehicle with same registration | Duplicate rejected | `409`: `Vehicle registration number already exists` | Pass | `07-api.png` |
| T04 | Customer from T01 | Create vehicle with customer id `999999999` | Rejected with clear message | `404`: `Customer not found with id 999999999` | Pass | `07-api.png` |
| T05 | Vehicle from T02 | Create and confirm booking | Booking shows correct vehicle details | `201/200`; registration `API-496059` | Pass | `07-api.png`, `02-dashboard.png` |
| T06 | Confirmed booking from T05 | Create job card, then create another for same booking | First succeeds, second rejected | First `201`; second `409`: booking is no longer `CONFIRMED` | Pass | `07-api.png`, `06-status.png` |
| T07 | Available and unavailable technicians; extra booking | Assign each technician to a new job card | Available accepted, unavailable rejected | Available `201`; unavailable `409`: `Unavailable technician cannot be newly assigned` | Pass | `07-api.png` |
| T08 | Job card from T06 | Add task with `1.5` hours at `40`; attempt negative hours | Backend estimate `60.00`; negative rejected | Estimate `60`; negative `400` | Pass | `07-api.png` |
| T09 | Open job card from T06 | `OPEN → IN_PROGRESS`, invalid `→ DELIVERED`, `→ ON_HOLD`, `→ IN_PROGRESS` | Allowed `200`; invalid `409` | `200/409/200/200` | Pass | `07-api.png`, `06-status.png` |
| T10 | Job card in `IN_PROGRESS` | Complete without notes, with notes, then deliver | Without notes `409`; completion and delivery `200` | `409/200/200`; `completedAt=true`, `deliveredAt=true` | Pass | `07-api.png`, `06-status.png` |
| T11 | Delivered job card from T10 | Delete job card | `409 Conflict` | `409`: `Completed or delivered job card cannot be deleted` | Pass | `07-api.png` |
| T12 | Linked customer, vehicle, technician from T01/T02/T06 | Delete each linked master record | All `409`; dependents retained | `409/409/409`; counts unchanged at `7/12/9` | Pass | `07-api.png`, `08-database.png` |
| T13 | Spring Boot restarted after T01–T12 | Run `npm run test:api -- verify` | Completed job survives restart with notes and `completedAt` | `200`; found `true`, notes `true`, `completedAt=true` | Pass | `07-api.png` |
| T14 | Overdue, upcoming, and completed jobs present | Read dashboard summary, status counts, delayed/upcoming jobs, completed report | All endpoints `200` with live data | `200/200/200/200/200`; current job in report `true` | Pass | `02-dashboard.png`, `07-api.png` |
| T15 | Running API | POST customer with 9, 11, and 10 digit phones | 9/11 rejected; 10 accepted and cleaned up | `400/400/201`; cleanup `204` | Pass | `07-api.png`, `03-create.png` |
| T16 | MySQL, backend, Angular dev server running | Complete workflow through UI: customer → vehicle → booking → job card → completion → reports | Entire workflow works with no mock data | `E2E_SMOKE_OK customer=17 vehicle=16 booking=23 job=15 jobNumber=JC-2026-0014` | Pass | `03-create.png`, `04-read.png`, `05-update.png`, `06-status.png`, `07-api.png` |
| T17 | Running API | POST customer with letters in phone | Rejected by validation | `400`: validation message | Pass | `07-api.png` |
| T18 | Existing booking | Cancel it, then try to confirm it again | Cancel `200`; reactivation `409` | `200/409`: cancelled booking cannot be changed | Pass | `07-api.png` |
| T19 | New job card | Start, complete, attempt reopen/edit, then deliver | `200/200/409/409/200` | reopen and note edit blocked; delivery allowed | Pass | `07-api.png` |
| T20 | New confirmed booking | Create job card with promised date before opened date | Rejected | `409`: `Promised date cannot be earlier than opened date` | Pass | `07-api.png` |

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

## Additional verification evidence

| Evidence | File / command |
|---|---|
| Newman run of the Postman collection (42 requests, 40 assertions, 0 failures) | `docs/evidence/newman-run.txt`; `npm run evidence:newman` |
| Clean checkout setup, build, and API verification | `docs/evidence/clean-start.txt` |
| Executed database constraint failures | `docs/evidence/database-constraints.txt`; `scripts/evidence/database-constraints.sql` |
| Evidence page generation | `npm run evidence:pages` |
| Screenshot generation | `npm run evidence:screenshots` |
| Browser workflow smoke | `npm run test:e2e` |

The Postman collection for evidence item 7 is `docs/postman_collection.json`. The same checks are runnable with `npm run test:api`.
