package com.vsc.jobcard.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record JobCardCreateRequest(
        @NotNull(message = "bookingId is required") Long bookingId,
        Long technicianId,
        @NotNull(message = "openedDate is required") LocalDate openedDate,
        @NotNull(message = "promisedDate is required") LocalDate promisedDate,
        @NotNull(message = "serviceTasks is required") @Valid List<ServiceTaskRequest> serviceTasks
) {
}
