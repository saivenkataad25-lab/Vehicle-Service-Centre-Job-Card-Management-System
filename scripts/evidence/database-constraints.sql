INSERT INTO customers (customer_code, full_name, phone, email, address)
VALUES ('CUST-0001', 'Constraint Test Duplicate', '0799999001', 'constraint1@test.local', '1 Constraint Road');

INSERT INTO vehicles (registration_number, make, model, `year`, fuel_type, customer_id, odometer_reading)
VALUES ('CONSTRAINT-FK', 'Toyota', 'Hilux', 2020, 'DIESEL', 999999999, 1000);

INSERT INTO service_bookings (booking_number, vehicle_id, booking_date, preferred_date, complaint, booking_status)
VALUES ('BK-CONSTRAINT-STATUS', 1, '2026-11-20', '2026-11-27', 'Invalid status check', 'UNKNOWN');

INSERT INTO service_bookings (booking_number, vehicle_id, booking_date, preferred_date, complaint, booking_status)
VALUES ('BK-CONSTRAINT-DATE', 1, '2026-11-27', '2026-11-20', 'Preferred date before booking date', 'PENDING');

INSERT INTO job_cards (job_card_number, booking_id, technician_id, opened_date, promised_date, labour_estimate, job_status, service_tasks, status_history)
VALUES ('JC-CONSTRAINT-DUP', 1, 1, '2026-11-20', '2026-11-27', 60.00, 'OPEN',
        '[{"taskName":"Oil change","description":"Replace oil","estimatedHours":1,"hourlyRate":60,"amount":60}]',
        '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-20T08:00:00","note":"Opened"}]');

INSERT INTO job_cards (job_card_number, booking_id, technician_id, opened_date, promised_date, labour_estimate, job_status, service_tasks, status_history)
VALUES ('JC-CONSTRAINT-NEG', 6, 1, '2026-11-20', '2026-11-27', -1.00, 'OPEN',
        '[{"taskName":"Oil change","description":"Replace oil","estimatedHours":1,"hourlyRate":60,"amount":60}]',
        '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-20T08:00:00","note":"Opened"}]');
