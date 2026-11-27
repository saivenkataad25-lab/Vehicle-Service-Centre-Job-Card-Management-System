# ER Diagram

```mermaid
erDiagram
  CUSTOMERS ||--o{ VEHICLES : owns
  VEHICLES ||--o{ SERVICE_BOOKINGS : has
  SERVICE_BOOKINGS ||--o| JOB_CARDS : generates
  TECHNICIANS |o--o{ JOB_CARDS : assigned

  CUSTOMERS {
    BIGINT customer_id PK
    VARCHAR customer_code UK
    VARCHAR full_name
    VARCHAR phone
    VARCHAR email
    VARCHAR address
  }

  VEHICLES {
    BIGINT vehicle_id PK
    VARCHAR registration_number UK
    VARCHAR make
    VARCHAR model
    INT year
    VARCHAR fuel_type
    BIGINT customer_id FK
    INT odometer_reading
  }

  TECHNICIANS {
    BIGINT technician_id PK
    VARCHAR technician_code UK
    VARCHAR full_name
    VARCHAR skill_area
    VARCHAR phone
    VARCHAR availability_status
  }

  SERVICE_BOOKINGS {
    BIGINT booking_id PK
    VARCHAR booking_number UK
    BIGINT vehicle_id FK
    DATE booking_date
    DATE preferred_date
    VARCHAR complaint
    VARCHAR booking_status
  }

  JOB_CARDS {
    BIGINT job_card_id PK
    VARCHAR job_card_number UK
    BIGINT booking_id FK, UK
    BIGINT technician_id FK
    DATE opened_date
    DATE promised_date
    DECIMAL labour_estimate
    VARCHAR job_status
    VARCHAR completion_notes
    DATETIME completed_at
    DATETIME delivered_at
    JSON service_tasks
    JSON status_history
  }
```

## Relationship notes
- A customer owns zero or more vehicles.
- A vehicle has zero or more service bookings.
- A service booking generates zero or one job card; `job_cards.booking_id` is unique.
- A job card has zero or one assigned technician; a technician may be assigned to zero or more job cards.
- `completed_at` and `delivered_at` are nullable timestamps set on the first transition to `COMPLETED` and `DELIVERED`.
- Service tasks and status history are JSON columns inside `job_cards`, keeping the design to five tables.
