package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import com.finops.model.User;
import com.finops.repo.UserDAO;
import com.finops.repo.UserDAOImpl;
import com.finops.util.PasswordUtil;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAOImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        resp.setContentType("application/json;charset=UTF-8");

        if (username == null || password == null || username.trim().isEmpty() || password.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"Username and password are required\"}");
            return;
        }

        User user = userDAO.findByUsername(username.trim());
        if (user == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\": \"Invalid username or password\"}");
            return;
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().write("{\"error\": \"Your account registration is " + user.getStatus().toLowerCase() + ". Please wait for approval.\" }");
            return;
        }

        if (!PasswordUtil.checkPassword(password, user.getPasswordHash())) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\": \"Invalid username or password\"}");
            return;
        }

        HttpSession session = req.getSession(true);
        session.setAttribute("username", user.getUsername());
        session.setAttribute("name", user.getFullName());
        session.setAttribute("role", user.getRole());
        req.changeSessionId();

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write("{\"message\": \"Login successful\", \"username\": \""
                + escapeJson(user.getUsername())
                + "\", \"name\": \""
                + escapeJson(user.getFullName())
                + "\", \"role\": \""
                + escapeJson(user.getRole())
                + "\"}");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("username") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"authenticated\":false}");
            return;
        }
        String name = session.getAttribute("name") != null ? String.valueOf(session.getAttribute("name")) : String.valueOf(session.getAttribute("username"));
        resp.getWriter().write("{\"authenticated\":true,\"username\":\""
                + escapeJson(String.valueOf(session.getAttribute("username")))
                + "\",\"name\":\""
                + escapeJson(name)
                + "\",\"role\":\""
                + escapeJson(String.valueOf(session.getAttribute("role"))) + "\"}");
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
