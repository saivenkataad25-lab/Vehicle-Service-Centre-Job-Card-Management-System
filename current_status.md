# Current Status

Updated: 2026-11-26
Phase: Phase 7 complete
Status: Full stack built, tested, documented, clean-start verified, Hallmark clean, phone rule enforced; commit/push deferred until remote access is supplied

## Quick Handoff
- `current_status.md` is the only status file. The duplicate `current_states.md` has been removed.
- Project root: `/media/kaiser/edrive/vehicle job card management`.
- Full-stack Vehicle Service Centre Job Card Management System: backend/API/database complete and verified; Angular frontend complete and verified.
- Hallmark app-screen frontend uses the supplied dark workshop design with a darker matte-black background.
- MySQL, Spring Boot backend, and Angular dev server are currently running after a full stop/start clean-start verification; PID files are `.tools/backend.pid` and `.tools/frontend.pid` (current PIDs: backend `38674`, frontend `39119`).

## Project Snapshot
- Stack: Angular `22.3.0`, Spring Boot `3.5.16`, Java `21`, Maven `3.9.16`, MySQL `8.4.13`, Node `v24.20.0`, npm `11.19.0`.
- Backend port: `8080`; Angular dev server: `http://localhost:4200`; MySQL: `127.0.0.1:3307`.
- API base path: `/api`. Angular dev server now proxies `/api` to `http://localhost:8080` via `frontend/proxy.conf.json`.
- New shells must run `source scripts/env.sh` before Angular CLI, npm, Maven, or MySQL commands.
- Credentials are in ignored `.env`; never commit `.env` or `.tools/`.
- Scope limits: Angular, not React; real Spring Boot API and MySQL, not JSON Server; max five persistent entities; no auth/security, spare-parts inventory, payments, or insurance claims.

## Backend Complete and Verified
- Phases 0–4 are complete.
- Structure, Git init, scripts, schema, sample data, ER diagram, API contract, controllers, services, repositories, dashboard, and reports are in place.
- `mvn -DskipTests package` passed.
- Backend startup reached `BACKEND_UP`; current backend PID: `38674` after the clean-start restart.
- Master CRUD verification: `CREATE_UPDATE_OK`, `PERSISTENCE_OK`, `DELETE_OK`, final counts `3 5 3`.
- Workflow verification: `WORKFLOW_TEST_OK`, covering confirmed-booking conversion, duplicate job-card `409`, technician availability `409`, task calculations, status transitions, completion notes `409`, protected delete `409`, and booking restore to `CONFIRMED`.
- Dashboard/report verification: `DASHBOARD_REPORT_OK`; summary `3/5/7/5`, overdue `1`, upcoming `2`, status counts `1` each, completed report `2`.
- Important backend fixes already applied:
  - `vehicles.year` changed to `INT UNSIGNED` in `database/schema.sql`, with `docs/er-diagram.md` updated.
  - `JobCardRepository` uses `j.id`, not `j.jobCardId`.
  - Added `MethodArgumentTypeMismatchException` handler to `GlobalExceptionHandler.java`.
- `GET /api/reports/completed-job-cards` returns completed/delivered job cards and has no query parameters; date filtering is done client-side.
- `CustomerRequest.phone` and `TechnicianRequest.phone` now use `@Size(min = 10, max = 10)` with message `phone must be exactly 10 characters`; API verification returned `400` with that `fieldErrors.phone` for both 9- and 11-character values and `201` for 10 characters.

## Frontend Complete and Verified
- Angular scaffold exists at `frontend/`; `ng new` was not rerun.
- `npm install` completed in `frontend/`: `248` packages added, `249` audited, `0 vulnerabilities`.
- Reports screen created at `frontend/src/app/features/reports/reports.component.ts`:
  - `ReportsComponent`, selector `app-reports`.
  - Calls `ApiService.completedReport()`.
  - Filters `openedDate` inclusively with `from`/`to` and `status`; syncs query params `from`, `to`, `status`.
  - Uses table columns for job card link, booking, opened/promised dates, technician, status badge, and estimate.
