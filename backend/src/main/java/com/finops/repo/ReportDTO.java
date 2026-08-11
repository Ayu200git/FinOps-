package com.finops.repo;

import java.util.List;

public class ReportDTO {
    public interface ReportDAO {

    List<LoanReport> getLoanReport();

    List<LoanReport> getPendingLoanReport();

    List<LoanReport> getApprovedLoanReport();

    List<LoanReport> searchLoanReport(String keyword);
    

}
}
