# ER Diagram

```mermaid
erDiagram
  CUSTOMERS ||--o{ VEHICLES : owns
  VEHICLES ||--o{ SERVICE_BOOKINGS : has
  SERVICE_BOOKINGS ||--o| JOB_CARDS : generates
  TECHNICIANS |o--o{ JOB_CARDS : assigned

  CUSTOMERS {
    BIGINT customer_id PK "UNSIGNED NOT NULL AUTO_INCREMENT"
    VARCHAR customer_code UK "NOT NULL, UNIQUE"
    VARCHAR full_name "NOT NULL"
    VARCHAR phone "NOT NULL, indexed"
    VARCHAR email "NOT NULL"
    VARCHAR address "NOT NULL"
  }

  VEHICLES {
    BIGINT vehicle_id PK "UNSIGNED NOT NULL AUTO_INCREMENT"
    VARCHAR registration_number UK "NOT NULL, UNIQUE"
    VARCHAR make "NOT NULL"
    VARCHAR model "NOT NULL"
    INT year "UNSIGNED NOT NULL"
    VARCHAR fuel_type "NOT NULL"
    BIGINT customer_id FK "UNSIGNED NOT NULL, indexed"
    INT odometer_reading "UNSIGNED NOT NULL"
  }

  TECHNICIANS {
    BIGINT technician_id PK "UNSIGNED NOT NULL AUTO_INCREMENT"
    VARCHAR technician_code UK "NOT NULL, UNIQUE"
    VARCHAR full_name "NOT NULL"
    VARCHAR skill_area "NOT NULL"
    VARCHAR phone "NOT NULL"
    VARCHAR availability_status "NOT NULL, CHECK"
  }

  SERVICE_BOOKINGS {
    BIGINT booking_id PK "UNSIGNED NOT NULL AUTO_INCREMENT"
    VARCHAR booking_number UK "NOT NULL, UNIQUE"
    BIGINT vehicle_id FK "UNSIGNED NOT NULL, indexed"
    DATE booking_date "NOT NULL"
    DATE preferred_date "NOT NULL, CHECK preferred_date >= booking_date"
    VARCHAR complaint "NOT NULL"
    VARCHAR booking_status "NOT NULL, CHECK"
  }

  JOB_CARDS {
    BIGINT job_card_id PK "UNSIGNED NOT NULL AUTO_INCREMENT"
    VARCHAR job_card_number UK "NOT NULL, UNIQUE"
    BIGINT booking_id FK, UK "UNSIGNED NOT NULL, UNIQUE"
    BIGINT technician_id FK "UNSIGNED NULL, indexed"
    DATE opened_date "NOT NULL"
    DATE promised_date "NOT NULL, CHECK promised_date >= opened_date"
    DECIMAL labour_estimate "NOT NULL, DECIMAL(10,2), CHECK >= 0"
    VARCHAR job_status "NOT NULL, CHECK"
    VARCHAR completion_notes "NULL"
    DATETIME completed_at "NULL"
    DATETIME delivered_at "NULL"
    JSON service_tasks "NOT NULL"
    JSON status_history "NOT NULL"
  }
```

## Relationship notes
- A customer owns zero or more vehicles.
- A vehicle has zero or more service bookings.
- A service booking generates zero or one job card; `job_cards.booking_id` is unique.
- A job card has zero or one assigned technician; a technician may be assigned to zero or more job cards.
- `completed_at` and `delivered_at` are nullable timestamps set on the first transition to `COMPLETED` and `DELIVERED`.
- Service tasks and status history are JSON columns inside `job_cards`, keeping the design to five tables.
- All five tables use `ENGINE=InnoDB`, primary keys are auto-increment unsigned integers, and foreign keys use `ON DELETE RESTRICT ON UPDATE CASCADE`.
- Indexes exist on `customers.phone`, `vehicles.customer_id`, `service_bookings.vehicle_id`/`booking_status`, and `job_cards.technician_id`/`job_status`/`promised_date`.
