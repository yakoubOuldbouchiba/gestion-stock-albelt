package com.albelt.gestionstock.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Token utility for generating and validating tokens
 * Uses a persistent secret key generated from configuration
 */
@Component
public class JwtTokenProvider {
    
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
    
    @Value("${jwt.secret:albel-stock-management-system-secret-key-must-be-at-least-512-bits-2026-stable-persistent-key-for-production-use-please-configure}")
    @Getter
    private String jwtSecret;
    
    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationInMs;
    
    private SecretKey signingKey;
    
    /**
     * Initialize the signing key from the configured secret
     * Ensures consistent key across restarts
     */
    private void initializeSigningKey() {
        if (signingKey == null) {
            try {
                // Try to decode as Base64 first (for production use with proper base64-encoded secrets)
                byte[] decodedKey = Base64.getDecoder().decode(jwtSecret);
                signingKey = Keys.hmacShaKeyFor(decodedKey);
            } catch (IllegalArgumentException e) {
                // Fall back to using the string directly
                // Generate a key that's 512 bits (64 bytes) from the secret
                byte[] secretBytes = jwtSecret.getBytes();
                byte[] key = new byte[64];
                for (int i = 0; i < key.length; i++) {
                    key[i] = secretBytes[i % secretBytes.length];
                }
                signingKey = Keys.hmacShaKeyFor(key);
            }
        }
    }
    
    private SecretKey getSigningKey() {
        initializeSigningKey();
        return signingKey;
    }
    
    /**
     * Generate JWT token for user
     */
    public String generateToken(UUID userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);
        
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("username", username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }
    
    /**
     * Get user ID from token
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        return UUID.fromString(claims.getSubject());
    }
    
    /**
     * Validate token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
