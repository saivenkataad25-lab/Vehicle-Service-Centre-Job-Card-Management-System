package com.vsc.jobcard.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceTaskRequest(
        @NotBlank(message = "taskName is required") @Size(max = 100) String taskName,
        @NotBlank(message = "description is required") @Size(max = 500) String description,
        @NotNull(message = "estimatedHours is required") @DecimalMin(value = "0.00", message = "estimatedHours cannot be negative") BigDecimal estimatedHours,
        @NotNull(message = "hourlyRate is required") @DecimalMin(value = "0.00", message = "hourlyRate cannot be negative") BigDecimal hourlyRate,
        @DecimalMin(value = "0.00", message = "amount cannot be negative") BigDecimal amount
) {
}
