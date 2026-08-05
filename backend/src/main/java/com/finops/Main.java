package com.finops;

import com.finops.model.Customer;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        CustomerDAO dao = new CustomerDAOImpl();

        System.out.println("==================================================");
        System.out.println("            CRUD OPERATION TEST SUITE             ");
        System.out.println("==================================================");

        
        System.out.println("\n[Test 1] - Add Customer...");
        Customer customer = new Customer();
        customer.setCustomerName("Ayush");
        customer.setEmail("ayush@gmail.com");
        customer.setMobile("9876543210");
        customer.setCity("Delhi");
        customer.setStatus("ACTIVE");

        boolean inserted = dao.addCustomer(customer);
        if (inserted) {
            System.out.println("Result: Customer successfully added to the database!");
        } else {
            System.err.println("Result: Failed to add customer.");
            return;
        }
 
        System.out.println("\n[Test 2] - List All Customers (Verify Database Content)...");
        List<Customer> allCustomers = dao.getAllCustomers();
        System.out.println("ID\tNAME\tEMAIL\t\tMOBILE\t\tCITY\tSTATUS");
        System.out.println("------------------------------------------------------------------");
        Customer targetCustomer = null;
        for (Customer c : allCustomers) {
            System.out.printf("%d\t%s\t%s\t%s\t%s\t%s%n",
                    c.getCustomerId(), c.getCustomerName(), c.getEmail(), c.getMobile(), c.getCity(), c.getStatus());
            
           
            if ("Ayush".equals(c.getCustomerName()) && "9876543210".equals(c.getMobile())) {
                targetCustomer = c;
            }
        }

        if (targetCustomer == null) {
            System.err.println("Could not find the inserted customer in the database list!");
            return;
        }

        int targetId = targetCustomer.getCustomerId();
 
        System.out.println("\n[Test 3] - Fetch Customer by ID (" + targetId + ")...");
        Customer fetched = dao.getCustomerById(targetId);
        if (fetched != null) {
            System.out.printf("Fetched: ID: %d, Name: %s, Email: %s, Status: %s%n",
                    fetched.getCustomerId(), fetched.getCustomerName(), fetched.getEmail(), fetched.getStatus());
        } else {
            System.err.println("Failed to fetch customer by ID.");
        }

       
        System.out.println("\n[Test 4] - Update Customer (Change City to 'Noida' and Status to 'INACTIVE')...");
        targetCustomer.setCity("Noida");
        targetCustomer.setStatus("INACTIVE");
        dao.updateCustomer(targetCustomer);
 
        Customer updated = dao.getCustomerById(targetId);
        if (updated != null) {
            System.out.printf("Updated Record: ID: %d, Name: %s, City: %s, Status: %s%n",
                    updated.getCustomerId(), updated.getCustomerName(), updated.getCity(), updated.getStatus());
        } else {
            System.err.println("Failed to fetch updated customer.");
        }

         
        System.out.println("\n[Test 5] - Delete Customer (ID: " + targetId + ")...");
        dao.deleteCustomer(targetId);

       
        Customer deleted = dao.getCustomerById(targetId);
        if (deleted == null) {
            System.out.println("Result: Customer successfully deleted (No record found for ID: " + targetId + ").");
        } else {
            System.err.println("Failed to delete customer. Record still exists.");
        }

        System.out.println("\n==================================================");
        System.out.println("          ALL CRUD TESTS COMPLETED SUCCESSFULLY   ");
        System.out.println("==================================================");
    }
}
