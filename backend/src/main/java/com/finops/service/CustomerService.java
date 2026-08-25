package com.finops.service;

import com.finops.model.Customer;
import com.finops.model.CustomerPage;

import java.util.List;

public interface CustomerService {
    Customer createCustomer(Customer customer);

    List<Customer> getAllCustomers();

    CustomerPage searchCustomers(int page, int size, String search, String status, String kycStatus);

    Customer getCustomerById(int customerId);

    Customer updateCustomer(int customerId, Customer customer);

    void deleteCustomer(int customerId);
}
