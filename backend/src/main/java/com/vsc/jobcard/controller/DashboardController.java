package com.vsc.jobcard.controller;

import com.vsc.jobcard.dto.response.DashboardSummaryResponse;
import com.vsc.jobcard.dto.response.JobCardResponse;
import com.vsc.jobcard.dto.response.JobStatusCountResponse;
import com.vsc.jobcard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }

    @GetMapping("/job-status-counts")
    public List<JobStatusCountResponse> jobStatusCounts() {
        return dashboardService.jobStatusCounts();
    }

    @GetMapping("/delayed-jobs")
    public List<JobCardResponse> delayedJobs() {
        return dashboardService.delayedJobs();
    }

    @GetMapping("/upcoming-jobs")
    public List<JobCardResponse> upcomingJobs() {
        return dashboardService.upcomingJobs();
    }
}
