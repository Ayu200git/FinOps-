package com.finops.repo;

import com.finops.model.LoanReport;
import java.util.List;

public class ReportDTOimp1 implements ReportDTO.ReportDAO {

    @Override
    public List<LoanReport> getLoanReport() {
        return null;
    }

    @Override
    public List<LoanReport> getPendingLoanReport() {
        return null;
    }

    @Override
    public List<LoanReport> getApprovedLoanReport() {
        return null;
    }

    @Override
    public List<LoanReport> searchLoanReport(String keyword) {
        return null;
    }
}