- Build/template fixes applied:
  - `shared/ui.ts`: `statusFor()` helper, `[attr.data-label]` for responsive table cells, and shared `formatDate()`, `formatDateTime()`, `formatMoney()` helpers.
  - `vehicle-form.component.ts`: `of(null)` for missing vehicle id.
  - `vehicle-detail.component.ts`: `JobCard[]` signal type.
  - Customer/vehicle/technician detail headers wrap projected actions in `<span actions class="page-actions">`.
  - Booking and job-card detail headers were also wrapped in `<span actions ...>`; without this, conditional actions such as "Create job card", "Start work", and "Complete work" were not projected into the page header.
  - `app.ts` no longer references the empty `app.css`; `app.css` was removed.
  - `FormFieldComponent` clears its host `id` so the projected input/select/textarea id is unique and labelable.
- Other integration fixes:
  - Added `frontend/proxy.conf.json` and `serve.options.proxyConfig` in `frontend/angular.json` so `/api` calls reach Spring Boot instead of returning Angular `404`.
  - Job-card list primary action renamed "Convert a booking" to match its `/bookings` destination.
  - Job-card form shows a skeleton while `loading()` is true.
  - Job-card detail and booking detail use shared date/time/money formatting; status history timestamps are formatted instead of raw ISO.
  - Customer and technician phone fields now use `Validators.minLength(10)` plus `Validators.maxLength(10)` and show `Phone must be exactly 10 characters.`; shorter or longer values cannot be submitted.
- `npm --prefix frontend run build` passes cleanly. Final bundle: `main-TCGEPMQS.js` `280.37 kB`, `styles-SQ7MSFHH.css` `18.16 kB`, initial total `298.54 kB`.
- Hallmark bookkeeping complete:
  - `.hallmark/preflight.json` written with scanned date `2026-11-26`.
  - Supplied `Dark Workshop (by request)` theme retained with matte-black background.
  - Obsolete `waive 1` removed; `waive 74` retained in `frontend/src/styles.css`.
  - Picks block published: Screen = workshop job queue across seven routes; Theme = Dark Workshop (by request), matte-black, Inter, one blue signal; Chrome = fixed sidebar + quiet topbar/global search; Signature = status-aware job queue; Material = real API records only, no invented metrics/logos/quotes; Sweep = clean across 17 routes.
  - `.hallmark/log.json` entry logged via `theme.mjs log` with scope `app`, theme `Dark Workshop (by request)`.
- Render dependencies installed in ignored `.tools/`:
  - `puppeteer@25.19.0`; Chrome-for-Testing at `.tools/chrome-cache/chrome/linux-158.0.8127.88/chrome-linux64/chrome`.
  - `.tools/chrome-no-sandbox.sh` wrapper avoids `No usable sandbox!`.
  - Use `HALLMARK_PUPPETEER="$PWD/.tools/node_modules/puppeteer-core"` and `CHROME_PATH="$PWD/.tools/chrome-no-sandbox.sh"` for render sweeps.
- Hallmark `sloplint --render` is clean on all 17 routes: `dashboard`, `customers`, `customers/new`, `customers/1`, `vehicles`, `vehicles/new`, `vehicles/1`, `bookings`, `bookings/new`, `bookings/1`, `job-cards`, `job-cards/new`, `job-cards/1`, `technicians`, `technicians/new`, `technicians/1`, `reports`.
  - Result per route: `sloplint: clean. 0 FAIL, 0 REFLEX, 0 WARN across 3 file(s) and 1 URL(s).`
  - Static Angular templates in `frontend/src` are excluded from lint arguments; sweeping CSS files plus rendered URLs avoids the known `FAIL 49a` static interpolation false positive.
  - Data-driven `REFLEX 49b` wrapped table links and `REFLEX 71` heading spacing were fixed by adding `white-space: nowrap` to `.data-table a` and `margin: var(--space-lg) 0 var(--space-md)` to `.section-heading`.
- Hallmark fresh-context finish review first word was `fix`; all three findings were resolved and scored `3/3`:
  - Misleading "New job card" action → "Convert a booking".
  - Blank job-card form during loading → skeleton state.
  - Raw ISO dates/unformatted estimates in job-card/booking details → shared formatters.
- Live UI end-to-end smoke test passed in Chrome with no mock data and no browser console/page errors:
  - Customer → vehicle → confirmed booking → job card → technician/task/estimate → `OPEN` → `IN_PROGRESS` → `COMPLETED` with notes → refresh persistence → reports with date/status filters → dashboard.
  - Result: `E2E_SMOKE_OK customer=12 vehicle=13 booking=16 job=11 jobNumber=JC-2026-0010`.
  - Script: `.tools/e2e-smoke.mjs` (ignored). E2E test records created during verification remain in the database.
