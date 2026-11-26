package com.vsc.jobcard.repository;

import com.vsc.jobcard.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);
    boolean existsByRegistrationNumber(String registrationNumber);
    boolean existsByCustomer_Id(Long customerId);
    List<Vehicle> findByCustomer_Id(Long customerId);
}
