package com.finops.model;

import java.time.LocalDate;

public class Loan {
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    private int loanId;
    private int customerId;
    private String loanType;
    private double amount;
    private double interestRate;
    private int tenureMonths;
    private String status;
    private LocalDate appliedDate;

    public Loan() {
    }

    public Loan(int loanId, int customerId, String loanType, double amount, double interestRate, int tenureMonths, String status, LocalDate appliedDate) {
        this.loanId = loanId;
        this.customerId = customerId;
        this.loanType = loanType;
        this.amount = amount;
        this.interestRate = interestRate;
        this.tenureMonths = tenureMonths;
        this.status = status;
        this.appliedDate = appliedDate;
    }

    public int getLoanId() {
        return loanId;
    }

    public void setLoanId(int loanId) {
        this.loanId = loanId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public String getLoanType() {
        return loanType;
    }

    public void setLoanType(String loanType) {
        this.loanType = loanType;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public double getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(double interestRate) {
        this.interestRate = interestRate;
    }

    public int getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(int tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public void approve() {
        this.status = STATUS_APPROVED;
    }

    public void reject() {
        this.status = STATUS_REJECTED;
    }

    @Override
    public String toString() {
        return "Loan{" +
                "loanId=" + loanId +
                ", customerId=" + customerId +
                ", loanType='" + loanType + '\'' +
                ", amount=" + amount +
                ", interestRate=" + interestRate +
                ", tenureMonths=" + tenureMonths +
                ", status='" + status + '\'' +
                ", appliedDate=" + appliedDate +
                '}';
    }
}

      