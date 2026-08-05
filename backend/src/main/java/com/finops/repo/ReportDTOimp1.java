package com.finops.repo;

public class ReportDTOimp1 implements ReportDTO.ReportDAO {

    @Override
    public List<LoanReport> getLoanReport() {
           
        return null;
    }

    @Override
    public List<LoanReport> getPendingLoanReport() {
        // Implementation for fetching pending loan report from the database
        return null;
    }

    @Override
    public List<LoanReport> getApprovedLoanReport() {
        // Implementation for fetching approved loan report from the database
        return null;
    }

    @Override
    public List<LoanReport> searchLoanReport(String keyword) {
        // Implementation for searching loan report based on a keyword
        return null;
    }
}
 
