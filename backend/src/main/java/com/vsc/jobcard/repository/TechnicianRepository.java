package com.vsc.jobcard.repository;

import com.vsc.jobcard.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByTechnicianCode(String technicianCode);
    boolean existsByTechnicianCode(String technicianCode);
}
