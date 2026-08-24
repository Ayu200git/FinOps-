package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        resp.setContentType("application/json;charset=UTF-8");

        boolean authenticated = "admin".equals(username) && "password".equals(password);
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

}
