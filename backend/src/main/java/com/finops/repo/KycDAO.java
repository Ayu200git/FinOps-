
package com.finops.repo;

import com.finops.model.Kyc;
import java.util.List;

public interface KycDAO {

    boolean addKyc(Kyc kyc);

    List<Kyc> getAllKyc();

    Kyc getKycById(int id);

    void updateKyc(Kyc kyc);

    boolean verifyKyc(int customerId);

    boolean rejectKyc(int customerId);

    void deleteKyc(int id);

    boolean existsByCustomerId(int customerId);
}