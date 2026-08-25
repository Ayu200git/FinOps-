package com.finops.repo;

import com.finops.model.Customer;
import com.finops.model.CustomerPage;
import java.util.List;

public interface CustomerDAO {
    boolean addCustomer(Customer customer);
    List<Customer> getAllCustomers();
    CustomerPage searchCustomers(int page, int size, String search, String status, String kycStatus);
    Customer getCustomerById(int id);
    boolean updateCustomer(Customer customer);
    boolean deleteCustomer(int id);
}
