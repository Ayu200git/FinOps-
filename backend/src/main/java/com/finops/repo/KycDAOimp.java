package com.finops.repo;

import com.finops.model.Kyc;
import com.finops.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class KycDAOimp implements KycDAO {

    @Override
    public boolean addKyc(Kyc kyc) {
        String sql = "INSERT INTO kyc (customer_id, document_type, document_number, document_image_path, document_status, submission_date, approval_date, rejection_date, rejection_reason, remarks, pan_no, created_by, created_date, aadhaar_no, verified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, kyc.getCustomerId());
            ps.setString(2, kyc.getDocumentType());
            ps.setString(3, kyc.getDocumentNumber());
            ps.setString(4, kyc.getDocumentImagePath());
            ps.setString(5, kyc.getDocumentStatus());
            ps.setDate(6, java.sql.Date.valueOf(kyc.getSubmissionDate()));
            ps.setDate(7, kyc.getApprovalDate() != null ? java.sql.Date.valueOf(kyc.getApprovalDate()) : null);
            ps.setDate(8, kyc.getRejectionDate() != null ? java.sql.Date.valueOf(kyc.getRejectionDate()) : null);
            ps.setString(9, kyc.getRejectionReason());
            ps.setString(10, kyc.getRemarks());
            ps.setString(11, kyc.getPanNo());
            ps.setString(12, kyc.getCreatedBy());
            ps.setDate(13, java.sql.Date.valueOf(kyc.getCreatedDate()));
            ps.setString(14, kyc.getAadhaarNo());
            ps.setString(15, kyc.getVerifiedBy());

            int rows = ps.executeUpdate();
            if (rows > 0) {
                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        kyc.setKycId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public List<Kyc> getAllKyc() {
        List<Kyc> kycList = new ArrayList<>();
        String sql = "SELECT * FROM kyc";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Kyc kyc = mapRowToKyc(rs);
                kycList.add(kyc);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return kycList;
    }

    @Override
    public Kyc getKycById(int id) {
        String sql = "SELECT * FROM kyc WHERE kyc_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToKyc(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public void updateKyc(Kyc kyc) {
        String sql = "UPDATE kyc SET customer_id = ?, document_type = ?, document_number = ?, document_image_path = ?, document_status = ?, submission_date = ?, approval_date = ?, rejection_date = ?, rejection_reason = ?, remarks = ?, pan_no = ?, created_by = ?, created_date = ?, aadhaar_no = ?, verified_by = ? WHERE kyc_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, kyc.getCustomerId());
            ps.setString(2, kyc.getDocumentType());
            ps.setString(3, kyc.getDocumentNumber());
            ps.setString(4, kyc.getDocumentImagePath());
            ps.setString(5, kyc.getDocumentStatus());
            ps.setDate(6, java.sql.Date.valueOf(kyc.getSubmissionDate()));
            ps.setDate(7, kyc.getApprovalDate() != null ? java.sql.Date.valueOf(kyc.getApprovalDate()) : null);
            ps.setDate(8, kyc.getRejectionDate() != null ? java.sql.Date.valueOf(kyc.getRejectionDate()) : null);
            ps.setString(9, kyc.getRejectionReason());
            ps.setString(10, kyc.getRemarks());
            ps.setString(11, kyc.getPanNo());
            ps.setString(12, kyc.getCreatedBy());
            ps.setDate(13, java.sql.Date.valueOf(kyc.getCreatedDate()));
            ps.setString(14, kyc.getAadhaarNo());
            ps.setString(15, kyc.getVerifiedBy());
            ps.setInt(16, kyc.getKycId());

            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean verifyKyc(int customerId) {
        String sql = "UPDATE kyc SET document_status = 'Verified', approval_date = CURRENT_DATE WHERE customer_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, customerId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean rejectKyc(int customerId) {
        String sql = "UPDATE kyc SET document_status = 'Rejected', rejection_date = CURRENT_DATE WHERE customer_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, customerId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void deleteKyc(int id) {
        String sql = "DELETE FROM kyc WHERE kyc_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean getKycByCustomer(int customerId) {
        String sql = "SELECT 1 FROM kyc WHERE customer_id = ?";
        try (Connection con = DatabaseUtil.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private Kyc mapRowToKyc(ResultSet rs) throws SQLException {
        Kyc kyc = new Kyc();
        kyc.setKycId(rs.getInt("kyc_id"));
        kyc.setCustomerId(rs.getInt("customer_id"));
        kyc.setDocumentType(rs.getString("document_type"));
        kyc.setDocumentNumber(rs.getString("document_number"));
        kyc.setDocumentImagePath(rs.getString("document_image_path"));
        kyc.setDocumentStatus(rs.getString("document_status"));
        if (rs.getDate("submission_date") != null) {
            kyc.setSubmissionDate(rs.getDate("submission_date").toLocalDate());
        }
        if (rs.getDate("approval_date") != null) {
            kyc.setApprovalDate(rs.getDate("approval_date").toLocalDate());
        }
        if (rs.getDate("rejection_date") != null) {
            kyc.setRejectionDate(rs.getDate("rejection_date").toLocalDate());
        }
        kyc.setRejectionReason(rs.getString("rejection_reason"));
        kyc.setRemarks(rs.getString("remarks"));
        kyc.setPanNo(rs.getString("pan_no"));
        kyc.setCreatedBy(rs.getString("created_by"));
        if (rs.getDate("created_date") != null) {
            kyc.setCreatedDate(rs.getDate("created_date").toLocalDate());
        }
        kyc.setAadhaarNo(rs.getString("aadhaar_no"));
        kyc.setVerifiedBy(rs.getString("verified_by"));
        return kyc;
    }
}
