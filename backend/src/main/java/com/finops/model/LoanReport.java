package com.finops.model;

import java.time.LocalDate;

 

    private String customerName;

    private String loanType;

    private double amount;

    private String status;

    private LocalDate appliedDate;

    public LoanReport(String customerName, String loanType, double amount, String status, LocalDate appliedDate) {

        this.customerName = customerName;

        this.loanType = loanType;

        this.amount = amount;

        this.status = status;

        this.appliedDate = appliedDate;

    }

 
    