- Phone rule UI verification passed in Chrome via `.tools/phone-check.mjs` (ignored): 9- and 11-character phones were rejected on both customer and technician forms, 10-character phones saved, and the temporary records were deleted.
- Hallmark re-sweep of `/customers/new` and `/technicians/new` after the phone rule change: `sloplint: clean. 0 FAIL, 0 REFLEX, 0 WARN across 3 file(s) and 1 URL(s).`

## Phase 7 Complete and Verified
- `docs/test-matrix.md` maps all 16 requirements tests to expected/actual results, pass status, and evidence files.
- `.tools/phase7-tests.mjs` ran the API matrix; result: `PHASE7_TESTS_DONE 15/15`. Transcript: `docs/evidence/test-results.txt`.
- T16 UI workflow passed through the live Angular app against Spring Boot and MySQL, with no mock data and no browser console/page errors.
- Eight required tracked screenshots exist under `docs/evidence/`:
  - `01-setup.png`, `02-dashboard.png`, `03-create.png`, `04-read.png`, `05-update.png`, `06-status.png`, `07-api.png`, `08-database.png`.
- Evidence support pages were generated from live config/database/API data into `docs/evidence/setup.html`, `docs/evidence/api.html`, and `docs/evidence/database.html`.
- `docs/postman_collection.json` is valid JSON and covers customers, vehicles, technicians, bookings, job cards, dashboard, and reports with collection variables for IDs.
- `docs/api-summary.md` summarizes endpoints, status transitions, response conventions, and the phone rule.
- `README.md` now contains setup, run, build, workflow, troubleshooting, testing, and tool-version sections.
- `frontend/README.md` is project-specific and documents the dev server, proxy, build, screens, and no-mock-data rule.
- `.env.example` uses `VSC_DB_PORT=3307`.
- Clean-start verification performed by stopping frontend, backend, and MySQL, then restarting from README instructions:
  - MySQL socket OK; backend `/api/dashboard/summary` `200`; Angular site `200`; Angular `/api` proxy `200`.
  - Post-restart live UI workflow: `E2E_SMOKE_OK customer=22 vehicle=23 booking=25 job=18 jobNumber=JC-2026-0017`.
  - Post-restart phone validation: `PHONE_UI_CHECK_OK`; 9/11-character phones rejected, 10-character phones accepted, temp records deleted.
- Phase 7 is complete except the explicit commit/push handoff, which requires remote/public-key access and a direct user request.

## GitHub and Vercel Packaging
- `README.md` replaced with a clean GitHub-facing guide; the previous detailed README is preserved as `readme_reference.md`.
- New README covers verified versions, repository structure, dependency setup, database/backend/frontend startup, Vercel deployment, API summary, SQL scripts, ER diagram, test evidence, all eight screenshots, and troubleshooting.
- `dependencies/` is the single setup entry point: `versions.json`, `install.sh`, and `README.md`; runtime binaries remain ignored under `dependencies/runtime/` or `.tools/`.
- Root `package.json` adds `setup`, `db:setup`, `db:start`, `db:stop`, `api`, `api:build`, `web`, and `web:build` scripts.
- `scripts/env.sh` now selects `dependencies/runtime/` when present and falls back to `.tools/`; MySQL scripts use `$VSC_RUNTIME_ROOT`.
- Added `scripts/setup-db.sh`, `vercel.json`, and `api/[...path].js`; Vercel builds the Angular browser output and proxies `/api` to `BACKEND_URL`.
- Packaging verification passed: JSON configs parse, proxy handler returned `proxy=200` against the live backend, Angular build clean, backend build success, shell syntax clean, and a fresh temp `npm ci` added `248` packages.
- Vercel hosts the static Angular UI only; Spring Boot and MySQL must be hosted separately and exposed via `BACKEND_URL`.

## Decisions and Assumptions
- Theme source: `vehicle_service_centre_dark_ui_design.md` at project root.
- Earlier Hallmark Coral theme deal is superseded; do not use Coral.
- Hallmark scope is app screens, not marketing pages; no hero or fold treatment.
- Main background is darker than `#0B1220`, toward matte black, while preserving dark navy workshop direction and contrast roles.
- CSS design tokens only; no literal colours or font families outside the token block.
- No invented metrics, testimonials, logos, counts, eyebrow labels, tracked caps, gradients, glass, neon, oversized rounded cards, decorative dots, or unnecessary motion.
- Accessibility rules kept: instant `:focus-visible`, `overflow-x: clip` on `html`/`body`, reduced-motion fallback, no `transition: all`.
- Existing backend workflow and API contract were preserved without changing endpoints.
- Git push is deferred until full project completion and testing.

