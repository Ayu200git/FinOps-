package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import com.finops.model.User;
import com.finops.repo.UserDAO;
import com.finops.repo.UserDAOImpl;
import com.finops.util.PasswordUtil;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAOImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String fullName = req.getParameter("fullName");
        String role = req.getParameter("role");

        resp.setContentType("application/json;charset=UTF-8");

        if (username == null || password == null || fullName == null || role == null
                || username.trim().isEmpty() || password.trim().isEmpty() || fullName.trim().isEmpty() || role.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"All fields (username, password, fullName, role) are required\"}");
            return;
        }

        // Validate role input
        String sanitizedRole = role.trim();
        if (!sanitizedRole.equals("Admin") && !sanitizedRole.equals("Branch Manager") 
                && !sanitizedRole.equals("Branch Officer") && !sanitizedRole.equals("Relationship Manager") 
                && !sanitizedRole.equals("Customer")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"Invalid role specified\"}");
            return;
        }

        // Check if username already exists
        if (userDAO.findByUsername(username.trim()) != null) {
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            resp.getWriter().write("{\"error\": \"Username/Email already exists\"}");
            return;
        }

        User newUser = new User();
        newUser.setUsername(username.trim());
        newUser.setPasswordHash(PasswordUtil.hashPassword(password));
        newUser.setFullName(fullName.trim());
        newUser.setRole(sanitizedRole);
        newUser.setStatus("PENDING"); // All registrations are PENDING until approved

        boolean success = userDAO.createUser(newUser);
        if (success) {
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write("{\"message\": \"Registration successful! Please wait for approval.\" }");
        } else {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\": \"Failed to create account. Please try again.\" }");
        }
    }
}
