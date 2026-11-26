package com.vsc.jobcard.service;

import com.vsc.jobcard.dto.request.CustomerRequest;
import com.vsc.jobcard.dto.response.CustomerResponse;
import com.vsc.jobcard.entity.Customer;
import com.vsc.jobcard.exception.ConflictException;
import com.vsc.jobcard.exception.ResourceNotFoundException;
import com.vsc.jobcard.repository.CustomerRepository;
import com.vsc.jobcard.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;

    public CustomerService(CustomerRepository customerRepository, VehicleRepository vehicleRepository) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<CustomerResponse> findAll(String search) {
        String term = normalize(search);
        return customerRepository.findAll().stream()
                .filter(customer -> term.isEmpty() || normalize(customer.getCustomerCode()).contains(term)
                        || normalize(customer.getFullName()).contains(term)
                        || normalize(customer.getPhone()).contains(term))
                .map(this::toResponse)
                .toList();
    }

    public CustomerResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        String code = request.customerCode().trim();
        if (customerRepository.existsByCustomerCode(code)) {
            throw new ConflictException("Customer code already exists");
        }
        Customer customer = new Customer();
        apply(customer, request);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findEntity(id);
        String code = request.customerCode().trim();
        if (!code.equals(customer.getCustomerCode()) && customerRepository.existsByCustomerCode(code)) {
            throw new ConflictException("Customer code already exists");
        }
        apply(customer, request);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = findEntity(id);
        if (vehicleRepository.existsByCustomer_Id(customer.getId())) {
            throw new ConflictException("Customer cannot be deleted because linked vehicles exist");
        }
        customerRepository.delete(customer);
    }

    private Customer findEntity(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + id));
    }

    private void apply(Customer customer, CustomerRequest request) {
        customer.setCustomerCode(request.customerCode().trim());
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setEmail(request.email().trim());
        customer.setAddress(request.address().trim());
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
