package com.finops.repo;

import com.finops.model.Customer;
import java.util.List;

public interface CustomerDAO {
    boolean addCustomer(Customer customer);
    List<Customer> getAllCustomers();
    Customer getCustomerById(int id);
    void updateCustomer(Customer customer);
    void deleteCustomer(int id);
}
