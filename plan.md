# Vehicle Service Centre Job Card Management System — Build Plan

## Scope
- Angular frontend, Spring Boot REST backend, MySQL database.
- Five main entities only: customers, vehicles, service_bookings, technicians, job_cards.
- `service_tasks` stored as JSON in `job_cards`.
- `status_history` stored as JSON in `job_cards`.
- No React, JSON Server, authentication, spare-parts inventory, payments, or insurance claims.
- The frontend must be implemented through the Hallmark skill: pre-flight, one material/audience/use/tone ask or inferred defaults, Picks block, themed tokens/base CSS, `sloplint --render` sweep, and finish review.
- The frontend theme is the user-supplied `vehicle_service_centre_dark_ui_design.md`, treated as a named Hallmark theme by request; the main background is darkened slightly toward matte black.
- Hallmark rules apply to the Angular UI: no literal colours or font families outside tokens, no `transition: all`, no animated width/height/top/left, `overflow-x: clip` on `html` and `body`, instant `:focus-visible`, reduced-motion fallbacks, capped centred container, and no invented metrics, testimonials, logos, or case-study counts.
- Credentials stay in environment variables; no secrets in source control.

## Repository Structure
```text
/
  backend/
  frontend/
  database/
  docs/
  plan.md
  current_status.md
  README.md
  .gitignore
```

## Phase 0 — Repository and tooling
Tasks:
- Initialize Git in the project root.
- Create the folder structure above.
- Install/confirm Java 21, Maven, MySQL Server, and Angular tooling.
- Record tool versions in README.
- Add `.gitignore` and environment-variable template.

Exit condition:
- Java, Maven, Node, Angular, and MySQL are available and the repository is ready.

## Phase 1 — Database design
Tasks:
- Create an ER diagram showing customer -> vehicle -> booking -> job-card and technician -> job-card.
- Write `database/schema.sql` with five tables, primary keys, foreign keys, unique constraints, indexes, `DECIMAL(10,2)`, `DATE`, and JSON columns.
- Write `database/sample_data.sql`.
- Test duplicate registration number and invalid foreign-key rejection.

Exit condition:
- A clean database can be created and constraints reject invalid data.

## Phase 2 — Backend foundation and master CRUD
Tasks:
- Generate a Spring Boot 3.x app with MySQL, JPA, and validation dependencies.
- Configure the database connection from environment variables.
- Create entities, enums, repositories, DTOs, services, controllers, and a global exception handler.
- Implement Customer, Vehicle, and Technician CRUD.

Exit condition:
- Customer, Vehicle, and Technician CRUD works through Postman and persists after restart.

## Phase 3 — Service workflow APIs
Tasks:
- Implement ServiceBooking CRUD and booking status rules.
- Create a job card only from an eligible confirmed booking.
- Enforce one job card per booking.
- Allocate or change a technician with availability validation.
- Store task JSON and calculate task amounts and labour estimate server-side.
- Enforce promised-date, completion-note, status-transition, and protected-delete rules.
- Record status transitions in JSON history.

Exit condition:
- The full booking-to-delivery workflow works through Postman without Angular.

## Phase 4 — Dashboard and report APIs
Tasks:
- Implement `/api/dashboard/summary`, `/api/dashboard/job-status-counts`, `/api/dashboard/delayed-jobs`, upcoming promised dates, and `/api/reports/completed-job-cards`.
- Add useful filters for status and overdue queries.
- Test empty results and date boundaries.

Exit condition:
- Dashboard and report values match actual MySQL records.

## Phase 5 — Angular foundation and master screens
Tasks:
- Run the Hallmark pre-flight before UI work and cache it in `.hallmark/preflight.json`.
- Ask once for material, audience, use, and tone, or record inferred defaults when unanswered.
- Use `vehicle_service_centre_dark_ui_design.md` as the named theme by request; skip the catalog theme deal and publish an app-screen Picks block with the matte-black background adjustment.
- Scaffold `tokens.css` and `base.css` with Hallmark, put the stamp and critique line at the top of the CSS source, and log the build in `.hallmark/log.json`.
- Generate an Angular app with routing and typed models.
- Add HttpClient services per resource.
- Build a clean layout, navigation, data table, form field, status badge, and confirmation dialog using the Hallmark theme tokens.
- Build Customer, Vehicle, and Technician list/form/details screens.
- Add validation, loading, empty, and error states.
- Run `node <skill-dir>/scripts/sloplint.mjs <files> --render` and fix every FAIL before proceeding.

Exit condition:
- Master records can be created, viewed, edited, and validly deleted from Angular.
- Hallmark sweep reports no open Floor or Reflex findings, and the finish review outcome is recorded.

## Phase 6 — Transaction screens and integration
Tasks:
- Continue the same Hallmark theme and token system from Phase 5; do not switch visual systems between screens.
- Build booking list/form/details, cancel action, and create-job-card action.
- Build job-card details, task editor, technician allocation, estimate display, status update, completion notes, and status history.
- Build the dashboard and completed-jobs report using backend APIs.
- Test navigation and refresh behaviour.
- Re-run the Hallmark sweep against every changed page or component and record the outcome.

Exit condition:
- The entire workflow works from Angular with no mock data.
- All transaction screens pass the Hallmark sweep and finish review.

## Phase 7 — Testing, documentation, and push
Tasks:
- Run the full requirements test matrix.
- Create a Postman collection and API summary.
- Capture required evidence and screenshots.
- Finish README setup steps, troubleshooting, ER diagram, SQL scripts, and tool versions.
- Verify a clean start from README instructions.
- Commit and push to the provided SSH remote only after testing passes.

Exit condition:
- Another person can clone, set up, run, and demonstrate the system.

## Current status protocol
`current_status.md` is overwritten after each phase. It records current progress, the goal for the phase, completed and remaining items, verification, decisions, blockers, and the exact next step so a new session can continue safely.
