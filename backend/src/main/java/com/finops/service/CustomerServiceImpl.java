package com.finops.service;

import com.finops.model.Customer;
import com.finops.model.CustomerPage;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;

import java.util.List;

public class CustomerServiceImpl implements CustomerService {
    private final CustomerDAO customerDAO;

    public CustomerServiceImpl() {
        this(new CustomerDAOImpl());
    }

    public CustomerServiceImpl(CustomerDAO customerDAO) {
        this.customerDAO = customerDAO;
    }

    @Override
    public Customer createCustomer(Customer customer) {
        validate(customer);
        normalizeStatus(customer);

        if (!customerDAO.addCustomer(customer)) {
            throw new IllegalStateException("Customer creation failed");
        }
        return customer;
    }

    @Override
    public List<Customer> getAllCustomers() {
        return customerDAO.getAllCustomers();
    }

    @Override
    public CustomerPage searchCustomers(int page, int size, String search, String status, String kycStatus) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return customerDAO.searchCustomers(safePage, safeSize, search, status, kycStatus);
    }

    @Override
    public Customer getCustomerById(int customerId) {
        validateId(customerId);
        Customer customer = customerDAO.getCustomerById(customerId);
        if (customer == null) {
            throw new CustomerNotFoundException(customerId);
        }
        return customer;
    }

    @Override
    public Customer updateCustomer(int customerId, Customer customer) {
        validateId(customerId);
        validate(customer);
        normalizeStatus(customer);
        getCustomerById(customerId);
        customer.setCustomerId(customerId);

        if (!customerDAO.updateCustomer(customer)) {
            throw new IllegalStateException("Customer update failed");
        }
        return customer;
    }

    @Override
    public void deleteCustomer(int customerId) {
        validateId(customerId);
        getCustomerById(customerId);
        if (!customerDAO.deleteCustomer(customerId)) {
            throw new IllegalStateException("Customer deletion failed");
        }
    }

    private void validate(Customer customer) {
        if (customer == null || customer.getCustomerName() == null
                || customer.getCustomerName().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (customer.getEmail() == null || customer.getEmail().isBlank()
                || !customer.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("A valid customer email is required");
        }
        if (customer.getMobile() == null || customer.getMobile().isBlank()) {
            throw new IllegalArgumentException("Customer mobile is required");
        }
    }

    private void normalizeStatus(Customer customer) {
        if (customer.getStatus() == null || customer.getStatus().isBlank()) {
            customer.setStatus("ACTIVE");
        } else {
            customer.setStatus(customer.getStatus().toUpperCase());
        }
    }

    private void validateId(int customerId) {
        if (customerId <= 0) {
            throw new IllegalArgumentException("Invalid customer ID");
        }
    }

    public static class CustomerNotFoundException extends RuntimeException {
        public CustomerNotFoundException(int customerId) {
            super("Customer not found: " + customerId);
        }
    }
}
