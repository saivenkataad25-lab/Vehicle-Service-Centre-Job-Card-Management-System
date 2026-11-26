package com.vsc.jobcard.service;

import com.vsc.jobcard.dto.request.VehicleRequest;
import com.vsc.jobcard.dto.response.VehicleResponse;
import com.vsc.jobcard.entity.Customer;
import com.vsc.jobcard.entity.Vehicle;
import com.vsc.jobcard.exception.ConflictException;
import com.vsc.jobcard.exception.ResourceNotFoundException;
import com.vsc.jobcard.repository.CustomerRepository;
import com.vsc.jobcard.repository.ServiceBookingRepository;
import com.vsc.jobcard.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final ServiceBookingRepository bookingRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          CustomerRepository customerRepository,
                          ServiceBookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<VehicleResponse> findAll(Long customerId, String search) {
        String term = normalize(search);
        return vehicleRepository.findAll().stream()
                .filter(vehicle -> customerId == null || vehicle.getCustomer().getId().equals(customerId))
                .filter(vehicle -> term.isEmpty() || normalize(vehicle.getRegistrationNumber()).contains(term)
                        || normalize(vehicle.getMake()).contains(term)
                        || normalize(vehicle.getModel()).contains(term))
                .map(this::toResponse)
                .toList();
    }

    public VehicleResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        String registrationNumber = request.registrationNumber().trim();
        if (vehicleRepository.existsByRegistrationNumber(registrationNumber)) {
            throw new ConflictException("Vehicle registration number already exists");
        }
        Customer customer = findCustomer(request.customerId());
        Vehicle vehicle = new Vehicle();
        apply(vehicle, request, customer);
        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle vehicle = findEntity(id);
        String registrationNumber = request.registrationNumber().trim();
        if (!registrationNumber.equals(vehicle.getRegistrationNumber())
                && vehicleRepository.existsByRegistrationNumber(registrationNumber)) {
            throw new ConflictException("Vehicle registration number already exists");
        }
        Customer customer = findCustomer(request.customerId());
        apply(vehicle, request, customer);
        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = findEntity(id);
        if (bookingRepository.existsByVehicle_Id(vehicle.getId())) {
            throw new ConflictException("Vehicle cannot be deleted because linked bookings exist");
        }
        vehicleRepository.delete(vehicle);
    }

    private Vehicle findEntity(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id " + id));
    }

    private Customer findCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + id));
    }

    private void apply(Vehicle vehicle, VehicleRequest request, Customer customer) {
        vehicle.setRegistrationNumber(request.registrationNumber().trim());
        vehicle.setMake(request.make().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setYear(request.year());
        vehicle.setFuelType(request.fuelType().trim());
        vehicle.setCustomer(customer);
        vehicle.setOdometerReading(request.odometerReading());
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        Customer customer = vehicle.getCustomer();
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getRegistrationNumber(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getFuelType(),
                customer.getId(),
                customer.getFullName(),
                vehicle.getOdometerReading()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
