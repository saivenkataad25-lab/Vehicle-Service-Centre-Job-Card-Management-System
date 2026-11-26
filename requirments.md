# Vehicle Service Centre Job Card Management System
## Refined Requirements and Execution Plan

## 1. Project Goal

Build a working full-stack application that manages a vehicle service centre's workflow from customer and vehicle registration through booking, job-card creation, technician allocation, service-task recording, and job completion.

**Required stack**
- Frontend: Angular with Angular Router, reusable components, forms, and `HttpClient` services.
- Backend: Java Spring Boot REST API using Controller → Service → Repository layers and Spring Data JPA.
- Database: MySQL with InnoDB, primary keys, foreign keys, unique constraints, and validation constraints.
- Testing: Postman, Angular UI, browser developer tools, and MySQL Workbench.

**Non-negotiable scope constraints**
- Use Angular, not React.
- Use a real Spring Boot API and MySQL database; do not use JSON Server as the final backend.
- Keep no more than five main persistent entities.
- Do not build spare-parts inventory, online payment, insurance claims, or authentication/security features unless the project supervisor changes the scope.

## 2. Refined Functional Scope

### A. Customer management
- Register, view, search, update, and delete customers when deletion is valid.
- Store customer code, name, phone, email, and address.
- A customer may own multiple vehicles.

### B. Vehicle management
- Register, view, search, update, and delete vehicles when deletion is valid.
- Link every vehicle to exactly one customer.
- Prevent duplicate registration numbers.
- Store make, model, year, fuel type, and current odometer reading.

### C. Service booking management
- Create, view, search, update, and cancel service bookings.
- Each booking must refer to an existing vehicle.
- Store booking number, booking date, preferred service date, complaint, and status.
- Recommended booking statuses: `PENDING`, `CONFIRMED`, `CANCELLED`, `CONVERTED`.
- A booking can generate at most one job card.

### D. Technician management
- Add, view, search, update, and delete technicians when deletion is valid.
- Store technician code, name, skill area, phone, and availability status.
- Recommended availability values: `AVAILABLE`, `UNAVAILABLE`.
- A technician can be assigned to multiple job cards over time.

### E. Job-card management
- Create a job card from an existing confirmed booking.
- Allocate or change the assigned technician while the job is still active.
- Record service tasks, labour estimate, promised date, job status, and completion notes.
- Display job-card details and status history/current status.
- Prevent deletion of `COMPLETED` or `DELIVERED` job cards.
- Recommended job statuses and transitions:

| Current status | Allowed next status |
|---|---|
| `OPEN` | `IN_PROGRESS`, `ON_HOLD` |
| `IN_PROGRESS` | `ON_HOLD`, `COMPLETED` |
| `ON_HOLD` | `IN_PROGRESS` |
| `COMPLETED` | `DELIVERED` |
| `DELIVERED` | No further transition |

The backend, not just the Angular UI, must enforce these transitions.

### F. Dashboard and report
- Show total customers, vehicles, bookings, and job cards.
- Show job cards grouped by status.
- Show upcoming promised dates and overdue jobs (promised date is before today and status is not `COMPLETED` or `DELIVERED`).
- Show completed job cards in a completed-jobs report.
- All dashboard values must come from backend APIs, not hard-coded frontend values.

## 3. Data Model and Database Design

Use these five main tables only:

| Table | Important fields | Relationships / constraints |
|---|---|---|
| `customers` | `customer_id` PK, `customer_code`, `full_name`, `phone`, `email`, `address` | `customer_code` unique; one customer has many vehicles |
| `vehicles` | `vehicle_id` PK, `registration_number`, `make`, `model`, `year`, `fuel_type`, `customer_id` FK, `odometer_reading` | `registration_number` unique; each vehicle belongs to one customer |
| `service_bookings` | `booking_id` PK, `booking_number`, `vehicle_id` FK, `booking_date`, `preferred_date`, `complaint`, `booking_status` | `booking_number` unique; one vehicle has many bookings |
| `technicians` | `technician_id` PK, `technician_code`, `full_name`, `skill_area`, `phone`, `availability_status` | `technician_code` unique; one technician can have many job cards over time |
| `job_cards` | `job_card_id` PK, `job_card_number`, `booking_id` FK, `technician_id` FK, `opened_date`, `promised_date`, `labour_estimate`, `job_status`, `completion_notes`, `service_tasks` | `job_card_number` unique; `booking_id` unique to enforce one job card per booking |

### Important design decision: service tasks without a sixth table

The brief expects task-level details and an estimate calculated from task entries, but it also limits the system to five main persistent entities. To satisfy both, store `service_tasks` as a MySQL `JSON` column inside `job_cards`. Each task can contain:
- `taskName`
- `description`
- `estimatedHours`
- `hourlyRate`
- `amount`

