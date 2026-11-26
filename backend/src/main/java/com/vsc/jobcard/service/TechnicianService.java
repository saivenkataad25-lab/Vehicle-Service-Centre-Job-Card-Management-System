package com.vsc.jobcard.service;

import com.vsc.jobcard.dto.request.TechnicianRequest;
import com.vsc.jobcard.dto.response.TechnicianResponse;
import com.vsc.jobcard.entity.Technician;
import com.vsc.jobcard.exception.ConflictException;
import com.vsc.jobcard.exception.ResourceNotFoundException;
import com.vsc.jobcard.repository.JobCardRepository;
import com.vsc.jobcard.repository.TechnicianRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final JobCardRepository jobCardRepository;

    public TechnicianService(TechnicianRepository technicianRepository, JobCardRepository jobCardRepository) {
        this.technicianRepository = technicianRepository;
        this.jobCardRepository = jobCardRepository;
    }

    public List<TechnicianResponse> findAll(String search, String availabilityStatus) {
        String term = normalize(search);
        return technicianRepository.findAll().stream()
                .filter(technician -> availabilityStatus == null || availabilityStatus.isBlank()
                        || technician.getAvailabilityStatus().name().equalsIgnoreCase(availabilityStatus.trim()))
                .filter(technician -> term.isEmpty() || normalize(technician.getTechnicianCode()).contains(term)
                        || normalize(technician.getFullName()).contains(term)
                        || normalize(technician.getSkillArea()).contains(term))
                .map(this::toResponse)
                .toList();
    }

    public TechnicianResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public TechnicianResponse create(TechnicianRequest request) {
        String code = request.technicianCode().trim();
        if (technicianRepository.existsByTechnicianCode(code)) {
            throw new ConflictException("Technician code already exists");
        }
        Technician technician = new Technician();
        apply(technician, request);
        return toResponse(technicianRepository.save(technician));
    }

    @Transactional
    public TechnicianResponse update(Long id, TechnicianRequest request) {
        Technician technician = findEntity(id);
        String code = request.technicianCode().trim();
        if (!code.equals(technician.getTechnicianCode()) && technicianRepository.existsByTechnicianCode(code)) {
            throw new ConflictException("Technician code already exists");
        }
        apply(technician, request);
        return toResponse(technicianRepository.save(technician));
    }

    @Transactional
    public void delete(Long id) {
        Technician technician = findEntity(id);
        if (jobCardRepository.existsByTechnician_Id(technician.getId())) {
            throw new ConflictException("Technician cannot be deleted because linked job cards exist");
        }
        technicianRepository.delete(technician);
    }

    private Technician findEntity(Long id) {
        return technicianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id " + id));
    }

    private void apply(Technician technician, TechnicianRequest request) {
        technician.setTechnicianCode(request.technicianCode().trim());
        technician.setFullName(request.fullName().trim());
        technician.setSkillArea(request.skillArea().trim());
        technician.setPhone(request.phone().trim());
        technician.setAvailabilityStatus(request.availabilityStatus());
    }

    private TechnicianResponse toResponse(Technician technician) {
        return new TechnicianResponse(
                technician.getId(),
                technician.getTechnicianCode(),
                technician.getFullName(),
                technician.getSkillArea(),
                technician.getPhone(),
                technician.getAvailabilityStatus()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
