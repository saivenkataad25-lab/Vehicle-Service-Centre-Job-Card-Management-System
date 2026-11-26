# Vehicle Service Centre Job Card Management System

Clean full-stack CRUD and workflow application for customer, vehicle, service booking, technician, and job-card management.

## Stack

- Angular 22.3.0 with Angular Router, Reactive Forms, and a dev-server `/api` proxy
- Spring Boot 3.5.16, Java 21, Spring MVC, Spring Data JPA, and Bean Validation
- MySQL 8.4.13 with InnoDB
- Postman collection and MySQL scripts for testing

## Scope

- Five persistent tables only: `customers`, `vehicles`, `service_bookings`, `technicians`, `job_cards`.
- Service tasks and status history are stored as JSON columns in `job_cards`.
- No authentication, spare-parts inventory, payments, or insurance claims.
- Customer and technician phone numbers must be exactly 10 characters.

## Local tool versions

- Temurin JDK 21.0.13.1+2
- Apache Maven 3.9.16
- MySQL 8.4.13
- Node.js 24.20.0
- npm 11.19.0
- Angular CLI 22.3.0

Portable tools used in this environment live in `.tools/` and are not committed. Run `source scripts/env.sh` in every new shell so those tools and the library path are available.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `VSC_DB_PASSWORD` and `VSC_DB_ROOT_PASSWORD` in `.env`. Keep `.env` out of source control.
3. Load the environment:

   ```bash
   source scripts/env.sh
   ```

4. Start MySQL:

   ```bash
   ./scripts/start-mysql.sh
   ```

   This creates the database and application user if they do not exist, on port `3307`.

5. Load the schema and sample data:

   ```bash
   set -a
   . ./.env
   set +a
   mysql -h "$VSC_DB_HOST" -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" -p"$VSC_DB_PASSWORD" "$VSC_DB_NAME" < database/schema.sql
   mysql -h "$VSC_DB_HOST" -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" -p"$VSC_DB_PASSWORD" "$VSC_DB_NAME" < database/sample_data.sql
   ```

6. Install frontend dependencies:

   ```bash
   npm --prefix frontend install
   ```

## Run

In separate shells, each starting with `source scripts/env.sh`:

```bash
set -a; . ./.env; set +a
mvn -f backend/pom.xml spring-boot:run
```

```bash
npm --prefix frontend start -- --host 127.0.0.1
```

Open `http://localhost:4200/`.

The Angular dev server proxies `/api` to `http://localhost:8080` through `frontend/proxy.conf.json`; do not call `http://localhost:4200/api` without the backend running.

Stop MySQL with:

```bash
./scripts/stop-mysql.sh
```

## Build

```bash
mvn -f backend/pom.xml -DskipTests package
npm --prefix frontend run build
```

## Main workflow

1. Register a customer.
2. Add a vehicle for that customer.
3. Create a booking and confirm it.
4. Create a job card from the confirmed booking.
5. Assign an available technician and add service tasks.
6. Move the job through `OPEN → IN_PROGRESS → COMPLETED` with completion notes.
7. Open Reports to see the completed job.
8. Use Dashboard for live counts, overdue jobs, upcoming jobs, and status breakdown.

## Troubleshooting

- `Unknown global config "tmp"` from npm is a harmless local npm warning.
- `Access denied` from MySQL means `.env` passwords do not match the local MySQL user; rerun `scripts/start-mysql.sh` after updating `.env`.
- `Failed to connect` on port `8080` means the backend is not running or Maven did not inherit the `.env` variables.
- `404` for `/api/...` in the browser means the backend is down or `frontend/proxy.conf.json` is not configured in `frontend/angular.json`.
- `Phone must be exactly 10 characters.` means the value is shorter or longer than 10 characters.
- `409 Conflict` is expected when deleting protected/dependent records, creating duplicate registrations, reusing a converted booking, assigning an unavailable technician, completing without notes, or making an invalid status transition.

## Testing and evidence

- Full requirements test matrix: `docs/test-matrix.md`
- Raw test transcript: `docs/evidence/test-results.txt`
- Eight required screenshots: `docs/evidence/01-setup.png` through `docs/evidence/08-database.png`
- API summary: `docs/api-summary.md`
- Full API contract: `docs/api-contract.md`
- Postman collection: `docs/postman_collection.json`
- Current verification status: `current_status.md`

## Documentation

- `plan.md` — build phases and scope decisions
- `requirments.md` — original requirements and minimum test matrix
- `current_status.md` — latest progress and next step
- `database/` — schema, sample data, and ER diagram
- `docs/` — API docs, test matrix, Postman collection, and evidence
