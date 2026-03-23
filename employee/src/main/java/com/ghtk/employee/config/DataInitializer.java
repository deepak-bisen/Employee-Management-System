package com.ghtk.employee.config;

import com.ghtk.employee.model.User;
import com.ghtk.employee.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer ensures that an Admin account exists when the application starts.
 * This is perfect for college minor projects as it simplifies the initial setup.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if the admin user already exists
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            // Hash the password "admin123" properly using BCrypt
            admin.setPassword(passwordEncoder.encode("admin123"));

            // Note: Since 'Role' enum is package-private in your model,
            // ensure this class can access it or use the string if it was a String field.
            // Based on your previous code, it's Role.ADMIN
            try {
                // Assuming Role is accessible or using valueOf
                admin.setRole(com.ghtk.employee.model.Role.valueOf("ADMIN"));
            } catch (Exception e) {
                System.err.println("Error setting role: " + e.getMessage());
            }

            userRepository.save(admin);
            System.out.println(">>> Initial Admin User Created: admin / admin123");
        } else {
            System.out.println(">>> Admin user already exists. Skipping initialization.");
        }
    }
}
