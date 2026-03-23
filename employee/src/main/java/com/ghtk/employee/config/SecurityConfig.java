package com.ghtk.employee.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception{
        httpSecurity
                .cors(Customizer.withDefaults()) // Enable CORS
                .csrf(csrf -> csrf.disable())//disabled for simpler development in minor projects
                .authorizeHttpRequests(auth -> auth
                        // Allow anyone to access the static frontend files
                        .requestMatchers("/", "/index.html", "/login.html", "/css/**", "/js/**").permitAll()

                        // Restrict Employee Management to ADMIN only
                        .requestMatchers(HttpMethod.POST, "/api/employees/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/employees/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/employees/**").hasRole("ADMIN")

                        // Allow authenticated users (Admin & Employee) to view the list
                        .requestMatchers(HttpMethod.GET, "/api/employees/**").authenticated()

                        // Leave Management Rules
                        .requestMatchers(HttpMethod.POST, "/api/leaves/**").authenticated() // Employees can apply
                        .requestMatchers(HttpMethod.PUT, "/api/leaves/**").hasRole("ADMIN") // Only Admins approve/reject
                        .requestMatchers(HttpMethod.GET, "/api/leaves/**").authenticated() // Everyone can view relevant leaves

                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults()) // Enables testing via Postman/Browsers
                .formLogin(form -> form
                        .loginPage("/login.html")
                        .defaultSuccessUrl("/index.html", true)
                        .permitAll()
                )
                .logout(logout-> logout.permitAll());
        return httpSecurity.build();
    }

    // CORS CONFIGURATION: This explicitly allows your frontend to talk to the backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Add your frontend URL here
        configuration.setAllowedOrigins(Arrays.asList("http://127.0.0.1:5500", "http://localhost:5500"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
