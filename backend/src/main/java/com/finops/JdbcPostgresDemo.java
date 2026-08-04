package com.finops;

import com.finops.model.Customer;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;

public class JdbcPostgresDemo {
    public static void main(String[] args) {
        CustomerDAO dao = new CustomerDAOImpl();

        Customer customer = new Customer();
        customer.setCustomerName("Ayush");
        customer.setEmail("ayush@gmail.com");
        customer.setMobile("9876543210");
        customer.setCity("Delhi");
        customer.setStatus("ACTIVE");

        dao.addCustomer(customer);

        System.out.println("Inserted customer and retrieving all records:");
        dao.getAllCustomers().forEach(c ->
                System.out.printf("%d %s %s %s %s %s%n",
                        c.getCustomerId(), c.getCustomerName(), c.getEmail(), c.getMobile(), c.getCity(), c.getStatus()));
    }
}
