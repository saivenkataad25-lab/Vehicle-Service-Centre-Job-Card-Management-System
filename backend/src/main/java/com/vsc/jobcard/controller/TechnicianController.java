package com.vsc.jobcard.controller;

import com.vsc.jobcard.dto.request.TechnicianRequest;
import com.vsc.jobcard.dto.response.TechnicianResponse;
import com.vsc.jobcard.service.TechnicianService;
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
@RequestMapping("/api/technicians")
public class TechnicianController {

    private final TechnicianService technicianService;

    public TechnicianController(TechnicianService technicianService) {
        this.technicianService = technicianService;
    }

    @GetMapping
    public List<TechnicianResponse> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String availabilityStatus
    ) {
        return technicianService.findAll(search, availabilityStatus);
    }

    @GetMapping("/{id}")
    public TechnicianResponse findById(@PathVariable Long id) {
        return technicianService.findById(id);
    }

    @PostMapping
    public ResponseEntity<TechnicianResponse> create(@Valid @RequestBody TechnicianRequest request) {
        TechnicianResponse response = technicianService.create(request);
        return ResponseEntity.created(URI.create("/api/technicians/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public TechnicianResponse update(@PathVariable Long id, @Valid @RequestBody TechnicianRequest request) {
        return technicianService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        technicianService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
