package com.finops.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;
import com.finops.util.EnvLoader;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class DatabaseUtil {
    private static final String RAW_URL = EnvLoader.get("JDBC_DATABASE_URL", "jdbc:postgresql://localhost:5432/finops");
    private static final String USER = EnvLoader.get("JDBC_DATABASE_USERNAME", "finops");
    private static final String PASSWORD = EnvLoader.get("JDBC_DATABASE_PASSWORD", "finops");
    private static boolean initialized = false;
    private static HikariDataSource dataSource;

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("PostgreSQL JDBC driver is not available", e);
        }

        String url = RAW_URL;
        String user = USER;
        String password = PASSWORD;

        try {
            String cleanUrl = url;
            boolean isJdbc = false;
            if (url.startsWith("jdbc:")) {
                cleanUrl = url.substring(5);  
                isJdbc = true;
            }
            URI uri = new URI(cleanUrl);
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
                String reconstructed = String.format("%s://%s%s%s", uri.getScheme(), host, port == -1 ? "" : ":" + port, path + query);
                url = isJdbc ? "jdbc:" + reconstructed : reconstructed;
            }
        } catch (URISyntaxException e) {
            System.out.println("[DatabaseUtil] URI Parsing Failed: " + e.getMessage());
        }

        System.out.println("[DatabaseUtil] Connecting to URL: " + url);
        System.out.println("[DatabaseUtil] User: " + user);

        if (dataSource == null) {
            synchronized (DatabaseUtil.class) {
                if (dataSource == null) {
                    HikariConfig config = new HikariConfig();
                    config.setJdbcUrl(url);
                    config.setUsername(user);
                    config.setPassword(password);
                    config.setMaximumPoolSize(10);
                    config.setMinimumIdle(2);
                    config.setConnectionTimeout(5000);
                    dataSource = new HikariDataSource(config);
                }
            }
        }

        Connection con = dataSource.getConnection();
        checkAndInitialize(con);
        return con;
    }

    private static void checkAndInitialize(Connection con) {
        if (initialized) {
            return;
        }
        synchronized (DatabaseUtil.class) {
            if (initialized) {
                return;
            }
            try (Statement stmt = con.createStatement()) {
                stmt.execute("CREATE TABLE IF NOT EXISTS customer (" +
                        "customer_id SERIAL PRIMARY KEY, " +
                        "customer_name VARCHAR(100) NOT NULL, " +
                        "email VARCHAR(100), " +
                        "mobile VARCHAR(20), " +
                        "city VARCHAR(100), " +
                        "status VARCHAR(20)" +
                        ")");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS dob VARCHAR(20)");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS credit_score INTEGER");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS balance DOUBLE PRECISION DEFAULT 0");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'PENDING'");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS address VARCHAR(255)");
                    stmt.execute("ALTER TABLE customer ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE");
                stmt.execute("CREATE TABLE IF NOT EXISTS loan (" +
                        "loan_id SERIAL PRIMARY KEY, " +
                        "customer_id INTEGER NOT NULL REFERENCES customer(customer_id), " +
                        "loan_type VARCHAR(100) NOT NULL, " +
                        "amount DOUBLE PRECISION NOT NULL, " +
                        "interest_rate DOUBLE PRECISION NOT NULL, " +
                        "tenure_months INTEGER NOT NULL, " +
                        "status VARCHAR(20) NOT NULL, " +
                        "applied_date DATE NOT NULL" +
                        ")");
                stmt.execute("CREATE TABLE IF NOT EXISTS app_user (" +
                        "user_id SERIAL PRIMARY KEY, " +
                        "username VARCHAR(100) UNIQUE NOT NULL, " +
                        "password_hash VARCHAR(255) NOT NULL, " +
                        "full_name VARCHAR(100) NOT NULL, " +
                        "role VARCHAR(50) NOT NULL, " +
                        "status VARCHAR(20) DEFAULT 'ACTIVE', " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                        ")");

                // Always ensure default enterprise role accounts exist (ON CONFLICT DO NOTHING = safe re-run)
                String[] seedSqls = {
                    "INSERT INTO app_user (username, password_hash, full_name, role, status) " +
                    "VALUES ('admin@finops.com', '" + com.finops.util.PasswordUtil.hashPassword("Admin@123") + "', 'System Administrator', 'Admin', 'ACTIVE') ON CONFLICT (username) DO NOTHING",
                    "INSERT INTO app_user (username, password_hash, full_name, role, status) " +
                    "VALUES ('manager@finops.com', '" + com.finops.util.PasswordUtil.hashPassword("Manager@123") + "', 'Priya Sharma', 'Branch Manager', 'ACTIVE') ON CONFLICT (username) DO NOTHING",
                    "INSERT INTO app_user (username, password_hash, full_name, role, status) " +
                    "VALUES ('officer@finops.com', '" + com.finops.util.PasswordUtil.hashPassword("Officer@123") + "', 'Rahul Verma', 'Branch Officer', 'ACTIVE') ON CONFLICT (username) DO NOTHING",
                    "INSERT INTO app_user (username, password_hash, full_name, role, status) " +
                    "VALUES ('rm@finops.com', '" + com.finops.util.PasswordUtil.hashPassword("Rm@123") + "', 'Ananya Roy', 'Relationship Manager', 'ACTIVE') ON CONFLICT (username) DO NOTHING",
                    "INSERT INTO app_user (username, password_hash, full_name, role, status) " +
                    "VALUES ('customer@finops.com', '" + com.finops.util.PasswordUtil.hashPassword("Customer@123") + "', 'Arjun Kapoor', 'Customer', 'ACTIVE') ON CONFLICT (username) DO NOTHING"
                };
                int inserted = 0;
                for (String sql : seedSqls) {
                    inserted += stmt.executeUpdate(sql);
                }
                if (inserted > 0) {
                    System.out.println("[DatabaseUtil] " + inserted + " default role account(s) seeded into app_user.");
                }
                initialized = true;
                System.out.println("[DatabaseUtil] Database customer, loan, and app_user tables initialized/verified.");
            } catch (SQLException e) {
                System.err.println("[DatabaseUtil] Failed to initialize database tables:");
                e.printStackTrace();
            }
        }
    }
}
