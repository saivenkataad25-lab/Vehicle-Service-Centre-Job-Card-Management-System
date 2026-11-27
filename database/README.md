# Database

MySQL 8.4 InnoDB scripts for the five main entities: `customers`, `vehicles`, `technicians`, `service_bookings`, and `job_cards`.

## Contents

- `schema.sql` — creates tables, keys, unique constraints, foreign keys, indexes, and status checks. Service tasks and status history are stored as JSON columns in `job_cards`; see [`../docs/supervisor-confirmations.md`](../docs/supervisor-confirmations.md).
- `sample_data.sql` — a small demonstration dataset covering active, completed, and delivered work.

## Use

From the repository root, after setting credentials in `.env`:

```bash
npm run db:setup
```

This loads both scripts into the configured database. `schema.sql` drops and recreates the tables, so running it again resets the data. For a system MySQL server, start the server first and check the `VSC_DB_*` values in `.env`. Schema checks and the relationship diagram are in [`../docs/database-checks.md`](../docs/database-checks.md) and [`../docs/er-diagram.md`](../docs/er-diagram.md).
