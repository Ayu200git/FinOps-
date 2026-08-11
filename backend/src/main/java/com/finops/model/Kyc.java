package com.finops.model;
import java.time.LocalDate;
 

public class Kyc {
    private int kycId;
    private int customerId;
    private String documentType;
    private String documentNumber;  
    private String documentImagePath;
     private String documentStatus;
    private LocalDate submissionDate;
    private LocalDate approvalDate;
    private LocalDate rejectionDate;
    private String rejectionReason;
    private String remarks;
    private String panNo;
    private String createdBy;
    private LocalDate createdDate;
    private String aadhaarNo;
    private String verifiedBy;
    
    public Kyc() {
    }

    public Kyc(int kycId, int customerId, String documentType, String documentNumber, String documentImagePath, String documentStatus, LocalDate submissionDate, LocalDate approvalDate, LocalDate rejectionDate, String rejectionReason, String remarks, String panNo, String createdBy, LocalDate createdDate, String aadhaarNo, String verifiedBy) {
        this.kycId = kycId;
        this.customerId = customerId;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.documentImagePath = documentImagePath;
        this.documentStatus = documentStatus;
        this.submissionDate = submissionDate;
        this.approvalDate = approvalDate;
        this.rejectionDate = rejectionDate;
        this.rejectionReason = rejectionReason;
        this.remarks = remarks;
        this.panNo = panNo;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.aadhaarNo = aadhaarNo;
        this.verifiedBy = verifiedBy;
    }

    


 

 

 

 

 

 
 
 public int getKycId() {
    return kycId;
}

public void setKycId(int kycId) {
    this.kycId = kycId;
}

public int getCustomerId() {
    return customerId;
}

public void setCustomerId(int customerId) {
    this.customerId = customerId;
}

public String getDocumentType() {
    return documentType;
}

public void setDocumentType(String documentType) {
    this.documentType = documentType;
}

public String getDocumentNumber() {
    return documentNumber;
}

public void setDocumentNumber(String documentNumber) {
    this.documentNumber = documentNumber;
}

public String getDocumentImagePath() {
    return documentImagePath;
}

public void setDocumentImagePath(String documentImagePath) {
    this.documentImagePath = documentImagePath;
}

public String getDocumentStatus() {
    return documentStatus;
}

public void setDocumentStatus(String documentStatus) {
    this.documentStatus = documentStatus;
}

public LocalDate getSubmissionDate() {
    return submissionDate;
}

public void setSubmissionDate(LocalDate submissionDate) {
    this.submissionDate = submissionDate;
}

public LocalDate getApprovalDate() {
    return approvalDate;
}

public void setApprovalDate(LocalDate approvalDate) {
    this.approvalDate = approvalDate;
}

public LocalDate getRejectionDate() {
    return rejectionDate;
}

public void setRejectionDate(LocalDate rejectionDate) {
    this.rejectionDate = rejectionDate;
}

public String getRejectionReason() {
    return rejectionReason;
}

public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
}

public String getRemarks() {
    return remarks;
}

public void setRemarks(String remarks) {
    this.remarks = remarks;
}

public String getPanNo() {
    return panNo;
}

public void setPanNo(String panNo) {
    this.panNo = panNo;
}

public String getCreatedBy() {
    return createdBy;
}

public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
}

public LocalDate getCreatedDate() {
    return createdDate;
}

public void setCreatedDate(LocalDate createdDate) {
    this.createdDate = createdDate;
}

public String getAadhaarNo() {
    return aadhaarNo;
}

public void setAadhaarNo(String aadhaarNo) {
    this.aadhaarNo = aadhaarNo;
}

public String getVerifiedBy() {
    return verifiedBy;
}

public void setVerifiedBy(String verifiedBy) {
    this.verifiedBy = verifiedBy;
}
}

// rifyKyc(int customerId) and rejectKyc(int customerId)ve