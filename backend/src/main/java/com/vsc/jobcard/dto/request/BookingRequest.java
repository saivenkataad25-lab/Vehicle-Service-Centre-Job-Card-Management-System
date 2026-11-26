package com.vsc.jobcard.dto.request;

import com.vsc.jobcard.enums.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record BookingRequest(
        @NotBlank(message = "bookingNumber is required") @Size(max = 30) String bookingNumber,
        @NotNull(message = "vehicleId is required") Long vehicleId,
        @NotNull(message = "bookingDate is required") LocalDate bookingDate,
        @NotNull(message = "preferredDate is required") LocalDate preferredDate,
        @NotBlank(message = "complaint is required") @Size(max = 1000) String complaint,
        @NotNull(message = "bookingStatus is required") BookingStatus bookingStatus
) {
}
