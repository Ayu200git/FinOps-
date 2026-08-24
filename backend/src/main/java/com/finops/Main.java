package com.finops;

import com.finops.model.Customer;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;
import com.finops.servlet.CustomerServlet;
import com.finops.servlet.LoginServlet;
import com.finops.servlet.LogoutServlet;
import java.util.List;
import java.io.File;
import com.finops.filter.AuthenticationFilter;
import com.finops.filter.AuthorizationFilter;
import com.finops.servlet.KycServlet;

import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;

import jakarta.servlet.DispatcherType;

import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;

public class Main {
    public static void main(String[] args) throws Exception {
        if (args != null && args.length > 0 && "server".equalsIgnoreCase(args[0])) {
            startServer();
            return;
        }

        CustomerDAO dao = new CustomerDAOImpl();
        
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

         
        System.out.println("          ALL CRUD TESTS COMPLETED SUCCESSFULLY   ");
        System.out.println(" "); 
    }

    private static void startServer() throws Exception {
        int port = 8080;
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
         
        tomcat.getConnector();
 
        File frontendDirectory = new File("frontend");
        if (!frontendDirectory.isDirectory()) {
            frontendDirectory = new File("../frontend");
        }
        String frontendDir = frontendDirectory.getCanonicalPath();
        System.out.println("Resolved frontendDir: " + frontendDir);
        tomcat.setBaseDir(new File(".").getAbsolutePath());

        Context ctx = tomcat.addContext("", new File(".").getAbsolutePath());
        ctx.setParentClassLoader(Main.class.getClassLoader());
 
        Tomcat.addServlet(ctx, "static", new com.finops.servlet.StaticFileServlet(frontendDir));
        ctx.addServletMappingDecoded("/*", "static");
 
        Tomcat.addServlet(ctx, "customerServlet", new CustomerServlet());
        ctx.addServletMappingDecoded("/api/customers/*", "customerServlet");

        Tomcat.addServlet(ctx, "loginServlet", new LoginServlet());
        ctx.addServletMappingDecoded("/api/login", "loginServlet");
 
        Tomcat.addServlet(ctx, "logoutServlet", new LogoutServlet());
        ctx.addServletMappingDecoded("/api/logout", "logoutServlet");

        Tomcat.addServlet(
        ctx,
        "kycServlet",
        new KycServlet()
);

ctx.addServletMappingDecoded(
        "/api/kyc/upload",
        "kycServlet"
);

        FilterDef authFilter = new FilterDef();

authFilter.setFilterName("AuthenticationFilter");
authFilter.setFilterClass(
        AuthenticationFilter.class.getName()
);

ctx.addFilterDef(authFilter);


FilterMap authMapping = new FilterMap();

authMapping.setFilterName("AuthenticationFilter");

authMapping.addURLPattern(
        "/api/customers/*"
);

authMapping.setDispatcher(
        DispatcherType.REQUEST.name()
);

ctx.addFilterMap(authMapping);

        tomcat.start();
        System.out.println("Server started at http://localhost:" + port);
        tomcat.getServer().await();
    }
}
