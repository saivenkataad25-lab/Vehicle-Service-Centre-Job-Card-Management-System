package com.vsc.jobcard.dto.response;

import com.vsc.jobcard.enums.TechnicianAvailability;

public record TechnicianResponse(
        Long id,
        String technicianCode,
        String fullName,
        String skillArea,
        String phone,
        TechnicianAvailability availabilityStatus
) {
}