The backend should calculate `amount = estimatedHours × hourlyRate` and calculate `labour_estimate` as the sum of task amounts. Do not trust a total sent by the browser. Confirm with the project supervisor that a JSON column inside `job_cards` is acceptable under the five-entity rule. If not approved, store task descriptions as structured text and clearly document the reduced task-level functionality; do not silently add a sixth table.

### Database rules
- Use auto-generated numeric primary keys.
- Use `DECIMAL(10,2)` for monetary values; do not use floating-point types for estimates.
- Use `DATE` for date-only fields and `DATETIME` only where a time is needed.
- Add `NOT NULL` to mandatory fields and appropriate length limits.
- Add unique constraints to customer code, registration number, booking number, technician code, and job-card number.
- Add a unique constraint to `job_cards.booking_id`.
- Use foreign keys and restrictive delete behaviour where related records exist.
- Add indexes to commonly searched fields such as registration number, customer code, booking number, and job status.

### ER relationship summary
- Customer `1 → many` Vehicle
- Vehicle `1 → many` ServiceBooking
- ServiceBooking `1 → 0..1` JobCard
- Technician `1 → many` JobCard (over time)

Include an ER diagram showing the optional one-to-zero-or-one booking/job-card relationship.

## 4. Business Rules and Validation

Implement each rule in the Spring Boot service layer and return a clear error response. Angular should also show early validation messages, but frontend checks are not a substitute for backend validation.

1. A vehicle registration number must be unique.
2. A vehicle must reference an existing customer.
3. A booking must reference an existing vehicle.
4. A booking's preferred date cannot be earlier than its booking date.
5. A job card can only be created for an existing eligible booking.
6. A booking can have only one job card.
7. A job card must reference an existing technician when a technician is assigned.
8. An unavailable technician cannot be newly assigned.
9. Promised date cannot be earlier than the job-card opened date.
10. Labour estimate and task hours/rates cannot be negative.
11. The backend calculates task amounts and total labour estimate.
12. Job status transitions must follow the transition table above.
13. Completion notes are required when moving a job card to `COMPLETED`.
14. Completed and delivered job cards cannot be deleted.
15. A customer, vehicle, or technician with dependent records cannot be hard-deleted. Return a conflict response and explain which relationship prevents deletion. Do not cascade-delete business records.

**Deletion approach:** Use restricted hard deletion for records with no dependants. For records with dependants, reject deletion with a clear message. Do not add soft-delete fields unless the supervisor approves the extra fields and the UI requirement is agreed.

## 5. Backend API Plan

Use a consistent base path of `/api`. Every resource should support collection GET, GET by ID, POST, PUT, and DELETE where deletion is allowed.

| Resource | Endpoints |
|---|---|
| Customers | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}` |
| Vehicles | `GET/POST /api/vehicles`, `GET/PUT/DELETE /api/vehicles/{id}` |
| Service bookings | `GET/POST /api/service-bookings`, `GET/PUT/DELETE /api/service-bookings/{id}` |
| Technicians | `GET/POST /api/technicians`, `GET/PUT/DELETE /api/technicians/{id}` |
| Job cards | `GET/POST /api/job-cards`, `GET/PUT/DELETE /api/job-cards/{id}` |
| Dashboard | `GET /api/dashboard/summary`, `GET /api/dashboard/job-status-counts`, `GET /api/dashboard/delayed-jobs` |
| Report | `GET /api/reports/completed-job-cards` |

Useful filtered collection queries can be added without creating new entities, for example:
- `GET /api/vehicles?customerId=...`
- `GET /api/service-bookings?status=CONFIRMED`
- `GET /api/job-cards?status=IN_PROGRESS`
- `GET /api/job-cards?overdue=true`

### HTTP response conventions
- `200 OK`: successful read or update.
- `201 Created`: successful create; include the created resource or its location.
- `204 No Content`: successful delete with no response body.
- `400 Bad Request`: malformed input or validation failure.
- `404 Not Found`: requested record does not exist.
- `409 Conflict`: duplicate unique value, invalid state transition, or delete blocked by relationships.
- Return a consistent JSON error format containing a timestamp, status, message, and field errors where applicable.

## 6. Application Architecture

### Spring Boot package structure

```text
src/main/java/<base-package>/
  controller/
  service/
  repository/
  entity/
  dto/
    request/
    response/
  enums/
  exception/
  config/
```

Responsibilities:
- **Controller:** map HTTP routes, accept DTOs, return response DTOs and status codes.
- **Service:** apply business rules, validation, calculations, and transaction boundaries.
- **Repository:** database access through Spring Data JPA.
- **Entity:** map the five database tables.
- **DTO:** define safe, clear API request and response shapes; do not expose JPA entities directly from every endpoint.
- **Exception handling:** one global handler should convert validation, not-found, and conflict errors into consistent JSON responses.

### Angular feature structure

```text
src/app/
  core/
    services/
    interceptors/
  shared/
    components/
    pipes/
  features/
    dashboard/
    customers/
    vehicles/
    bookings/
    technicians/
    job-cards/
    reports/
  models/
