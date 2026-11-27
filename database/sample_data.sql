INSERT INTO customers (customer_id, customer_code, full_name, phone, email, address) VALUES
  (1, 'CUST-0001', 'Amina Yusuf', '0712345001', 'amina.yusuf@example.com', '12 Market Road, Nairobi'),
  (2, 'CUST-0002', 'Brian Kiptoo', '0712345002', 'brian.kiptoo@example.com', '8 Industrial Avenue, Nairobi'),
  (3, 'CUST-0003', 'Cynthia Wanjiku', '0712345003', 'cynthia.wanjiku@example.com', '45 Valley Lane, Nairobi');

INSERT INTO vehicles (vehicle_id, registration_number, make, model, `year`, fuel_type, customer_id, odometer_reading) VALUES
  (1, 'KAA-123A', 'Toyota', 'Corolla', 2018, 'PETROL', 1, 68400),
  (2, 'KAB-456B', 'Honda', 'Fit', 2020, 'PETROL', 1, 41250),
  (3, 'KAC-789C', 'Isuzu', 'D-Max', 2019, 'DIESEL', 2, 92100),
  (4, 'KAD-321D', 'Nissan', 'Note', 2021, 'PETROL', 3, 33800),
  (5, 'KAE-654E', 'Mitsubishi', 'Outlander', 2017, 'DIESEL', 3, 112300);

INSERT INTO technicians (technician_id, technician_code, full_name, skill_area, phone, availability_status) VALUES
  (1, 'TECH-001', 'Daniel Mwangi', 'Engine and diagnostics', '0722001001', 'AVAILABLE'),
  (2, 'TECH-002', 'Grace Njoroge', 'Brakes and suspension', '0722001002', 'AVAILABLE'),
  (3, 'TECH-003', 'Samuel Otieno', 'Electrical and air conditioning', '0722001003', 'AVAILABLE');

INSERT INTO service_bookings (booking_id, booking_number, vehicle_id, booking_date, preferred_date, complaint, booking_status) VALUES
  (1, 'BK-2026-0001', 1, '2026-11-14', '2026-11-18', 'Engine noise and rough idle', 'CONVERTED'),
  (2, 'BK-2026-0002', 3, '2026-11-16', '2026-11-20', 'Air conditioning not cooling', 'CONVERTED'),
  (3, 'BK-2026-0003', 2, '2026-11-15', '2026-11-18', 'Brake pads need inspection', 'CONVERTED'),
  (4, 'BK-2026-0004', 4, '2026-11-20', '2026-11-27', 'Routine service and tyre check', 'PENDING'),
  (5, 'BK-2026-0005', 5, '2026-11-21', '2026-11-25', 'Electrical fault warning light', 'CONVERTED'),
  (6, 'BK-2026-0006', 1, '2026-11-24', '2026-12-02', 'Periodic maintenance', 'CONFIRMED'),
  (7, 'BK-2026-0007', 4, '2026-11-25', '2026-11-28', 'Battery warning light', 'CONVERTED');

INSERT INTO job_cards (
  job_card_id,
  job_card_number,
  booking_id,
  technician_id,
  opened_date,
  promised_date,
  labour_estimate,
  job_status,
  completion_notes,
  completed_at,
  delivered_at,
  service_tasks,
  status_history
) VALUES
  (1, 'JC-2026-0001', 1, 1, '2026-11-18', '2026-11-20', 117.50, 'DELIVERED',
   'Engine noise resolved after oil service and diagnostic check.',
   '2026-11-19 15:30:00', '2026-11-20 09:00:00',
   '[{"taskName":"Engine oil change","description":"Drain and replace engine oil and filter","estimatedHours":1.5,"hourlyRate":45.00,"amount":67.50},{"taskName":"Engine diagnostic","description":"Scan and clear fault codes","estimatedHours":1.0,"hourlyRate":50.00,"amount":50.00}]',
   '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-18T08:15:00","note":"Job card opened"},{"fromStatus":"OPEN","toStatus":"IN_PROGRESS","changedAt":"2026-11-18T10:00:00","note":"Work started"},{"fromStatus":"IN_PROGRESS","toStatus":"COMPLETED","changedAt":"2026-11-19T15:30:00","note":"All tasks completed"},{"fromStatus":"COMPLETED","toStatus":"DELIVERED","changedAt":"2026-11-20T09:00:00","note":"Vehicle handed to customer"}]'),

  (2, 'JC-2026-0002', 2, 3, '2026-11-20', '2026-11-22', 130.00, 'COMPLETED',
   'Air conditioning system serviced and cooling restored.',
   '2026-11-21 16:00:00', NULL,
   '[{"taskName":"AC gas refill","description":"Recharge refrigerant and leak check","estimatedHours":2.0,"hourlyRate":55.00,"amount":110.00},{"taskName":"Cabin filter replacement","description":"Replace clogged cabin filter","estimatedHours":0.5,"hourlyRate":40.00,"amount":20.00}]',
   '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-20T07:45:00","note":"Job card opened"},{"fromStatus":"OPEN","toStatus":"IN_PROGRESS","changedAt":"2026-11-20T11:00:00","note":"Work started"},{"fromStatus":"IN_PROGRESS","toStatus":"COMPLETED","changedAt":"2026-11-21T16:00:00","note":"Cooling restored"}]'),

  (3, 'JC-2026-0003', 3, 2, '2026-11-18', '2026-11-20', 150.00, 'IN_PROGRESS',
   NULL,
   NULL, NULL,
   '[{"taskName":"Brake inspection","description":"Inspect front and rear brake components","estimatedHours":2.5,"hourlyRate":60.00,"amount":150.00}]',
   '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-18T08:00:00","note":"Job card opened"},{"fromStatus":"OPEN","toStatus":"IN_PROGRESS","changedAt":"2026-11-18T09:30:00","note":"Inspection started"}]'),

  (4, 'JC-2026-0004', 5, NULL, '2026-11-25', '2026-12-01', 110.00, 'ON_HOLD',
   NULL,
   NULL, NULL,
   '[{"taskName":"Tyre replacement","description":"Replace two front tyres","estimatedHours":1.0,"hourlyRate":35.00,"amount":35.00},{"taskName":"Wheel alignment","description":"Perform four-wheel alignment","estimatedHours":1.5,"hourlyRate":50.00,"amount":75.00}]',
   '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-25T10:00:00","note":"Job card opened"},{"fromStatus":"OPEN","toStatus":"ON_HOLD","changedAt":"2026-11-25T14:00:00","note":"Waiting for customer approval"}]'),

  (5, 'JC-2026-0005', 7, 1, '2026-11-25', '2026-11-28', 33.75, 'OPEN',
   NULL,
   NULL, NULL,
   '[{"taskName":"Battery replacement","description":"Test and replace vehicle battery","estimatedHours":0.75,"hourlyRate":45.00,"amount":33.75}]',
   '[{"fromStatus":null,"toStatus":"OPEN","changedAt":"2026-11-25T13:00:00","note":"Job card opened"}]');
