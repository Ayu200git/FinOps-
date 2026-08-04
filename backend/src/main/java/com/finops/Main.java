package com.finops;

import com.finops.model.Customer;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;

public class Main {
    public static void main(String[] args) {
        CustomerDAO dao = new CustomerDAOImpl();

        Customer customer = new Customer();
        customer.setCustomerName("Ayush");
        customer.setEmail("ayush@gmail.com");
        customer.setMobile("9876543210");
        customer.setCity("Delhi");
        customer.setStatus("ACTIVE");

        boolean inserted = dao.addCustomer(customer);
        if (inserted) {
            System.out.println("Customer added.");
        } else {
            System.out.println("Failed to add customer.");
        }
    }
}
