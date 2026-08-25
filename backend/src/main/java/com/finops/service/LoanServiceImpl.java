 package com.finops.service;

import com.finops.model.Loan;
import com.finops.repo.LoanDAO;
import com.finops.repo.LoanDAOImpl;

import java.time.LocalDate;
import java.util.List;

public class LoanServiceImpl implements LoanService {

    private final LoanDAO loanDAO;

    public LoanServiceImpl() {
        this(new LoanDAOImpl());
    }

    public LoanServiceImpl(LoanDAO loanDAO) {
        this.loanDAO = loanDAO;
    }

    @Override
    public Loan createLoan(Loan loan) {

        validateLoan(loan);

        if (loan.getStatus() == null || loan.getStatus().isBlank()) {
            loan.setStatus(Loan.STATUS_PENDING);
        } else {
            loan.setStatus(loan.getStatus().toUpperCase());
        }

        if (loan.getAppliedDate() == null) {
            loan.setAppliedDate(LocalDate.now());
        }

        if (!loanDAO.addLoan(loan)) {
            throw new IllegalStateException("Loan creation failed");
        }

        return loan;
    }

    @Override
    public List<Loan> getAllLoans() {
        return loanDAO.getAllLoans();
    }

    @Override
    public Loan getLoanById(int loanId) {

        validateId(loanId);

        Loan loan = loanDAO.getLoanById(loanId);

        if (loan == null) {
            throw new LoanNotFoundException(loanId);
        }

        return loan;
    }

    @Override
    public Loan updateLoan(int loanId, Loan loan) {

        validateId(loanId);
        validateLoan(loan);

        Loan existingLoan = getLoanById(loanId);

        /*
         * Status should not normally be changed through
         * generic PUT operation.
         *
         * APPROVED / REJECTED will be handled by
         * dedicated methods.
         */
        loan.setLoanId(loanId);

        if (loan.getStatus() == null || loan.getStatus().isBlank()) {
            loan.setStatus(existingLoan.getStatus());
        } else {
            loan.setStatus(loan.getStatus().toUpperCase());
        }

        if (loan.getAppliedDate() == null) {
            loan.setAppliedDate(existingLoan.getAppliedDate());
        }

        if (!loanDAO.updateLoan(loan)) {
            throw new IllegalStateException("Loan update failed");
        }

        return loan;
    }

    @Override
    public void deleteLoan(int loanId) {

        validateId(loanId);

        getLoanById(loanId);

        if (!loanDAO.deleteLoan(loanId)) {
            throw new IllegalStateException("Loan deletion failed");
        }
    }

    @Override
    public Loan approveLoan(int loanId) {

        Loan loan = getLoanById(loanId);

        if (!Loan.STATUS_PENDING.equals(loan.getStatus())) {
            throw new IllegalStateException(
                    "Only PENDING loans can be approved"
            );
        }

        if (!loanDAO.approveLoan(loanId)) {
            throw new IllegalStateException("Loan approval failed");
        }

        return getLoanById(loanId);
    }

    @Override
    public Loan rejectLoan(int loanId) {

        Loan loan = getLoanById(loanId);

        if (!Loan.STATUS_PENDING.equals(loan.getStatus())) {
            throw new IllegalStateException(
                    "Only PENDING loans can be rejected"
            );
        }

        if (!loanDAO.rejectLoan(loanId)) {
            throw new IllegalStateException("Loan rejection failed");
        }

        return getLoanById(loanId);
    }

    private void validateLoan(Loan loan) {

        if (loan == null) {
            throw new IllegalArgumentException("Loan data is required");
        }

        if (loan.getCustomerId() <= 0) {
            throw new IllegalArgumentException(
                    "Valid customer ID is required"
            );
        }

        if (loan.getLoanType() == null
                || loan.getLoanType().isBlank()) {
            throw new IllegalArgumentException(
                    "Loan type is required"
            );
        }

        if (loan.getAmount() <= 0) {
            throw new IllegalArgumentException(
                    "Loan amount must be greater than zero"
            );
        }

        if (loan.getInterestRate() < 0) {
            throw new IllegalArgumentException(
                    "Interest rate cannot be negative"
            );
        }

        if (loan.getTenureMonths() <= 0) {
            throw new IllegalArgumentException(
                    "Loan tenure must be greater than zero"
            );
        }
    }

    private void validateId(int loanId) {

        if (loanId <= 0) {
            throw new IllegalArgumentException(
                    "Invalid loan ID"
            );
        }
    }

    public static class LoanNotFoundException
            extends RuntimeException {

        public LoanNotFoundException(int loanId) {
            super("Loan not found: " + loanId);
        }
    }
}