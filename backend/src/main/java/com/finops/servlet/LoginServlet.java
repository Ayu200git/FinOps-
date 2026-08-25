package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import com.finops.util.EnvLoader;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        resp.setContentType("application/json;charset=UTF-8");

        String configuredUsername = EnvLoader.get("FINOPS_ADMIN_USERNAME", "");
        String configuredPassword = EnvLoader.get("FINOPS_ADMIN_PASSWORD", "");
        boolean authenticated = !configuredUsername.isEmpty()
            && !configuredPassword.isEmpty()
            && configuredUsername.equals(username)
            && configuredPassword.equals(password);
        if (!authenticated) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\": \"Invalid username or password\"}");
            return;
        }

        HttpSession session = req.getSession(true);
        session.setAttribute("username", username);
        req.changeSessionId();
        session.setAttribute("role", "ADMIN");

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write("{\"message\": \"Login successful\"}");
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
        resp.getWriter().write("{\"authenticated\":true,\"username\":\""
                + escapeJson(String.valueOf(session.getAttribute("username")))
                + "\",\"role\":\""
                + escapeJson(String.valueOf(session.getAttribute("role"))) + "\"}");
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

}
