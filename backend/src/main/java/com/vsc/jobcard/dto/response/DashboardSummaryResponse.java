package com.vsc.jobcard.dto.response;

public record DashboardSummaryResponse(
        long customers,
        long vehicles,
        long bookings,
        long jobCards,
        long overdueJobs,
        long upcomingJobs
) {
}
