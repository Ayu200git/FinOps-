
package com.finops.servlet;

import com.finops.model.Kyc;
import com.finops.repo.KycDAO;
import com.finops.repo.KycDAOimp;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@WebServlet("/api/kyc/upload")
@MultipartConfig(
        maxFileSize = 5 * 1024 * 1024,
        maxRequestSize = 10 * 1024 * 1024
)
public class KycServlet extends HttpServlet {

    private final KycDAO kycDAO = new KycDAOimp();

    private Path uploadDirectory;

    @Override
    public void init() throws ServletException {

        uploadDirectory = Paths
                .get("secure-uploads")
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new ServletException(
                    "Unable to create upload directory",
                    e
            );
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {
 

        HttpSession session =
                request.getSession(false);

        if (session == null ||
            session.getAttribute("username") == null) {

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Login required"
            );

            return;
        }

        String username =
                (String) session.getAttribute("username");
 
        String customerIdParam =
                request.getParameter("customerId");

        String documentType =
                request.getParameter("documentType");

        String documentNumber =
                request.getParameter("documentNumber");

        String panNo =
                request.getParameter("panNo");

        String aadhaarNo =
                request.getParameter("aadhaarNo");
 

        if (customerIdParam == null ||
            documentType == null) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Customer ID and document type are required"
            );

            return;
        }

        int customerId;

        try {

            customerId =
                    Integer.parseInt(customerIdParam);

        } catch (NumberFormatException e) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid customer ID"
            );

            return;
        }

         

        Part document =
                request.getPart("document");

        if (document == null ||
            document.getSize() == 0) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "KYC document is required"
            );

            return;
        }

         

        long maxSize =
                5 * 1024 * 1024;

        if (document.getSize() > maxSize) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "File size must be <= 5 MB"
            );

            return;
        }

       

        String originalFileName =
                document.getSubmittedFileName();

        if (originalFileName == null ||
            originalFileName.isBlank()) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid filename"
            );

            return;
        }

        

        if (originalFileName.contains("..") ||
            originalFileName.contains("/") ||
            originalFileName.contains("\\")) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid filename"
            );

            return;
        }

         

        String contentType =
                document.getContentType();

        if (!isAllowedContentType(contentType)) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Only PDF, JPG and PNG files are allowed"
            );

            return;
        }
 

        String extension =
                getExtension(contentType);

        String storedFileName =
                UUID.randomUUID()
                        .toString()
                + extension;
 
        Path target =
                uploadDirectory
                        .resolve(storedFileName)
                        .normalize();

        if (!target.startsWith(uploadDirectory)) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid file path"
            );

            return;
        }

        

        try (
                InputStream input =
                        document.getInputStream();

                OutputStream output =
                        Files.newOutputStream(target)
        ) {

            byte[] buffer =
                    new byte[8192];

            int bytesRead;

            while ((bytesRead =
                    input.read(buffer)) != -1) {

                output.write(
                        buffer,
                        0,
                        bytesRead
                );
            }
        }

        
        Kyc kyc = new Kyc();

        kyc.setCustomerId(customerId);

        kyc.setDocumentType(documentType);

        kyc.setDocumentNumber(documentNumber);

        kyc.setDocumentImagePath(
                target.toString()
        );

        kyc.setDocumentStatus("PENDING");

        kyc.setSubmissionDate(
                LocalDate.now()
        );

        kyc.setPanNo(panNo);

        kyc.setAadhaarNo(aadhaarNo);

        kyc.setCreatedBy(username);

        kyc.setCreatedDate(
                LocalDate.now()
        );

         

        boolean saved =
                kycDAO.addKyc(kyc);
 

        if (!saved) {

            

            Files.deleteIfExists(target);

            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to save KYC information"
            );

            return;
        }
 

        response.setContentType(
                "application/json;charset=UTF-8"
        );

        response.setStatus(
                HttpServletResponse.SC_CREATED
        );

        response.getWriter().println(
                "{"
                + "\"message\":\"KYC uploaded successfully\","
                + "\"kycId\":" + kyc.getKycId() + ","
                + "\"status\":\"PENDING\""
                + "}"
        );
    }

    private boolean isAllowedContentType(
            String contentType) {

        return "application/pdf"
                .equalsIgnoreCase(contentType)

                || "image/jpeg"
                .equalsIgnoreCase(contentType)

                || "image/png"
                .equalsIgnoreCase(contentType);
    }

    private String getExtension(
            String contentType) {

        if ("application/pdf"
                .equalsIgnoreCase(contentType)) {

            return ".pdf";
        }

        if ("image/jpeg"
                .equalsIgnoreCase(contentType)) {

            return ".jpg";
        }

        if ("image/png"
                .equalsIgnoreCase(contentType)) {

            return ".png";
        }

        return "";
    }
}