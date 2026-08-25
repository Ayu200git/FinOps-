 
package com.finops.service;

import com.finops.model.Loan;

import java.util.List;

public interface LoanService {

    Loan createLoan(Loan loan);

    List<Loan> getAllLoans();

    Loan getLoanById(int loanId);

    Loan updateLoan(int loanId, Loan loan);

    void deleteLoan(int loanId);

    Loan approveLoan(int loanId);

    Loan rejectLoan(int loanId);
}