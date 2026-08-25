package com.finops.repo;

import java.util.List;
import com.finops.model.Loan;

public interface LoanDAO {
    boolean addLoan(Loan loan);
    List<Loan> getAllLoans();
    Loan getLoanById(int id);
    boolean approveLoan(int loanId);
    boolean rejectLoan(int loanId);
    boolean updateLoan(Loan loan);
    boolean deleteLoan(int id);
}