## Blockers and Issues
- Git remote/repo URL and public-key setup have not been supplied; no commits have been made.
- No implementation blocker remains; Phase 7 documentation, evidence, and clean-start verification are complete.
- Legacy local DB rows with non-10-character phone values remain (customers `5`, `13`, `14`; technician `5`); the new rule applies to API/UI writes, not historical rows.
- `npm install --prefix .tools puppeteer` warned that install scripts were not approved; Chrome was installed manually instead.
- `.env` and `.tools/` are ignored and must not be committed.

## Where to Continue From
1. Use the clean `README.md` for GitHub/Vercel handoff; `readme_reference.md` is preserved for historical detail.
2. Review `docs/test-matrix.md` and the tracked files in `docs/evidence/`.
3. Supply the Git remote/public key if the work should be pushed.
4. Commit and push only after explicit user request; testing and Phase 7 evidence are complete, but no commit is implied by this status update.

## Key Files
- `requirments.md`: original requirements.
- `plan.md`: phase plan and frontend exit criteria; Phase 5/6 exit conditions met.
- `current_status.md`: this file and the only status handoff.
- `vehicle_service_centre_dark_ui_design.md`: named dark workshop theme source.
- `docs/api-contract.md`: source of truth for API calls.
- `docs/api-summary.md`: concise endpoint/status/response reference.
- `docs/postman_collection.json`: importable API collection.
- `docs/test-matrix.md`: Phase 7 test matrix and evidence index.
- `docs/evidence/`: tracked test transcript, eight required screenshots, and generated evidence pages.
- `README.md`: complete setup, run, build, workflow, troubleshooting, and testing guide.
- `frontend/README.md`: project-specific Angular UI guide.
- `.env.example`: setup template with MySQL port `3307`.
- `readme_reference.md`: previous detailed README preserved by request.
- `dependencies/`: single dependency setup entry point.
- `package.json`: root npm scripts for local setup, database, backend, and frontend.
- `vercel.json` and `api/[...path].js`: Vercel build/routing and API proxy.
- `scripts/setup-db.sh`: database initialization script.
- `frontend/`: active Angular project.
- `frontend/proxy.conf.json`: dev-server proxy for `/api` → `http://localhost:8080`.
- `frontend/angular.json`: `serve.options.proxyConfig`.
- `frontend/src/tokens.css`: Hallmark token block.
- `frontend/src/styles.css`: Hallmark-stamped global stylesheet with final sweep fixes.
- `frontend/src/app/app.routes.ts`: all 17 routes resolve.
- `frontend/src/app/core/api.service.ts`: typed API client.
- `frontend/src/app/shared/ui.ts`: shared components, table labels, and date/time/money formatters.
- `frontend/src/app/features/reports/reports.component.ts`: completed-jobs report with client-side filters.
- `frontend/src/app/features/bookings/booking-detail.component.ts`: projected actions fix and date formatting.
- `frontend/src/app/features/job-cards/job-card-form.component.ts`: loading skeleton and money formatter.
- `frontend/src/app/features/job-cards/job-card-detail.component.ts`: projected actions, formatters, status history.
- `frontend/src/app/features/customers/customer-form.component.ts` and `frontend/src/app/features/technicians/technician-form.component.ts`: exactly-10-character phone validation.
- `.hallmark/preflight.json`, `.hallmark/log.json`, `.hallmark/shots/`: Hallmark records and final screenshots.
- `.tools/e2e-smoke.mjs`, `.tools/phone-check.mjs`, `.tools/phase7-tests.mjs`, `.tools/generate-evidence-pages.mjs`, `.tools/evidence-screenshots.mjs`, `.tools/chrome-no-sandbox.sh`, `.tools/chrome-cache/`: ignored verification tooling.
- `backend/`: completed Spring Boot API.
- `backend/src/main/java/com/vsc/jobcard/dto/request/CustomerRequest.java` and `TechnicianRequest.java`: exactly-10-character phone validation.
- `database/schema.sql` and `database/sample_data.sql`: verified schema and data.
- `scripts/env.sh`: required environment setup.
