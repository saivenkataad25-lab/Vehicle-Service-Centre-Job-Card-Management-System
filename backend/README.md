# Backend

Spring Boot 3.5.16 REST API (Java 21, Maven) for customers, vehicles, technicians, bookings, job cards, dashboard totals, and reports. It listens on port `8080` and exposes endpoints under `/api`.

## Contents

- `src/main/java/com/vsc/jobcard/controller/` — HTTP controllers for each resource, dashboard, and reports
- `service/` — business rules, validation, status transitions, deletion restrictions, and estimate calculation
- `repository/` — Spring Data JPA repositories
- `entity/`, `dto/request/`, `dto/response/`, `enums/` — persistence models and API shapes
- `exception/` — central HTTP error handling
- `config/` — web configuration
- `src/main/resources/application.properties` — server and datasource settings

Database connection values come from the `VSC_DB_*` variables in the repository `.env`; Hibernate validates the schema created by `database/schema.sql`.

## Use

From the repository root, after configuring `.env`:

```bash
npm run db:setup
npm run api
```

Build the JAR with `npm run api:build`. The full request and response contract is in [`../docs/api-contract.md`](../docs/api-contract.md), and the importable API tests are in [`../docs/postman_collection.json`](../docs/postman_collection.json). Never put database passwords in source files.
