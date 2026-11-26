package com.vsc.jobcard.dto.request;

import com.vsc.jobcard.enums.JobStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record JobCardUpdateRequest(
        Long technicianId,
        @NotNull(message = "openedDate is required") LocalDate openedDate,
        @NotNull(message = "promisedDate is required") LocalDate promisedDate,
        @NotNull(message = "jobStatus is required") JobStatus jobStatus,
        @Size(max = 2000) String completionNotes,
        @NotNull(message = "serviceTasks is required") @Valid List<ServiceTaskRequest> serviceTasks
) {
}
