package com.vsc.jobcard.dto.response;

public record StatusHistoryEntryResponse(
        String fromStatus,
        String toStatus,
        String changedAt,
        String note
) {
}
