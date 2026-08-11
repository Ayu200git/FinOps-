package com.finops.repo;

public interface DashboardDAO {
    int getTotalCustomers();
    int getTotalLoans();
    int getPendingLoans();
    int getApprovedLoans();
    int getRejectedLoans();
    double getTotalLoanAmount();
    double getTotalApprovedLoanAmount();
}
