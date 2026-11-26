package com.vsc.jobcard.dto.response;

public record CustomerResponse(
        Long id,
        String customerCode,
        String fullName,
        String phone,
        String email,
        String address
) {
}
