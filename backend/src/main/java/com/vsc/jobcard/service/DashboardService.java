package com.vsc.jobcard.service;

import com.vsc.jobcard.dto.response.DashboardSummaryResponse;
import com.vsc.jobcard.dto.response.JobCardResponse;
import com.vsc.jobcard.dto.response.JobStatusCountResponse;
import com.vsc.jobcard.enums.JobStatus;
import com.vsc.jobcard.repository.CustomerRepository;
import com.vsc.jobcard.repository.JobCardRepository;
import com.vsc.jobcard.repository.ServiceBookingRepository;
import com.vsc.jobcard.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceBookingRepository bookingRepository;
    private final JobCardRepository jobCardRepository;
    private final JobCardService jobCardService;

    public DashboardService(
            CustomerRepository customerRepository,
            VehicleRepository vehicleRepository,
            ServiceBookingRepository bookingRepository,
            JobCardRepository jobCardRepository,
            JobCardService jobCardService
    ) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
        this.jobCardRepository = jobCardRepository;
        this.jobCardService = jobCardService;
    }

    public DashboardSummaryResponse summary() {
        return new DashboardSummaryResponse(
                customerRepository.count(),
                vehicleRepository.count(),
                bookingRepository.count(),
                jobCardRepository.count(),
                jobCardService.findOverdue().size(),
                jobCardService.findUpcoming().size()
        );
    }

    public List<JobStatusCountResponse> jobStatusCounts() {
        return Arrays.stream(JobStatus.values())
                .map(status -> new JobStatusCountResponse(status.name(), jobCardRepository.countByStatus(status)))
                .toList();
    }

    public List<JobCardResponse> delayedJobs() {
        return jobCardService.findOverdue();
    }

    public List<JobCardResponse> upcomingJobs() {
        return jobCardService.findUpcoming();
    }
}
