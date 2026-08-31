package com.finops.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finops.model.Customer;
// import com.finops.repo.CustomerDAO;
// import com.finops.repo.CustomerDAOImpl;
import com.finops.service.CustomerService;
import com.finops.service.CustomerServiceImpl;
import com.finops.service.CustomerServiceImpl.CustomerNotFoundException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Collections;
// import java.util.List;
// import java.util.Map;

public class CustomerServlet extends HttpServlet {

        private final CustomerService customerService = new CustomerServiceImpl();
    private final ObjectMapper mapper = new ObjectMapper();

    
    // OPTIONS
  
    @Override
    protected void doOptions(HttpServletRequest req,
                             HttpServletResponse resp)
            throws ServletException, IOException {

        setCors(resp);

        resp.setStatus(
                HttpServletResponse.SC_NO_CONTENT
        );
    }


    
    // GET
    

    @Override
    protected void doGet(HttpServletRequest req,
                         HttpServletResponse resp)
            throws ServletException, IOException {

        setCors(resp);

        resp.setContentType(
                "application/json;charset=UTF-8"
        );

          

        if (!isAuthenticated(req, resp)) {
            return;
        }

         
        String path = req.getPathInfo();

        // GET /api/customers
       

        if (path == null || path.equals("/")) {

            int page = parseQueryInt(req.getParameter("page"), 1);
            int size = parseQueryInt(req.getParameter("size"), 25);
            String search = req.getParameter("search");
            String status = req.getParameter("status");
            String kycStatus = req.getParameter("kycStatus");
            Object customers = (req.getParameter("page") == null && req.getParameter("size") == null
                    && search == null && status == null && kycStatus == null)
                    ? customerService.getAllCustomers()
                    : customerService.searchCustomers(page, size, search, status, kycStatus);

            mapper.writeValue(resp.getWriter(), customers);

            return;
        }

        
        // GET /api/customers/101
       

        String id = path.substring(1);

        try {

            int customerId =
                    Integer.parseInt(id);

            Customer customer =
                    customerService.getCustomerById(customerId);

            if (customer == null) {

                resp.setStatus(
                        HttpServletResponse.SC_NOT_FOUND
                );

                mapper.writeValue(
                        resp.getWriter(),
                        Collections.singletonMap(
                                "error",
                                "Customer not found"
                        )
                );

                return;
            }

            mapper.writeValue(
                    resp.getWriter(),
                    customer
            );

                } catch (CustomerNotFoundException e) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        mapper.writeValue(resp.getWriter(), Collections.singletonMap("error", "Customer not found"));
                } catch (NumberFormatException e) {

            resp.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Invalid customer ID"
                    )
            );
        }
    }

 
    // POST
     

    @Override
    protected void doPost(HttpServletRequest req,
                          HttpServletResponse resp)
            throws ServletException, IOException {

        setCors(resp);

        resp.setContentType(
                "application/json;charset=UTF-8"
        );

         
        // Authentication
     

        if (!isAuthenticated(req, resp)) {
            return;
        }

        try {

           

            Customer customer =
                    mapper.readValue(
                            req.getInputStream(),
                            Customer.class
                    );

           

            if (customer.getCustomerName() == null
                    || customer.getCustomerName().isBlank()) {

                resp.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                );

                mapper.writeValue(
                        resp.getWriter(),
                        Collections.singletonMap(
                                "error",
                                "Customer name is required"
                        )
                );

                return;
            }

             

            customerService.createCustomer(customer);

            

            resp.setStatus(
                    HttpServletResponse.SC_CREATED
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "message",
                            "Customer created successfully"
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            e.getMessage() != null ? e.getMessage() : "Invalid JSON payload"
                    )
            );
        }
    }


  
    // PUT
     

    @Override
    protected void doPut(HttpServletRequest req,
                         HttpServletResponse resp)
            throws ServletException, IOException {

        setCors(resp);

        resp.setContentType(
                "application/json;charset=UTF-8"
        );

       

        if (!isAuthenticated(req, resp)) {
            return;
        }
 
        String path =
                req.getPathInfo();

        if (path == null || path.equals("/")) {

            resp.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Customer ID is required"
                    )
            );

            return;
        }

        try {

            int customerId =
                    Integer.parseInt(
                            path.substring(1)
                    );
 
            Customer existing =
                    customerService.getCustomerById(customerId);

            if (existing == null) {

                resp.setStatus(
                        HttpServletResponse.SC_NOT_FOUND
                );

                mapper.writeValue(
                        resp.getWriter(),
                        Collections.singletonMap(
                                "error",
                                "Customer not found"
                        )
                );

                return;
            }
 
            Customer customer =
                    mapper.readValue(
                            req.getInputStream(),
                            Customer.class
                    );
 

            customer.setCustomerId(
                    customerId
            );

          
            // Update
           
            customerService.updateCustomer(customerId, customer);

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "message",
                            "Customer updated successfully"
                    )
            );

                } catch (CustomerNotFoundException e) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        mapper.writeValue(resp.getWriter(), Collections.singletonMap("error", "Customer not found"));
                } catch (IllegalArgumentException e) {
                        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        mapper.writeValue(resp.getWriter(), Collections.singletonMap("error", e.getMessage()));
        }
    }


    
    // DELETE
     

    @Override
    protected void doDelete(HttpServletRequest req,
                            HttpServletResponse resp)
            throws ServletException, IOException {

        setCors(resp);

        resp.setContentType(
                "application/json;charset=UTF-8"
        );

         
        // Authentication
         

        if (!isAuthenticated(req, resp)) {
            return;
        }

        
        HttpSession session =
                req.getSession(false);

        String role =
                (String) session.getAttribute("role");

        if (!"ADMIN".equals(role)) {

            resp.setStatus(
                    HttpServletResponse.SC_FORBIDDEN
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Access denied"
                    )
            );

            return;
        }

         

        String path =
                req.getPathInfo();

        if (path == null || path.equals("/")) {

            resp.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Customer ID is required"
                    )
            );

            return;
        }

        try {

            int customerId =
                    Integer.parseInt(
                            path.substring(1)
                    );

          
           

            Customer customer =
                    customerService.getCustomerById(customerId);

            if (customer == null) {

                resp.setStatus(
                        HttpServletResponse.SC_NOT_FOUND
                );

                mapper.writeValue(
                        resp.getWriter(),
                        Collections.singletonMap(
                                "error",
                                "Customer not found"
                        )
                );

                return;
            }

        
            // Delete
         

            customerService.deleteCustomer(customerId);

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "message",
                            "Customer deleted successfully"
                    )
            );

                } catch (CustomerNotFoundException e) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        mapper.writeValue(resp.getWriter(), Collections.singletonMap("error", "Customer not found"));
                } catch (NumberFormatException e) {

            resp.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Invalid customer ID"
                    )
            );
        }
    }


     
    // AUTHENTICATION HELPER
   

    private boolean isAuthenticated(
            HttpServletRequest req,
            HttpServletResponse resp)
            throws IOException {

        HttpSession session =
                req.getSession(false);

        if (session == null) {

            resp.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Login required"
                    )
            );

            return false;
        }

        Object username =
                session.getAttribute("username");

        if (username == null) {

            resp.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            mapper.writeValue(
                    resp.getWriter(),
                    Collections.singletonMap(
                            "error",
                            "Login required"
                    )
            );

            return false;
        }

        return true;
    }

        private int parseQueryInt(String value, int fallback) {
                if (value == null || value.isBlank()) return fallback;
                try { return Integer.parseInt(value); }
                catch (NumberFormatException e) { return fallback; }
        }


     
    // CORS
    

    private void setCors(
            HttpServletResponse resp) {

        resp.setHeader(
                "Access-Control-Allow-Origin",
                "*"
        );

        resp.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        resp.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Accept"
        );
    }
}