package com.vsc.jobcard.dto.response;

public record VehicleResponse(
        Long id,
        String registrationNumber,
        String make,
        String model,
        Integer year,
        String fuelType,
        Long customerId,
        String customerName,
        Integer odometerReading
) {
}
