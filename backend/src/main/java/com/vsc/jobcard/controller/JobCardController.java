package com.vsc.jobcard.controller;

import com.vsc.jobcard.dto.request.JobCardCreateRequest;
import com.vsc.jobcard.dto.request.JobCardUpdateRequest;
import com.vsc.jobcard.dto.response.JobCardResponse;
import com.vsc.jobcard.enums.JobStatus;
import com.vsc.jobcard.service.JobCardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/job-cards")
public class JobCardController {

    private final JobCardService jobCardService;

    public JobCardController(JobCardService jobCardService) {
        this.jobCardService = jobCardService;
    }

    @GetMapping
    public List<JobCardResponse> findAll(
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) Long technicianId
    ) {
        return jobCardService.findAll(status, overdue, technicianId);
    }

    @GetMapping("/{id}")
    public JobCardResponse findById(@PathVariable Long id) {
        return jobCardService.findById(id);
    }

    @PostMapping
    public ResponseEntity<JobCardResponse> create(@Valid @RequestBody JobCardCreateRequest request) {
        JobCardResponse response = jobCardService.create(request);
        return ResponseEntity.created(URI.create("/api/job-cards/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public JobCardResponse update(@PathVariable Long id, @Valid @RequestBody JobCardUpdateRequest request) {
        return jobCardService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jobCardService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
