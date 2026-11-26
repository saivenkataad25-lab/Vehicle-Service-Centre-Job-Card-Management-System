package com.vsc.jobcard.dto.response;

import com.vsc.jobcard.enums.BookingStatus;

import java.time.LocalDate;

public record BookingResponse(
        Long id,
        String bookingNumber,
        Long vehicleId,
        String registrationNumber,
        String vehicleDescription,
        LocalDate bookingDate,
        LocalDate preferredDate,
        String complaint,
        BookingStatus bookingStatus
) {
}
