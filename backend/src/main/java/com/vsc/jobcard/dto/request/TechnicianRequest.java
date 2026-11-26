package com.vsc.jobcard.dto.request;

import com.vsc.jobcard.enums.TechnicianAvailability;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TechnicianRequest(
        @NotBlank(message = "technicianCode is required") @Size(max = 30) String technicianCode,
        @NotBlank(message = "fullName is required") @Size(max = 100) String fullName,
        @NotBlank(message = "skillArea is required") @Size(max = 100) String skillArea,
        @NotBlank(message = "phone is required") @Size(min = 10, max = 10, message = "phone must be exactly 10 characters") String phone,
        @NotNull(message = "availabilityStatus is required") TechnicianAvailability availabilityStatus
) {
}
