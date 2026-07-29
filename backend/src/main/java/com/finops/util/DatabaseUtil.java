package main.java.com.finops.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseUtil {

    private static final String URL =
            "jdbc:postgresql://localhost:5432/employee_db";

    private static final String USER =
            "postgres";

    private static final String PASSWORD =
            "password";

    public static Connection getConnection() throws SQLException {

        return DriverManager.getConnection(
                URL,
                USER,
                PASSWORD
        );
    }
}