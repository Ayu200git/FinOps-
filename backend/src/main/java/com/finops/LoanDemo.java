package com.finops;

import com.finops.model.Customer;
import com.finops.model.Loan;
import com.finops.repo.CustomerDAO;
import com.finops.repo.CustomerDAOImpl;
import com.finops.repo.LoanDAO;
import com.finops.repo.LoanDAOImpl;

import java.time.LocalDate;
import java.util.List;

public class LoanDemo {
    public static void main(String[] args) {
        CustomerDAO customerDao = new CustomerDAOImpl();
        LoanDAO loanDao = new LoanDAOImpl();

        Customer customer = new Customer();
        customer.setCustomerName("Loan Demo Customer");
        customer.setEmail("loandemo@example.com");
        customer.setMobile("9999999999");
        customer.setCity("Mumbai");
        customer.setStatus("ACTIVE");

        if (!customerDao.addCustomer(customer)) {
            System.err.println("Failed to insert demo customer.");
            return;
        }

        List<Customer> customers = customerDao.getAllCustomers();
        Customer demoCustomer = customers.stream()
                .filter(c -> "loandemo@example.com".equals(c.getEmail()))
                .findFirst()
                .orElse(null);

        if (demoCustomer == null) {
            System.err.println("Could not locate the demo customer after insert.");
            return;
        }

        System.out.println("Demo customer created with ID: " + demoCustomer.getCustomerId());

        Loan loan1 = new Loan();
        loan1.setCustomerId(demoCustomer.getCustomerId());
        loan1.setLoanType("Home Loan");
        loan1.setAmount(5000000.00);
        loan1.setInterestRate(7.25);
        loan1.setTenureMonths(240);
        loan1.setStatus(Loan.STATUS_PENDING);
        loan1.setAppliedDate(LocalDate.now());

        if (!loanDao.addLoan(loan1)) {
            System.err.println("Failed to add loan #1.");
            return;
        }

        System.out.println("Loan #1 inserted: " + loan1);

        Loan loan2 = new Loan();
        loan2.setCustomerId(demoCustomer.getCustomerId());
        loan2.setLoanType("Auto Loan");
        loan2.setAmount(1200000.00);
        loan2.setInterestRate(8.50);
        loan2.setTenureMonths(60);
        loan2.setStatus(Loan.STATUS_PENDING);
        loan2.setAppliedDate(LocalDate.now());

        if (!loanDao.addLoan(loan2)) {
            System.err.println("Failed to add loan #2.");
            return;
        }

        System.out.println("Loan #2 inserted: " + loan2);

        boolean approved = loanDao.approveLoan(loan1.getLoanId());
        System.out.println("Approve Loan #1 result: " + approved);
        Loan approvedLoan = loanDao.getLoanById(loan1.getLoanId());
        System.out.println("Loan #1 current state: " + approvedLoan);

        boolean rejected = loanDao.rejectLoan(loan2.getLoanId());
        System.out.println("Reject Loan #2 result: " + rejected);
        Loan rejectedLoan = loanDao.getLoanById(loan2.getLoanId());
        System.out.println("Loan #2 current state: " + rejectedLoan);

        System.out.println("All loans in system:");
        loanDao.getAllLoans().forEach(System.out::println);

        loanDao.deleteLoan(loan1.getLoanId());
        loanDao.deleteLoan(loan2.getLoanId());

        System.out.println("Deleted loan #1 and loan #2.");
        System.out.println("Remaining loans after cleanup:");
        loanDao.getAllLoans().forEach(System.out::println);
    }
}
