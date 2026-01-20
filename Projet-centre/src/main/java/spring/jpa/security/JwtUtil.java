package spring.jpa.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    
    private final Key secretKey;
    private final long validityInMilliseconds = 48 * 3600 * 1000; // 48 hours

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret must not be null or empty");
        }
        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );
    }

    // ================= TOKEN GENERATION =================

    public String generateToken(String username, List<String> roles) {
        List<String> normalizedRoles = roles.stream()
                .map(r -> r == null ? "" : r)
                .map(r -> r.startsWith("ROLE_") ? r.substring("ROLE_".length()) : r)
                .map(String::toUpperCase)
                .filter(r -> !r.isBlank())
                .toList();
        
        logger.debug("Generating token for user: {} with roles: {}", username, normalizedRoles);
        
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", String.join(",", normalizedRoles))
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + validityInMilliseconds)
                )
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // ================= TOKEN PARSING =================

    public Claims extractAllClaims(String token) throws JwtException {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            logger.warn("Unsupported JWT token: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            logger.warn("Malformed JWT token: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            logger.warn("Invalid JWT signature: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            logger.warn("JWT claims string is empty: {}", e.getMessage());
            throw e;
        }
    }

    public String extractUsername(String token) throws JwtException {
        return extractAllClaims(token).getSubject();
    }

    public List<String> extractRoles(String token) throws JwtException {
        Claims claims = extractAllClaims(token);
        String roles = claims.get("roles", String.class);
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        return List.of(roles.split(","));
    }

    // ================= SPRING SECURITY =================

    public Authentication getAuthentication(String token) throws JwtException {
        Claims claims = extractAllClaims(token);
        String username = claims.getSubject();

        List<GrantedAuthority> authorities = extractRoles(token).stream()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        logger.debug("Creating authentication for user: {} with authorities: {}", username, authorities);

        return new UsernamePasswordAuthenticationToken(
                username,
                null,
                authorities
        );
    }

    // ================= VALIDATION =================

    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractAllClaims(token).getExpiration();
            return expiration.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    public boolean validateToken(String token, String username) {
        try {
            Claims claims = extractAllClaims(token);
            String extractedUsername = claims.getSubject();
            Date expiration = claims.getExpiration();
            
            boolean isValid = extractedUsername.equals(username) && 
                            !expiration.before(new Date());
            
            logger.debug("Token validation for user {}: {}", username, isValid ? "VALID" : "INVALID");
            return isValid;
            
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Token validation failed for user {}: {}", username, e.getMessage());
            return false;
        }
    }
    
    public boolean isValidToken(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    // ================= NEW GETTER FOR EXPIRY =================

    public long getValidityInMilliseconds() {
        return validityInMilliseconds;
    }
    
    public Date getExpirationDate(String token) throws JwtException {
        return extractAllClaims(token).getExpiration();
    }
}