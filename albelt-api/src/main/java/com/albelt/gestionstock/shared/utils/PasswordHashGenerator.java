package com.albelt.gestionstock.shared.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hashes
 * Run this locally to generate hashes for passwords
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        System.out.println("BCrypt Password Hashes (cost 10):");
        System.out.println("admin123: " + encoder.encode("admin123"));
        System.out.println("operator123: " + encoder.encode("operator123"));
        System.out.println("readonly123: " + encoder.encode("readonly123"));
    }
}
