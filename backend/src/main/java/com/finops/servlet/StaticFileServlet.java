package com.finops.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
 
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class StaticFileServlet extends HttpServlet {
    private final Path baseDir;

    public StaticFileServlet(String baseDir) {
        this.baseDir = Paths.get(baseDir).toAbsolutePath().normalize();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // compute path relative to context 
        String uri = req.getRequestURI();
        String context = req.getContextPath();
        if (context != null && !context.isEmpty() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri == null || uri.equals("/") || uri.isEmpty()) uri = "/index.html";
         
        String rel = uri.startsWith("/") ? uri.substring(1) : uri;
        Path resolved = baseDir.resolve(rel).normalize();
        if (!resolved.startsWith(baseDir) || !Files.exists(resolved) || Files.isDirectory(resolved)) {
             
            Path index = baseDir.resolve("index.html").normalize();
            if (Files.exists(index)) {
                resp.setContentType("text/html");
                resp.setStatus(HttpServletResponse.SC_OK);
                Files.copy(index, resp.getOutputStream());
                return;
            }
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.setContentType("text/plain;charset=UTF-8");
            resp.getWriter().write("Not found");
            return;
        }

        String contentType = getServletContext().getMimeType(resolved.toString());
        if (contentType == null) contentType = Files.probeContentType(resolved);
        if (contentType == null) contentType = "application/octet-stream";

        resp.setContentType(contentType);
        resp.setStatus(HttpServletResponse.SC_OK);
        Files.copy(resolved, resp.getOutputStream());
    }
}
