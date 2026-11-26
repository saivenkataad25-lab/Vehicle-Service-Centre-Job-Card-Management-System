package com.vsc.jobcard.controller;

import com.vsc.jobcard.dto.response.JobCardResponse;
import com.vsc.jobcard.service.JobCardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final JobCardService jobCardService;

    public ReportController(JobCardService jobCardService) {
        this.jobCardService = jobCardService;
    }

    @GetMapping("/completed-job-cards")
    public List<JobCardResponse> completedJobCards() {
        return jobCardService.findCompleted();
    }
}
