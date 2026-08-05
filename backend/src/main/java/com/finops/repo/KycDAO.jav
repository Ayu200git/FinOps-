package com.finops.repo;

import java.util.List;
import com.finops.model.KYC;

public interface KycDAO {
    boolean addKyc(Kyc kyc);
    List<Kyc> getAllKyc();
    Kyc getKycById(int id);
    void updateKyc(Kyc kyc);
    boolean verifyKyc(int customerId);
    boolean rejectKyc(int customerId);  
    void deleteKyc(int id);
    boolean getKycByCustomer(int customerId);
}