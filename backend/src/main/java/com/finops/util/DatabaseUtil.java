package com.finops.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseUtil {
    private static final String RAW_URL = EnvLoader.get("JDBC_DATABASE_URL", "jdbc:postgresql://localhost:5432/finops");
    private static final String USER = EnvLoader.get("JDBC_DATABASE_USERNAME", "finops");
    private static final String PASSWORD = EnvLoader.get("JDBC_DATABASE_PASSWORD", "finops");

    public static Connection getConnection() throws SQLException {
        String url = RAW_URL;
        String user = USER;
        String password = PASSWORD;

        try {
            URI uri = new URI(url);
            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                String[] parts = userInfo.split(":", 2);
                if (parts.length > 0 && (user == null || user.isEmpty() || "finops".equals(user))) {
                    user = parts[0];
                }
                if (parts.length > 1 && (password == null || password.isEmpty() || "finops".equals(password))) {
                    password = parts[1];
                }
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath() == null ? "" : uri.getPath();
                String query = uri.getQuery() == null ? "" : "?" + uri.getQuery();
                url = String.format("%s://%s%s%s", uri.getScheme(), host, port == -1 ? "" : ":" + port, path + query);
            }
        } catch (URISyntaxException e) {
            // Keep the original URL if parsing fails.
        }

        if (user == null || user.isEmpty()) {
            return DriverManager.getConnection(url);
        }
        return DriverManager.getConnection(url, user, password);
    }
}
