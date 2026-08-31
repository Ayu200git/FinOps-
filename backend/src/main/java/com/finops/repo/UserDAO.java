package com.finops.repo;

import com.finops.model.User;
import java.util.List;

public interface UserDAO {
    User findByUsername(String username);
    boolean createUser(User user);
    boolean updateUser(User user);
    List<User> findAllUsers();
    int countUsers();
}
