package com.vsc.jobcard.dto.response;

import java.math.BigDecimal;

public record ServiceTaskResponse(
        String taskName,
        String description,
        BigDecimal estimatedHours,
        BigDecimal hourlyRate,
        BigDecimal amount
) {
}
