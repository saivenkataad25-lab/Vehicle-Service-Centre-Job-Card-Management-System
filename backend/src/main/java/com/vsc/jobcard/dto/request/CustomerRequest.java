package com.vsc.jobcard.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "customerCode is required") @Size(max = 30) String customerCode,
        @NotBlank(message = "fullName is required") @Size(max = 100) String fullName,
        @NotBlank(message = "phone is required") @Size(min = 10, max = 10, message = "phone must be exactly 10 characters") String phone,
        @NotBlank(message = "email is required") @Email(message = "email must be valid") @Size(max = 120) String email,
        @NotBlank(message = "address is required") @Size(max = 255) String address
) {
}
