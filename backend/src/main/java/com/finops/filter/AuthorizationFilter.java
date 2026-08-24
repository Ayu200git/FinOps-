package com.finops.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import java.io.IOException;

public class AuthorizationFilter implements Filter {

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req =
                (HttpServletRequest) request;

        HttpServletResponse resp =
                (HttpServletResponse) response;

        HttpSession session =
                req.getSession(false);

        String role =
                (String) session.getAttribute("role");

        if (!"ADMIN".equals(role)) {

            resp.sendError(
                    HttpServletResponse.SC_FORBIDDEN,
                    "Access denied"
            );

            return;
        }

        chain.doFilter(request, response);
    }
}