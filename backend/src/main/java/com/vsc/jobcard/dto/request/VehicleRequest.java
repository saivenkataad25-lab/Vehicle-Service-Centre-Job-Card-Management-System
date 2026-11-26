package com.vsc.jobcard.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record VehicleRequest(
        @NotBlank(message = "registrationNumber is required") @Size(max = 30) String registrationNumber,
        @NotBlank(message = "make is required") @Size(max = 60) String make,
        @NotBlank(message = "model is required") @Size(max = 60) String model,
        @NotNull(message = "year is required") @Min(1900) @Max(2100) Integer year,
        @NotBlank(message = "fuelType is required") @Size(max = 20) String fuelType,
        @NotNull(message = "customerId is required") Long customerId,
        @NotNull(message = "odometerReading is required") @PositiveOrZero Integer odometerReading
) {
}
