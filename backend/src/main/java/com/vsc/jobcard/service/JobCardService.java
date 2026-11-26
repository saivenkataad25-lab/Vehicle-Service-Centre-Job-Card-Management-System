package com.vsc.jobcard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vsc.jobcard.dto.request.JobCardCreateRequest;
import com.vsc.jobcard.dto.request.JobCardUpdateRequest;
import com.vsc.jobcard.dto.request.ServiceTaskRequest;
import com.vsc.jobcard.dto.response.JobCardResponse;
import com.vsc.jobcard.dto.response.ServiceTaskResponse;
import com.vsc.jobcard.dto.response.StatusHistoryEntryResponse;
import com.vsc.jobcard.entity.JobCard;
import com.vsc.jobcard.entity.ServiceBooking;
import com.vsc.jobcard.entity.Technician;
import com.vsc.jobcard.enums.BookingStatus;
import com.vsc.jobcard.enums.JobStatus;
import com.vsc.jobcard.enums.TechnicianAvailability;
import com.vsc.jobcard.exception.ConflictException;
import com.vsc.jobcard.exception.ResourceNotFoundException;
import com.vsc.jobcard.repository.JobCardRepository;
import com.vsc.jobcard.repository.ServiceBookingRepository;
import com.vsc.jobcard.repository.TechnicianRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class JobCardService {

    private static final List<JobStatus> CLOSED_STATUSES = List.of(JobStatus.COMPLETED, JobStatus.DELIVERED);
    private static final TypeReference<List<ServiceTaskResponse>> TASKS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<StatusHistoryEntryResponse>> HISTORY_TYPE = new TypeReference<>() {};

    private final JobCardRepository jobCardRepository;
    private final ServiceBookingRepository bookingRepository;
    private final TechnicianRepository technicianRepository;
    private final ObjectMapper objectMapper;

    public JobCardService(
            JobCardRepository jobCardRepository,
            ServiceBookingRepository bookingRepository,
            TechnicianRepository technicianRepository,
            ObjectMapper objectMapper
    ) {
        this.jobCardRepository = jobCardRepository;
        this.bookingRepository = bookingRepository;
        this.technicianRepository = technicianRepository;
        this.objectMapper = objectMapper;
    }

    public List<JobCardResponse> findAll(JobStatus status, Boolean overdue, Long technicianId) {
        Stream<JobCard> cards;
        if (Boolean.TRUE.equals(overdue)) {
            cards = jobCardRepository.findOverdue(LocalDate.now(), CLOSED_STATUSES).stream();
        } else {
            cards = jobCardRepository.findAll().stream();
        }
        return cards
                .filter(card -> status == null || card.getJobStatus() == status)
                .filter(card -> technicianId == null || Objects.equals(assignedTechnicianId(card), technicianId))
                .sorted(Comparator.comparing(JobCard::getPromisedDate).thenComparing(JobCard::getId))
                .map(this::toResponse)
                .toList();
    }

    public JobCardResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    public List<JobCardResponse> findOverdue() {
        return toResponses(jobCardRepository.findOverdue(LocalDate.now(), CLOSED_STATUSES).stream());
    }

    public List<JobCardResponse> findUpcoming() {
        return toResponses(jobCardRepository.findUpcoming(LocalDate.now(), CLOSED_STATUSES).stream());
    }

    public List<JobCardResponse> findCompleted() {
        return toResponses(jobCardRepository.findByStatuses(CLOSED_STATUSES).stream());
    }

    @Transactional
    public JobCardResponse create(JobCardCreateRequest request) {
        ServiceBooking booking = findBooking(request.bookingId());
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Job card can only be created from a CONFIRMED booking");
        }
        if (jobCardRepository.existsByBooking_Id(booking.getId())) {
            throw new ConflictException("Booking already has a job card");
        }
        validateDates(request.openedDate(), request.promisedDate());

        Technician technician = findTechnicianForNewAssignment(request.technicianId());
        List<ServiceTaskResponse> tasks = calculateTasks(request.serviceTasks());
        BigDecimal labourEstimate = sumAmounts(tasks);

        JobCard card = new JobCard();
        card.setJobCardNumber(generateJobCardNumber(request.openedDate()));
        card.setBooking(booking);
        card.setTechnician(technician);
        card.setOpenedDate(request.openedDate());
        card.setPromisedDate(request.promisedDate());
        card.setLabourEstimate(labourEstimate);
        card.setJobStatus(JobStatus.OPEN);
        card.setCompletionNotes(null);
        card.setServiceTasksJson(writeJson(tasks));
        card.setStatusHistoryJson(writeJson(List.of(
                historyEntry(null, JobStatus.OPEN, "Job card opened")
        )));

        booking.setBookingStatus(BookingStatus.CONVERTED);
        return toResponse(jobCardRepository.save(card));
    }

    @Transactional
    public JobCardResponse update(Long id, JobCardUpdateRequest request) {
        JobCard card = findEntity(id);
        if (card.getJobStatus() == JobStatus.DELIVERED) {
            throw new ConflictException("Delivered job card cannot be edited");
        }
        validateDates(request.openedDate(), request.promisedDate());

        JobStatus currentStatus = card.getJobStatus();
        JobStatus targetStatus = request.jobStatus();
        if (currentStatus != targetStatus && !isTransitionAllowed(currentStatus, targetStatus)) {
            throw new ConflictException("Invalid job status transition: " + currentStatus + " to " + targetStatus);
        }

        Technician technician = resolveTechnicianChange(card, request.technicianId());
        List<ServiceTaskResponse> tasks = calculateTasks(request.serviceTasks());
        BigDecimal labourEstimate = sumAmounts(tasks);
        String completionNotes = resolveCompletionNotes(card, request.completionNotes(), targetStatus);
        if (targetStatus == JobStatus.COMPLETED && isBlank(completionNotes)) {
            throw new ConflictException("Completion notes are required when completing a job card");
        }

        List<StatusHistoryEntryResponse> history = readHistory(card.getStatusHistoryJson());
        if (currentStatus != targetStatus) {
            history.add(historyEntry(currentStatus, targetStatus, "Job card status changed to " + targetStatus));
        }

        card.setTechnician(technician);
        card.setOpenedDate(request.openedDate());
        card.setPromisedDate(request.promisedDate());
        card.setLabourEstimate(labourEstimate);
        card.setJobStatus(targetStatus);
        card.setCompletionNotes(completionNotes);
        card.setServiceTasksJson(writeJson(tasks));
        card.setStatusHistoryJson(writeJson(history));
        return toResponse(jobCardRepository.save(card));
    }

    @Transactional
    public void delete(Long id) {
        JobCard card = findEntity(id);
        if (card.getJobStatus() == JobStatus.COMPLETED || card.getJobStatus() == JobStatus.DELIVERED) {
            throw new ConflictException("Completed or delivered job card cannot be deleted");
        }
        card.getBooking().setBookingStatus(BookingStatus.CONFIRMED);
        jobCardRepository.delete(card);
    }

    private JobCard findEntity(Long id) {
        return jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id " + id));
    }

    private ServiceBooking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + id));
    }

    private Technician findTechnicianForNewAssignment(Long technicianId) {
        if (technicianId == null) {
            return null;
        }
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id " + technicianId));
        if (technician.getAvailabilityStatus() != TechnicianAvailability.AVAILABLE) {
            throw new ConflictException("Unavailable technician cannot be newly assigned");
        }
        return technician;
    }

    private Technician resolveTechnicianChange(JobCard card, Long requestedTechnicianId) {
        Long currentTechnicianId = assignedTechnicianId(card);
        if (Objects.equals(currentTechnicianId, requestedTechnicianId)) {
            return card.getTechnician();
        }
        return findTechnicianForNewAssignment(requestedTechnicianId);
    }

    private Long assignedTechnicianId(JobCard card) {
        return card.getTechnician() == null ? null : card.getTechnician().getId();
    }

    private void validateDates(LocalDate openedDate, LocalDate promisedDate) {
        if (promisedDate.isBefore(openedDate)) {
            throw new ConflictException("Promised date cannot be earlier than opened date");
        }
    }

    private boolean isTransitionAllowed(JobStatus current, JobStatus target) {
        return switch (current) {
            case OPEN -> target == JobStatus.IN_PROGRESS || target == JobStatus.ON_HOLD;
            case IN_PROGRESS -> target == JobStatus.ON_HOLD || target == JobStatus.COMPLETED;
            case ON_HOLD -> target == JobStatus.IN_PROGRESS;
            case COMPLETED -> target == JobStatus.DELIVERED;
            case DELIVERED -> false;
        };
    }

    private String resolveCompletionNotes(JobCard card, String requestedNotes, JobStatus targetStatus) {
        if (!isBlank(requestedNotes)) {
            return requestedNotes.trim();
        }
        if (targetStatus == JobStatus.COMPLETED && !isBlank(card.getCompletionNotes())) {
            return card.getCompletionNotes();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private List<ServiceTaskResponse> calculateTasks(List<ServiceTaskRequest> requests) {
        List<ServiceTaskResponse> tasks = new ArrayList<>();
        for (ServiceTaskRequest request : requests) {
            if (request.estimatedHours().compareTo(BigDecimal.ZERO) < 0
                    || request.hourlyRate().compareTo(BigDecimal.ZERO) < 0) {
                throw new ConflictException("Task hours and rates cannot be negative");
            }
            BigDecimal amount = request.estimatedHours()
                    .multiply(request.hourlyRate())
                    .setScale(2, RoundingMode.HALF_UP);
            tasks.add(new ServiceTaskResponse(
                    request.taskName().trim(),
                    request.description().trim(),
                    request.estimatedHours(),
                    request.hourlyRate(),
                    amount
            ));
        }
        return tasks;
    }

    private BigDecimal sumAmounts(List<ServiceTaskResponse> tasks) {
        return tasks.stream()
                .map(ServiceTaskResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private StatusHistoryEntryResponse historyEntry(JobStatus from, JobStatus to, String note) {
        String changedAt = LocalDateTime.now().withNano(0).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        return new StatusHistoryEntryResponse(
                from == null ? null : from.name(),
                to.name(),
                changedAt,
                note
        );
    }

    private String generateJobCardNumber(LocalDate openedDate) {
        String prefix = "JC-" + openedDate.getYear() + "-";
        for (int sequence = 1; sequence <= 9999; sequence++) {
            String candidate = prefix + String.format("%04d", sequence);
            if (!jobCardRepository.existsByJobCardNumber(candidate)) {
                return candidate;
            }
        }
        throw new ConflictException("No job card numbers available");
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize job card data", exception);
        }
    }

    private List<ServiceTaskResponse> readTasks(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, TASKS_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to read service tasks", exception);
        }
    }

    private List<StatusHistoryEntryResponse> readHistory(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return new ArrayList<>(objectMapper.readValue(json, HISTORY_TYPE));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to read status history", exception);
        }
    }

    private List<JobCardResponse> toResponses(Stream<JobCard> cards) {
        return cards
                .sorted(Comparator.comparing(JobCard::getPromisedDate).thenComparing(JobCard::getId))
                .map(this::toResponse)
                .toList();
    }

    private JobCardResponse toResponse(JobCard card) {
        Long technicianId = assignedTechnicianId(card);
        String technicianName = card.getTechnician() == null ? null : card.getTechnician().getFullName();
        return new JobCardResponse(
                card.getId(),
                card.getJobCardNumber(),
                card.getBooking().getId(),
                card.getBooking().getBookingNumber(),
                technicianId,
                technicianName,
                card.getOpenedDate(),
                card.getPromisedDate(),
                card.getLabourEstimate(),
                card.getJobStatus(),
                card.getCompletionNotes(),
                readTasks(card.getServiceTasksJson()),
                readHistory(card.getStatusHistoryJson())
        );
    }
}
