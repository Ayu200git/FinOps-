# PostgreSQL JDBC Demo

This is a minimal Java example that connects directly to PostgreSQL using JDBC.

## Run

1. Install Java 17+ and Maven.
2. Create a PostgreSQL database and user.
3. Configure connection details using environment variables or defaults.

### Example environment variables

```powershell
$env:JDBC_DATABASE_URL = "jdbc:postgresql://localhost:5432/finops"
$env:JDBC_DATABASE_USERNAME = "finops"
$env:JDBC_DATABASE_PASSWORD = "finops"
```

### Run with Maven

```powershell
cd backend
mvn compile exec:java
```

## What it does

- Uses `org.postgresql:postgresql`
- Opens a JDBC connection
- Executes `SELECT id, name FROM users WHERE id = ?`
- Prints the first row if present

## Notes

- JDBC is Java-only; it cannot run in browser JavaScript.
- This is not a web backend. It's a direct database client.
- Create the `users` table before running the demo:

```sql
CREATE TABLE users (
    id serial PRIMARY KEY,
    name text NOT NULL
);

INSERT INTO users (name) VALUES ('Alice');
```
