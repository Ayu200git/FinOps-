package com.finops.repo;

import com.finops.model.Customer;
import com.finops.model.CustomerPage;
import com.finops.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CustomerDAOImpl implements CustomerDAO {

    @Override
    public boolean addCustomer(Customer customer) {
        String sql = "INSERT INTO customer (customer_name, email, mobile, city, status, dob, pincode, credit_score, balance, kyc_status, address, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(CAST(? AS DATE), CURRENT_DATE))";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, customer.getCustomerName());
            ps.setString(2, customer.getEmail());
            ps.setString(3, customer.getMobile());
            ps.setString(4, customer.getCity());
            ps.setString(5, customer.getStatus());
            ps.setString(6, customer.getDob());
            ps.setString(7, customer.getPincode());
            ps.setObject(8, customer.getCreditScore());
            ps.setObject(9, customer.getBalance());
            ps.setString(10, customer.getKycStatus());
            ps.setString(11, customer.getAddress());
            ps.setString(12, customer.getJoinedDate());

            int rows = ps.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<Customer> getAllCustomers() {
        List<Customer> customers = new ArrayList<>();
        String sql = customerSelect() + " ORDER BY customer_id";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                customers.add(mapCustomer(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return customers;
    }

    @Override
    public Customer getCustomerById(int id) {
        String sql = customerSelect() + " WHERE customer_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCustomer(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public CustomerPage searchCustomers(int page, int size, String search, String status, String kycStatus) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (search != null && !search.isBlank()) {
            where.append(" AND (LOWER(customer_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(mobile) LIKE ? OR LOWER(city) LIKE ? OR CAST(customer_id AS TEXT) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            for (int i = 0; i < 5; i++) params.add(term);
        }
        if (status != null && !status.isBlank()) { where.append(" AND UPPER(status) = ?"); params.add(status.toUpperCase()); }
        if (kycStatus != null && !kycStatus.isBlank()) { where.append(" AND UPPER(kyc_status) = ?"); params.add(kycStatus.toUpperCase()); }

        String countSql = "SELECT COUNT(*) FROM customer" + where;
        String dataSql = customerSelect() + where + " ORDER BY customer_id LIMIT ? OFFSET ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement count = con.prepareStatement(countSql);
             PreparedStatement data = con.prepareStatement(dataSql)) {
            bind(count, params);
            int total;
            try (ResultSet rs = count.executeQuery()) { rs.next(); total = rs.getInt(1); }
            bind(data, params);
            data.setInt(params.size() + 1, size);
            data.setInt(params.size() + 2, (page - 1) * size);
            List<Customer> items = new ArrayList<>();
            try (ResultSet rs = data.executeQuery()) { while (rs.next()) items.add(mapCustomer(rs)); }
            return new CustomerPage(items, page, size, total);
        } catch (SQLException e) {
            throw new IllegalStateException("Unable to search customers", e);
        }
    }

    @Override
    public boolean updateCustomer(Customer customer) {
        String sql = "UPDATE customer SET customer_name = ?, email = ?, mobile = ?, city = ?, status = ?, dob = ?, pincode = ?, credit_score = ?, balance = ?, kyc_status = ?, address = ?, joined_date = COALESCE(CAST(? AS DATE), joined_date) WHERE customer_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, customer.getCustomerName());
            ps.setString(2, customer.getEmail());
            ps.setString(3, customer.getMobile());
            ps.setString(4, customer.getCity());
            ps.setString(5, customer.getStatus());
            ps.setString(6, customer.getDob());
            ps.setString(7, customer.getPincode());
            ps.setObject(8, customer.getCreditScore());
            ps.setObject(9, customer.getBalance());
            ps.setString(10, customer.getKycStatus());
            ps.setString(11, customer.getAddress());
            ps.setString(12, customer.getJoinedDate());
            ps.setInt(13, customer.getCustomerId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean deleteCustomer(int id) {
        String sql = "DELETE FROM customer WHERE customer_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private String customerSelect() {
        return "SELECT customer_id, customer_name, email, mobile, city, status, dob, pincode, credit_score, balance, kyc_status, address, joined_date FROM customer";
    }

    private Customer mapCustomer(ResultSet rs) throws SQLException {
        Customer customer = new Customer();
        customer.setCustomerId(rs.getInt("customer_id"));
        customer.setCustomerName(rs.getString("customer_name"));
        customer.setEmail(rs.getString("email"));
        customer.setMobile(rs.getString("mobile"));
        customer.setCity(rs.getString("city"));
        customer.setStatus(rs.getString("status"));
        customer.setDob(rs.getString("dob"));
        customer.setPincode(rs.getString("pincode"));
        customer.setCreditScore((Integer) rs.getObject("credit_score"));
        customer.setBalance((Double) rs.getObject("balance"));
        customer.setKycStatus(rs.getString("kyc_status"));
        customer.setAddress(rs.getString("address"));
        customer.setJoinedDate(rs.getString("joined_date"));
        return customer;
    }

    private void bind(PreparedStatement statement, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) statement.setObject(i + 1, params.get(i));
    }
}
