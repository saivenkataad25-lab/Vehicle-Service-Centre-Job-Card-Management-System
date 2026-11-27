# Database constraint checks

Run these after `database/schema.sql` and `database/sample_data.sql`.

## Setup
```bash
source scripts/env.sh
set -a
. ./.env
set +a
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" < database/schema.sql
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" < database/sample_data.sql
```

## Expected row counts
```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "SELECT (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM vehicles) AS vehicles, (SELECT COUNT(*) FROM technicians) AS technicians, (SELECT COUNT(*) FROM service_bookings) AS bookings, (SELECT COUNT(*) FROM job_cards) AS job_cards;"
```

Expected: `customers=3`, `vehicles=5`, `technicians=3`, `bookings=7`, `job_cards=5`.

## Job card schema notes
`job_cards.technician_id` is nullable (`FK`): a job card has zero or one technician, and a technician may have zero or more job cards. `completed_at` and `delivered_at` are nullable `DATETIME` columns set on the first transition to `COMPLETED` and `DELIVERED` and preserved by later updates.

```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "SELECT job_card_number, job_status, technician_id, completed_at, delivered_at FROM job_cards ORDER BY job_card_id;"
```

## Duplicate registration number must fail
```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "INSERT INTO vehicles (registration_number, make, model, \`year\`, fuel_type, customer_id, odometer_reading) VALUES ('KAA-123A', 'Toyota', 'Corolla', 2018, 'PETROL', 1, 100);"
```

Expected: duplicate key error on `uq_vehicles_registration_number`.

## Invalid customer foreign key must fail
```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "INSERT INTO vehicles (registration_number, make, model, \`year\`, fuel_type, customer_id, odometer_reading) VALUES ('KAF-999Z', 'Toyota', 'Corolla', 2020, 'PETROL', 999, 100);"
```

Expected: foreign key constraint failure on `fk_vehicles_customer`.

## One job card per booking must fail on duplicate
```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "INSERT INTO job_cards (job_card_number, booking_id, opened_date, promised_date, job_status, service_tasks, status_history) VALUES ('JC-TEST-0001', 1, '2026-11-26', '2026-11-30', 'OPEN', '[]', '[]');"
```

Expected: duplicate key error on `uq_job_cards_booking_id`.

## Invalid status value must fail
```bash
MYSQL_PWD="$VSC_DB_PASSWORD" mysql -h 127.0.0.1 -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" "$VSC_DB_NAME" \
  -e "INSERT INTO job_cards (job_card_number, booking_id, opened_date, promised_date, job_status, service_tasks, status_history) VALUES ('JC-TEST-0002', 6, '2026-11-26', '2026-11-30', 'UNKNOWN', '[]', '[]');"
```

Expected: check constraint failure on `chk_job_cards_status`.