```

Use Angular services for all HTTP calls. Components should handle presentation and user interaction rather than containing API logic or business calculations.

## 7. Frontend Pages

1. **Dashboard:** summary cards, job-status counts, upcoming appointments, delayed jobs.
2. **Customers:** searchable list, create/edit form, customer details, linked vehicles.
3. **Vehicles:** searchable list, create/edit form, vehicle details, customer selector, linked booking history.
4. **Bookings:** booking list, status filter, create/edit form, vehicle selector, booking details, cancel action, create-job-card action.
5. **Technicians:** searchable directory, create/edit form, availability indicator.
6. **Job cards:** list with status filters, job-card details, technician allocation, task editor, estimate display, status update, completion notes.
7. **Completed jobs report:** completed/delivered job cards with relevant dates and estimate.

Common reusable UI components:
- Main navigation/sidebar
- Data table with loading, empty, and error states
- Form field/error display
- Status badge
- Confirmation dialog
- Reusable search/filter controls

Use Reactive Forms unless there is a clear reason to use template-driven forms. Disable submit buttons while saving and show success/error feedback.

## 8. Execution Roadmap

Build and verify one layer at a time. Do not start all screens before the database and APIs are stable.

### Phase 0 — Confirm scope and prepare the repository
- Confirm the five-entity limit and the `service_tasks` JSON-column decision.
- Confirm the permitted status values and deletion rules with the supervisor.
- Create one Git repository with `/backend` and `/frontend` directories, plus `/database` and `/docs`.
- Record required Java, Node.js, Angular CLI, and MySQL versions in the README after checking the lab environment.
- Create a basic README and `.gitignore` files. Never commit passwords or database credentials.

**Exit condition:** repository is created, scope decisions are documented, and both applications can be generated locally.

### Phase 1 — Design the database
- Draw the ER diagram.
- Create the five MySQL tables with primary keys, foreign keys, unique constraints, indexes, and data types.
- Add a small, realistic sample dataset.
- Test the constraints directly in MySQL Workbench.
- Save schema and sample data scripts under `/database`.

**Exit condition:** the schema can be created from a clean database and rejects duplicate registration numbers and invalid foreign keys.

### Phase 2 — Build the Spring Boot foundation
- Generate the Spring Boot application and connect it to MySQL.
- Configure JPA and verify that the application starts and connects successfully.
- Create entities, enums, repositories, request/response DTOs, and exception handling.
- Implement and test Customer CRUD first, then Vehicle CRUD, then Technician CRUD.

**Exit condition:** master-data APIs work through Postman and changes persist in MySQL after restarting the backend.

### Phase 3 — Implement the service workflow
- Implement ServiceBooking CRUD and booking status rules.
- Implement JobCard creation from a confirmed booking.
- Enforce one job card per booking.
- Implement technician allocation and availability checks.
- Implement task entry, server-side estimate calculation, promised-date checks, completion notes, and status transitions.
- Implement deletion restrictions.

**Exit condition:** the full booking-to-completed-job workflow works through Postman without using the Angular UI.

### Phase 4 — Finish backend dashboard and reporting APIs
- Add dashboard summary and status-count endpoints.
- Add delayed-job and completed-job queries.
- Test empty results, date boundaries, and status filters.

**Exit condition:** dashboard/report endpoints return values calculated from actual MySQL records.

### Phase 5 — Build the Angular foundation and master screens
- Generate the Angular application and configure routes.
- Build the layout, navigation, shared table, form, status, and confirmation components.
- Configure typed models and one Angular service per resource.
- Build Customer, Vehicle, and Technician pages and connect them to the backend.
- Add client-side validation and loading/error handling.

**Exit condition:** master records can be created, viewed, edited, and validly deleted from Angular, with changes persisted in MySQL.

### Phase 6 — Build transaction screens and complete integration
- Build booking list/form/details and cancellation flow.
- Add the create-job-card action for an eligible booking.
- Build job-card details, task editing, technician allocation, estimate display, and status updates.
- Build the dashboard and completed-jobs report using backend data.
- Test navigation and refresh behaviour across the complete workflow.

**Exit condition:** a user can complete the entire service workflow from the Angular UI without mock data.

### Phase 7 — Test, document, and prepare submission
- Execute the test matrix in Section 9.
- Fix high-priority defects and retest affected workflows.
- Capture the eight required screenshots.
- Prepare README setup steps, API summary, ER diagram, SQL scripts, and Postman collection.
- Verify the project from a clean start using only the README instructions.
- Push the final source to GitHub and create a ZIP if required.

**Exit condition:** another person can clone the project, create the database, start both applications, and demonstrate the main workflow.

## 9. Minimum Test Matrix

| Test | Action | Expected result |
|---|---|---|
| Customer CRUD | Create, view, edit, delete a customer with no linked vehicles | All permitted operations succeed and persist |
| Vehicle CRUD | Add a vehicle to a customer and update it | Vehicle is saved with the correct customer relationship |
| Duplicate vehicle | Register a second vehicle with the same registration number | Request is rejected; no duplicate row is saved |
| Invalid foreign key | Create a vehicle with a non-existent customer ID | Request is rejected with a clear message |
| Booking flow | Create and confirm a booking for a vehicle | Booking appears with the correct vehicle details |
| One job card | Create a job card for a booking, then try to create another | First succeeds; second is rejected |
| Technician allocation | Assign an available technician, then try an unavailable one | Available technician is accepted; unavailable technician is rejected |
| Estimate | Add tasks with valid hours/rates; try a negative value | Total is calculated by the backend; invalid values are rejected |
| Status transitions | Move a job through allowed states, then attempt an invalid transition | Allowed transitions succeed; invalid transitions return a conflict response |
| Completion | Mark a job completed without completion notes | Request is rejected |
| Protected deletion | Try deleting a completed or delivered job card | Request is rejected |
| Dependency deletion | Try deleting a customer/vehicle/technician that has linked records | Request is rejected without deleting dependent data |
| Persistence | Restart Spring Boot and reload the Angular page | Previously saved records remain available |
| Dashboard/report | Create jobs in different statuses and dates | Counts, overdue jobs, and completed report match database records |

For each test, record: test ID, prerequisites, request/action, expected result, actual result, Pass/Fail, and evidence screenshot where useful.

## 10. Required Submission Evidence

Capture these after the application is stable:
1. Project setup: Angular and Spring Boot folders/configuration.
2. Dashboard: navigation, summary cards, status counts, and alerts.
3. Create: valid form submission and newly saved record.
4. Read: searchable list and record details.
5. Update: edited value visible after refresh.
6. Delete/status: permitted deletion or valid cancellation/status change.
7. API: Postman evidence for GET, POST, PUT, and DELETE/status behaviour.
8. Database: MySQL tables, sample rows, and foreign-key relationships.

Also submit:
- Angular and Spring Boot source code.
- README with prerequisites, setup, run commands, and troubleshooting.
- `pom.xml` and frontend package manifest/lock file.
- MySQL schema and sample-data scripts.
- ER diagram.
- API endpoint summary.
- Postman collection.
- GitHub URL or source ZIP.

## 11. Recommended Work Order and Priority

If time becomes limited, complete the project in this order:
1. Database schema and Spring Boot ↔ MySQL connectivity.
2. Customer, Vehicle, and Technician CRUD.
3. Booking creation and validation.
4. Job-card creation, technician assignment, task estimate, and status workflow.
5. Angular screens for the complete end-to-end workflow.
6. Dashboard and completed-jobs report.
7. Additional styling and convenience features.
8. Screenshots, README, Postman collection, and final clean-start test.

Do not spend time on animations, complex themes, login, inventory, payments, or unrelated features before the core workflow and evidence are complete.

## 12. Risks and Decisions to Confirm

| Risk / ambiguity | Recommended resolution |
|---|---|
| Task-level service records are required but only five entities are allowed | Use a JSON column in `job_cards`; obtain supervisor approval before implementation |
| “Full CRUD” conflicts with records that must not be deleted | Implement DELETE only where allowed; return `409 Conflict` for protected/dependent records |
| Booking status values are not specified | Use the recommended booking statuses in Section 2 and confirm them with the supervisor |
| Technician availability meaning is not fully defined | Treat it as eligibility for new assignments; avoid building shift scheduling or workload balancing |
| “Security” is excluded | Do not spend project time on authentication/roles unless the supervisor changes the instruction; keep credentials out of source control |
| Dashboard metrics are not precisely defined | Implement the minimum totals, status counts, upcoming promised dates, and overdue jobs listed above |

## Definition of Done

The project is complete when:
- The five-table MySQL schema and ER diagram are correct.
- Spring Boot exposes working CRUD and workflow APIs with backend validation.
- Angular uses real REST APIs and has all required pages.
- A customer can be registered, a vehicle added, a booking created, a job card generated, a technician allocated, tasks estimated, and the job completed/delivered.
- Invalid operations are rejected without corrupting data.
- Data persists across restarts.
- Dashboard and completed-job report use live backend data.
- Postman tests, screenshots, README, SQL scripts, and source repository are ready for submission.
