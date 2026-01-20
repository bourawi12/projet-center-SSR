package spring.jpa.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);
    private final JwtUtil jwtUtil;

    public JwtTokenFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String requestMethod = request.getMethod();
        
        logger.debug("=== JWT Filter Processing ===");
        logger.debug("Path: {} {}", requestMethod, requestPath);
        
        // Skip authentication for public paths
        if (isPublicPath(requestPath)) {
            logger.debug("Public path, skipping JWT validation");
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = resolveToken(request);

        if (token != null) {
            logger.debug("Token found: {}...", token.substring(0, Math.min(20, token.length())));
            try {
                Authentication auth = jwtUtil.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(auth);
                logger.debug("Authentication set for user: {} with authorities: {}", 
                            auth.getName(), auth.getAuthorities());
            } catch (io.jsonwebtoken.JwtException e) {
                logger.warn("JWT invalid: {} - {}", e.getClass().getSimpleName(), e.getMessage());
                SecurityContextHolder.clearContext();
            } catch (Exception e) {
                logger.error("JWT validation failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            logger.debug("No token found in request");
        }

        filterChain.doFilter(request, response);
    }
    
    private boolean isPublicPath(String path) {
        return path.startsWith("/auth/") ||
               path.equals("/auth") ||
               path.endsWith(".html") ||
               path.endsWith(".css") ||
               path.endsWith(".js") ||
               path.equals("/favicon.ico") ||
               path.startsWith("/js/") ||
               path.startsWith("/css/");
    }

    private String resolveToken(HttpServletRequest request) {
        // Method 1: Try to get from Authorization header (Bearer token)
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            logger.debug("Token found in Authorization header");
            return token;
        }

        // Method 2: Try to get from Cookie header (as string)
        String cookieHeader = request.getHeader("Cookie");
        if (cookieHeader != null) {
            logger.debug("Cookie header present");
            String[] cookies = cookieHeader.split(";");
            for (String cookie : cookies) {
                String trimmedCookie = cookie.trim();
                if (trimmedCookie.startsWith("JWT=")) {
                    String token = trimmedCookie.substring(4);
                    logger.debug("Token found in Cookie header");
                    return token;
                }
            }
        }

        // Method 3: Try to get from actual Cookie objects (browser)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("JWT".equals(cookie.getName())) {
                    logger.debug("Token found in Cookie object");
                    return cookie.getValue();
                }
            }
        }
        
        // Method 4: Try query parameter (for development/testing)
        String queryToken = request.getParameter("token");
        if (queryToken != null && !queryToken.isEmpty()) {
            logger.debug("Token found in query parameter");
            return queryToken;
        }

        return null;
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip filter for truly public paths to improve performance
        return path.startsWith("/auth/") || 
               path.equals("/auth") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.equals("/favicon.ico");
    }
}
