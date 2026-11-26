package com.vsc.jobcard.repository;

import com.vsc.jobcard.entity.ServiceBooking;
import com.vsc.jobcard.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceBookingRepository extends JpaRepository<ServiceBooking, Long> {
    Optional<ServiceBooking> findByBookingNumber(String bookingNumber);
    boolean existsByBookingNumber(String bookingNumber);
    boolean existsByVehicle_Id(Long vehicleId);
    List<ServiceBooking> findByVehicle_Id(Long vehicleId);
    List<ServiceBooking> findByBookingStatus(BookingStatus bookingStatus);
}
