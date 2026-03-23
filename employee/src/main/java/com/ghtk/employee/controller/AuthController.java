package com.ghtk.employee.controller;

import com.ghtk.employee.model.Employee;
import com.ghtk.employee.model.Role;
import com.ghtk.employee.model.User;
import com.ghtk.employee.repository.EmployeeRepository;
import com.ghtk.employee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }

        // 1. Create and save Employee
        Employee employee = new Employee();
        employee.setFirstName(request.get("firstName"));
        employee.setLastName(request.get("lastName"));
        employee.setEmail(request.get("email"));
        employee.setPosition("New Associate"); // Default position
        employee = employeeRepository.save(employee);

        // 2. Create and save User linked to Employee
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.get("password")));
        user.setRole(Role.EMPLOYEE);
        user.setEmployee(employee);
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}
