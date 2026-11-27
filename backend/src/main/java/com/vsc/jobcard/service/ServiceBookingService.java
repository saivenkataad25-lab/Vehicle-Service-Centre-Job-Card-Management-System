package com.vsc.jobcard.service;

import com.vsc.jobcard.dto.request.BookingRequest;
import com.vsc.jobcard.dto.response.BookingResponse;
import com.vsc.jobcard.entity.ServiceBooking;
import com.vsc.jobcard.entity.Vehicle;
import com.vsc.jobcard.enums.BookingStatus;
import com.vsc.jobcard.exception.ConflictException;
import com.vsc.jobcard.exception.ResourceNotFoundException;
import com.vsc.jobcard.repository.JobCardRepository;
import com.vsc.jobcard.repository.ServiceBookingRepository;
import com.vsc.jobcard.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class ServiceBookingService {

    private final ServiceBookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final JobCardRepository jobCardRepository;

    public ServiceBookingService(
            ServiceBookingRepository bookingRepository,
            VehicleRepository vehicleRepository,
            JobCardRepository jobCardRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.jobCardRepository = jobCardRepository;
    }

    public List<BookingResponse> findAll(Long vehicleId, BookingStatus status) {
        return bookingRepository.findAll().stream()
                .filter(booking -> vehicleId == null || Objects.equals(booking.getVehicle().getId(), vehicleId))
                .filter(booking -> status == null || booking.getBookingStatus() == status)
                .sorted(Comparator.comparing(ServiceBooking::getPreferredDate)
                        .thenComparing(ServiceBooking::getId))
                .map(this::toResponse)
                .toList();
    }

    public BookingResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public BookingResponse create(BookingRequest request) {
        String bookingNumber = request.bookingNumber().trim();
        if (bookingRepository.existsByBookingNumber(bookingNumber)) {
            throw new ConflictException("Booking number already exists");
        }
        if (request.bookingStatus() != BookingStatus.PENDING && request.bookingStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Initial booking status must be PENDING or CONFIRMED");
        }
        Vehicle vehicle = findVehicle(request.vehicleId());
        validateDates(request.bookingDate(), request.preferredDate());

        ServiceBooking booking = new ServiceBooking();
        apply(booking, request, vehicle);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse update(Long id, BookingRequest request) {
        ServiceBooking booking = findEntity(id);
        if (booking.getBookingStatus() == BookingStatus.CONVERTED) {
            throw new ConflictException("Converted booking cannot be edited");
        }
        if (request.bookingStatus() == BookingStatus.CONVERTED) {
            throw new ConflictException("Booking status cannot be set to CONVERTED directly");
        }
        if (booking.getBookingStatus() == BookingStatus.CANCELLED
                && request.bookingStatus() != BookingStatus.CANCELLED) {
            throw new ConflictException("Cancelled booking cannot be changed to another status");
        }

        String bookingNumber = request.bookingNumber().trim();
        if (!bookingNumber.equals(booking.getBookingNumber())
                && bookingRepository.existsByBookingNumber(bookingNumber)) {
            throw new ConflictException("Booking number already exists");
        }
        Vehicle vehicle = findVehicle(request.vehicleId());
        validateDates(request.bookingDate(), request.preferredDate());
        apply(booking, request, vehicle);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse cancel(Long id) {
        ServiceBooking booking = findEntity(id);
        if (booking.getBookingStatus() != BookingStatus.PENDING
                && booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Only pending or confirmed bookings can be cancelled");
        }
        booking.setBookingStatus(BookingStatus.CANCELLED);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public void delete(Long id) {
        ServiceBooking booking = findEntity(id);
        if (jobCardRepository.existsByBooking_Id(booking.getId())) {
            throw new ConflictException("Booking cannot be deleted because a job card exists");
        }
        bookingRepository.delete(booking);
    }

    private ServiceBooking findEntity(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + id));
    }

    private Vehicle findVehicle(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id " + id));
    }

    private void validateDates(LocalDate bookingDate, LocalDate preferredDate) {
        if (preferredDate.isBefore(bookingDate)) {
            throw new ConflictException("Preferred date cannot be earlier than booking date");
        }
    }

    private void apply(ServiceBooking booking, BookingRequest request, Vehicle vehicle) {
        booking.setBookingNumber(request.bookingNumber().trim());
        booking.setVehicle(vehicle);
        booking.setBookingDate(request.bookingDate());
        booking.setPreferredDate(request.preferredDate());
        booking.setComplaint(request.complaint().trim());
        booking.setBookingStatus(request.bookingStatus());
    }

    private BookingResponse toResponse(ServiceBooking booking) {
        Vehicle vehicle = booking.getVehicle();
        return new BookingResponse(
                booking.getId(),
                booking.getBookingNumber(),
                vehicle.getId(),
                vehicle.getRegistrationNumber(),
                vehicle.getMake() + " " + vehicle.getModel(),
                booking.getBookingDate(),
                booking.getPreferredDate(),
                booking.getComplaint(),
                booking.getBookingStatus()
        );
    }

    @SuppressWarnings("unused")
    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
