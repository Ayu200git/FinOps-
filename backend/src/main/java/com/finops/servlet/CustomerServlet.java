package com.finops.servlet;

import com.finops.model.Customer;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import jakarta.servlet.http.HttpSession;

public class CustomerServlet extends HttpServlet {
    private final CustomerDAO dao = new CustomerDAOImpl();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
          if (session == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.setContentType("application/json;charset=UTF-8");

            mapper.writeValue(
                resp.getWriter(),
                java.util.Collections.singletonMap(
                        "error",
                        "Login required"
                )
        );

        return;
    }
        setCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        setCors(resp);
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session =
        req.getSession(false);

if (session == null) {

    resp.setStatus(
            HttpServletResponse.SC_UNAUTHORIZED
    );

    resp.setContentType(
            "application/json;charset=UTF-8"
    );

    mapper.writeValue(
            resp.getWriter(),
            java.util.Collections.singletonMap(
                    "error",
                    "Login required"
            )
    );

    return;
}

        String idParam = req.getParameter("id");
        if (idParam != null) {
            try {
                int id = Integer.parseInt(idParam);
                Customer c = dao.getCustomerById(id);
                if (c != null) {
                    mapper.writeValue(resp.getWriter(), c);
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("error", "not found"));
                }
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("error", "invalid id"));
            }
            return;
        }

        List<Customer> list = dao.getAllCustomers();
        mapper.writeValue(resp.getWriter(), list);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCors(resp);
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session =
        req.getSession(false);

if (session == null) {

    resp.setStatus(
            HttpServletResponse.SC_UNAUTHORIZED
    );

    resp.setContentType(
            "application/json;charset=UTF-8"
    );

    mapper.writeValue(
            resp.getWriter(),
            java.util.Collections.singletonMap(
                    "error",
                    "Login required"
            )
    );

    return;
}

        try {
            Customer c = mapper.readValue(req.getInputStream(), Customer.class);
            boolean ok = dao.addCustomer(c);
            if (ok) {
                resp.setStatus(HttpServletResponse.SC_CREATED);
                mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("result", "created"));
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("result", "failed"));
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("error", "invalid payload"));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCors(resp);
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session =
        req.getSession(false);

if (session == null) {

    resp.setStatus(
            HttpServletResponse.SC_UNAUTHORIZED
    );

    return;
}

String role =
        (String) session.getAttribute("role");

if (!"ADMIN".equals(role)) {

    resp.setStatus(
            HttpServletResponse.SC_FORBIDDEN
    );

    resp.setContentType(
            "application/json;charset=UTF-8"
    );

    mapper.writeValue(
            resp.getWriter(),
            java.util.Collections.singletonMap(
                    "error",
                    "Access denied"
            )
    );

    return;
}

        String idParam = req.getParameter("id");
        if (idParam == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("error", "missing id"));
            return;
        }
        try {
            int id = Integer.parseInt(idParam);
            dao.deleteCustomer(id);
            mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("result", "deleted"));
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), java.util.Collections.singletonMap("error", "invalid id"));
        }
    }

    private void setCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    }
}
