package com.finops.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import java.io.IOException;

public class AuthenticationFilter implements Filter {

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

        if (session == null ||
            session.getAttribute("username") == null) {

            resp.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required"
            );

            return;
        }

        chain.doFilter(request, response);
    }
}