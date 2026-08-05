package com.finops.repo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.finops.util.DatabaseUtil;

public class DashboardDAOimp1 {
    @Override
public int getTotalCustomers() {

    String sql =
            "SELECT COUNT(*) FROM customer";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getInt(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0;

}

@override
public int getTotalLoans() {

    String sql =
            "SELECT COUNT(*) FROM loan";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getInt(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0;
}

@Override
public int getPendingLoans() {

    String sql =
            "SELECT COUNT(*) FROM loan WHERE status='PENDING'";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getInt(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0;
}

@Override
public int getApprovedloans() {

    String sql =
            "SELECT COUNT(*) FROM loan WHERE status='APPROVED'";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getInt(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0;
}
}

@Override
public double getTotalLoanAmount() {

    String sql =
            "SELECT SUM(amount) FROM loan";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getDouble(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0.0;
}

@Override
public double getTotalApprovedLoanAmount() {

    String sql =
            "SELECT SUM(amount) FROM loan WHERE status='APPROVED'";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getDouble(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0.0;
}

@Override
public int rejectedLoans() {

    String sql =
            "SELECT COUNT(*) FROM loan WHERE status='REJECTED'";

    try (

            Connection con =
                    DatabaseUtil.getConnection();

            PreparedStatement ps =
                    con.prepareStatement(sql);

            ResultSet rs =
                    ps.executeQuery();

    ){

        if(rs.next()){

            return rs.getInt(1);

        }

    }catch(SQLException e){

        e.printStackTrace();

    }

    return 0;
}

 
