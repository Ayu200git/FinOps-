package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finops.model.User;
import com.finops.repo.UserDAO;
import com.finops.repo.UserDAOImpl;

@WebServlet("/users/*")
public class UserApprovalServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAOImpl();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);

        if (session == null || session.getAttribute("role") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\": \"Authentication required\"}");
            return;
        }

        String currentUserRole = (String) session.getAttribute("role");
        if (!"Admin".equalsIgnoreCase(currentUserRole) && !"Branch Manager".equalsIgnoreCase(currentUserRole) && !"Relationship Manager".equalsIgnoreCase(currentUserRole)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().write("{\"error\": \"Access denied. Insufficient permissions.\" }");
            return;
        }

        List<User> allUsers = userDAO.findAllUsers();
        List<User> visibleUsers = new ArrayList<>();

        for (User u : allUsers) {
            // Remove sensitive fields from JSON response
            u.setPasswordHash(null);
            
            // Relationship Managers should only see Customer requests or list
            if ("Relationship Manager".equalsIgnoreCase(currentUserRole)) {
                if ("Customer".equalsIgnoreCase(u.getRole())) {
                    visibleUsers.add(u);
                }
            } else {
                visibleUsers.add(u);
            }
        }

        mapper.writeValue(resp.getWriter(), visibleUsers);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);

        if (session == null || session.getAttribute("role") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\": \"Authentication required\"}");
            return;
        }

        String currentUserRole = (String) session.getAttribute("role");
        if (!"Admin".equalsIgnoreCase(currentUserRole) && !"Branch Manager".equalsIgnoreCase(currentUserRole) && !"Relationship Manager".equalsIgnoreCase(currentUserRole)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().write("{\"error\": \"Access denied\"}");
            return;
        }

        String targetUserIdStr = req.getParameter("userId");
        String action = req.getParameter("action"); // "APPROVE" or "REJECT"

        if (targetUserIdStr == null || action == null || targetUserIdStr.trim().isEmpty() || action.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"userId and action parameters are required\"}");
            return;
        }

        int targetUserId;
        try {
            targetUserId = Integer.parseInt(targetUserIdStr.trim());
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"Invalid userId format\"}");
            return;
        }

        // Find user by ID (we can fetch all and search, or implement lookup by ID)
        List<User> users = userDAO.findAllUsers();
        User targetUser = null;
        for (User u : users) {
            if (u.getUserId() == targetUserId) {
                targetUser = u;
                break;
            }
        }

        if (targetUser == null) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\": \"User not found\"}");
            return;
        }

        // Apply RM restrictions: Relationship Managers can only approve Customer requests
        if ("Relationship Manager".equalsIgnoreCase(currentUserRole)) {
            if (!"Customer".equalsIgnoreCase(targetUser.getRole())) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                resp.getWriter().write("{\"error\": \"Relationship Managers can only approve/reject Customer registrations.\" }");
                return;
            }
        }

        // Prevent self-modification
        String currentUserEmail = (String) session.getAttribute("username");
        if (currentUserEmail != null && currentUserEmail.equalsIgnoreCase(targetUser.getUsername())) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"You cannot approve or reject your own account status.\" }");
            return;
        }

        String newStatus = "APPROVE".equalsIgnoreCase(action) ? "ACTIVE" : "REJECTED";
        targetUser.setStatus(newStatus);

        boolean success = userDAO.updateUser(targetUser);
        if (success) {
            // Auto create customer profile in 'customer' table if role is Customer
            if ("ACTIVE".equals(newStatus) && "Customer".equalsIgnoreCase(targetUser.getRole())) {
                try (java.sql.Connection con = com.finops.util.DatabaseUtil.getConnection()) {
                    String checkSql = "SELECT COUNT(*) FROM customer WHERE LOWER(email) = LOWER(?)";
                    boolean customerExists = false;
                    try (java.sql.PreparedStatement psCheck = con.prepareStatement(checkSql)) {
                        psCheck.setString(1, targetUser.getUsername());
                        try (java.sql.ResultSet rsCheck = psCheck.executeQuery()) {
                            if (rsCheck.next() && rsCheck.getInt(1) > 0) {
                                customerExists = true;
                            }
                        }
                    }
                    if (!customerExists) {
                        String insertSql = "INSERT INTO customer (customer_name, email, mobile, city, status, kyc_status, credit_score, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                        try (java.sql.PreparedStatement psInsert = con.prepareStatement(insertSql)) {
                            psInsert.setString(1, targetUser.getFullName());
                            psInsert.setString(2, targetUser.getUsername());
                            psInsert.setString(3, ""); 
                            psInsert.setString(4, ""); 
                            psInsert.setString(5, "ACTIVE");
                            psInsert.setString(6, "PENDING");
                            psInsert.setInt(7, 700); 
                            psInsert.setDouble(8, 0.0); 
                            psInsert.executeUpdate();
                        }
                    }
                } catch (java.sql.SQLException e) {
                    e.printStackTrace();
                }
            }

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write("{\"message\": \"User account registration successfully " + (newStatus.equals("ACTIVE") ? "approved" : "rejected") + "!\" }");
        } else {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\": \"Failed to update user status in the database\"}");
        }
    }
}
