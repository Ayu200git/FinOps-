package com.finops.repo;

import com.finops.model.Loan;
import com.finops.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class LoanDAOImpl implements LoanDAO {

    @Override
    public boolean addLoan(Loan loan) {
        String sql = "INSERT INTO loan (customer_id, loan_type, amount, interest_rate, tenure_months, status, applied_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, loan.getCustomerId());
            ps.setString(2, loan.getLoanType());
            ps.setDouble(3, loan.getAmount());
            ps.setDouble(4, loan.getInterestRate());
            ps.setInt(5, loan.getTenureMonths());
            ps.setString(6, loan.getStatus());
            ps.setDate(7, java.sql.Date.valueOf(loan.getAppliedDate()));

            int rows = ps.executeUpdate();
            if (rows > 0) {
                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        loan.setLoanId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
            return false;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<Loan> getAllLoans() {
        List<Loan> loans = new ArrayList<>();
        String sql = "SELECT loan_id, customer_id, loan_type, amount, interest_rate, tenure_months, status, applied_date FROM loan";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Loan loan = mapRowToLoan(rs);
                loans.add(loan);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return loans;
    }

    @Override
    public Loan getLoanById(int id) {
        String sql = "SELECT loan_id, customer_id, loan_type, amount, interest_rate, tenure_months, status, applied_date FROM loan WHERE loan_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToLoan(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public void updateLoan(Loan loan) {
        String sql = "UPDATE loan SET customer_id = ?, loan_type = ?, amount = ?, interest_rate = ?, tenure_months = ?, status = ?, applied_date = ? WHERE loan_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, loan.getCustomerId());
            ps.setString(2, loan.getLoanType());
            ps.setDouble(3, loan.getAmount());
            ps.setDouble(4, loan.getInterestRate());
            ps.setInt(5, loan.getTenureMonths());
            ps.setString(6, loan.getStatus());
            ps.setDate(7, java.sql.Date.valueOf(loan.getAppliedDate()));
            ps.setInt(8, loan.getLoanId());
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean approveLoan(int loanId) {
        return updateLoanStatus(loanId, Loan.STATUS_APPROVED);
    }

    @Override
    public boolean rejectLoan(int loanId) {
        return updateLoanStatus(loanId, Loan.STATUS_REJECTED);
    }

    private boolean updateLoanStatus(int loanId, String status) {
        Loan loan = getLoanById(loanId);
        if (loan == null) {
            return false;
        }

        if (status.equals(loan.getStatus())) {
            return false;
        }

        String sql = "UPDATE loan SET status = ? WHERE loan_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, loanId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void deleteLoan(int id) {
        String sql = "DELETE FROM loan WHERE loan_id = ?";

        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private Loan mapRowToLoan(ResultSet rs) throws SQLException {
        Loan loan = new Loan();
        loan.setLoanId(rs.getInt("loan_id"));
        loan.setCustomerId(rs.getInt("customer_id"));
        loan.setLoanType(rs.getString("loan_type"));
        loan.setAmount(rs.getDouble("amount"));
        loan.setInterestRate(rs.getDouble("interest_rate"));
        loan.setTenureMonths(rs.getInt("tenure_months"));
        loan.setStatus(rs.getString("status"));
        loan.setAppliedDate(rs.getDate("applied_date").toLocalDate());
        return loan;
    }
}