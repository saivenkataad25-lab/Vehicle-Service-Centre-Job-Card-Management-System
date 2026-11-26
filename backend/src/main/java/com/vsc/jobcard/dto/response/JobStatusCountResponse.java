package com.vsc.jobcard.dto.response;

public record JobStatusCountResponse(
        String status,
        long count
) {
}
