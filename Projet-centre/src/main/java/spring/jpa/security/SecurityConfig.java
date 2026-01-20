package spring.jpa.security;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    private final JwtTokenFilter jwtTokenFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    
    public SecurityConfig(JwtUtil jwtUtil, JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {
        this.jwtTokenFilter = new JwtTokenFilter(jwtUtil);
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
            )
            .authorizeHttpRequests(auth -> auth
                // ========== PUBLIC PATHS (NO AUTHENTICATION NEEDED) ==========
                // Auth endpoints
                .requestMatchers("/auth/**").permitAll()
                
                // Static resources
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                .requestMatchers("/index.html", "/signup.html", "/login.html").permitAll()
                .requestMatchers("/favicon.ico").permitAll()
                .requestMatchers("/js/**", "/css/**").permitAll()
                
                // ========== AUTHENTICATED PATHS ==========
                .requestMatchers("/welcome.html").authenticated()
                
                // ========== USER-SPECIFIC ENDPOINTS ==========
                .requestMatchers("/etudiant/me").hasAnyRole("ADMIN", "ETUDIANT")
                .requestMatchers("/formateur/me").hasAnyRole("ADMIN", "FORMATEUR")
                .requestMatchers("/etudiants/me").hasAnyRole("ADMIN", "ETUDIANT")
                .requestMatchers("/formateurs/me/**").hasAnyRole("ADMIN", "FORMATEUR")
                .requestMatchers("/cours/me").hasAnyRole("ADMIN", "FORMATEUR")
                .requestMatchers("/seances/etudiant/me").hasAnyRole("ADMIN", "ETUDIANT")
                
                // ========== ADMIN REST ENDPOINTS (PLURAL) ==========
                .requestMatchers("/etudiants/**").hasRole("ADMIN")
                .requestMatchers("/formateurs/**").hasRole("ADMIN")
                .requestMatchers("/cours/**").hasRole("ADMIN")
                .requestMatchers("/notes/**").authenticated()
                .requestMatchers("/sessions/**").hasRole("ADMIN")
                .requestMatchers("/specialites/**").hasRole("ADMIN")
                .requestMatchers("/groupes/**").hasRole("ADMIN")
                .requestMatchers("/seances/**").hasRole("ADMIN")
                .requestMatchers("/reports/**").authenticated()
                .requestMatchers("/inscriptions/by-course/**").hasAnyRole("ADMIN", "FORMATEUR")
                .requestMatchers("/inscriptions/**").hasAnyRole("ADMIN", "ETUDIANT")
                
                // ========== PUBLIC GET ENDPOINTS ==========
                .requestMatchers(HttpMethod.GET, "/seances/**").permitAll()
                
                // ========== ADMIN MVC ENDPOINTS ==========
                .requestMatchers("/admin/**").hasRole("ADMIN")
                
                // ========== BROADER USER PATTERNS ==========
                .requestMatchers("/etudiant/**").hasAnyRole("ADMIN", "ETUDIANT")
                .requestMatchers("/formateur/**").hasAnyRole("ADMIN", "FORMATEUR")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:5500" // For live server HTML testing
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Cookie"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // 1 hour
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
