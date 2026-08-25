package com.finops.model;

public class Customer {
    private int customerId;
    private String customerName;
    private String email;
    private String mobile;
    private String city;
    private String status;
    private String dob;
    private String pincode;
    private Integer creditScore;
    private Double balance;
    private String kycStatus;
    private String address;
    private String joinedDate;

    public Customer() {
    }

    public Customer(int customerId, String customerName, String email, String mobile, String city, String status) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.email = email;
        this.mobile = mobile;
        this.city = city;
        this.status = status;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getJoinedDate() { return joinedDate; }
    public void setJoinedDate(String joinedDate) { this.joinedDate = joinedDate; }
}
