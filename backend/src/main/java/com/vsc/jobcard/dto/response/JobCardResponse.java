package com.vsc.jobcard.dto.response;

import com.vsc.jobcard.enums.JobStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record JobCardResponse(
        Long id,
        String jobCardNumber,
        Long bookingId,
        String bookingNumber,
        Long technicianId,
        String technicianName,
        LocalDate openedDate,
        LocalDate promisedDate,
        BigDecimal labourEstimate,
        JobStatus jobStatus,
        String completionNotes,
        List<ServiceTaskResponse> serviceTasks,
        List<StatusHistoryEntryResponse> statusHistory
) {
}
