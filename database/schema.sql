SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS job_cards;
DROP TABLE IF EXISTS service_bookings;
DROP TABLE IF EXISTS technicians;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS customers;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE customers (
  customer_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_code VARCHAR(30) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL,
  PRIMARY KEY (customer_id),
  CONSTRAINT uq_customers_customer_code UNIQUE (customer_code),
  KEY idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vehicles (
  vehicle_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration_number VARCHAR(30) NOT NULL,
  make VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  `year` INT UNSIGNED NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  odometer_reading INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (vehicle_id),
  CONSTRAINT uq_vehicles_registration_number UNIQUE (registration_number),
  CONSTRAINT chk_vehicles_year CHECK (`year` BETWEEN 1900 AND 2100),
  KEY idx_vehicles_customer_id (customer_id),
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE technicians (
  technician_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  technician_code VARCHAR(30) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  skill_area VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  availability_status VARCHAR(20) NOT NULL,
  PRIMARY KEY (technician_id),
  CONSTRAINT uq_technicians_technician_code UNIQUE (technician_code),
  CONSTRAINT chk_technicians_availability CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE')),
  KEY idx_technicians_availability_status (availability_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE service_bookings (
  booking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_number VARCHAR(30) NOT NULL,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  preferred_date DATE NOT NULL,
  complaint VARCHAR(1000) NOT NULL,
  booking_status VARCHAR(20) NOT NULL,
  PRIMARY KEY (booking_id),
  CONSTRAINT uq_service_bookings_booking_number UNIQUE (booking_number),
  CONSTRAINT chk_service_bookings_status CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CONVERTED')),
  CONSTRAINT chk_service_bookings_preferred_date CHECK (preferred_date >= booking_date),
  KEY idx_service_bookings_vehicle_id (vehicle_id),
  KEY idx_service_bookings_status (booking_status),
  CONSTRAINT fk_service_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE job_cards (
  job_card_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_card_number VARCHAR(30) NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  technician_id BIGINT UNSIGNED NULL,
  opened_date DATE NOT NULL,
  promised_date DATE NOT NULL,
  labour_estimate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  job_status VARCHAR(20) NOT NULL,
  completion_notes VARCHAR(2000) NULL,
  completed_at DATETIME NULL,
  delivered_at DATETIME NULL,
  service_tasks JSON NOT NULL,
  status_history JSON NOT NULL,
  PRIMARY KEY (job_card_id),
  CONSTRAINT uq_job_cards_job_card_number UNIQUE (job_card_number),
  CONSTRAINT uq_job_cards_booking_id UNIQUE (booking_id),
  CONSTRAINT chk_job_cards_status CHECK (job_status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DELIVERED')),
  CONSTRAINT chk_job_cards_promised_date CHECK (promised_date >= opened_date),
  CONSTRAINT chk_job_cards_labour_estimate CHECK (labour_estimate >= 0),
  KEY idx_job_cards_technician_id (technician_id),
  KEY idx_job_cards_job_status (job_status),
  KEY idx_job_cards_promised_date (promised_date),
  CONSTRAINT fk_job_cards_booking FOREIGN KEY (booking_id) REFERENCES service_bookings (booking_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_job_cards_technician FOREIGN KEY (technician_id) REFERENCES technicians (technician_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
