package com.ghtk.employee.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;  // This will store the BCrypt hash

    @Enumerated(EnumType.STRING)
    private Role role;;   // ADMIN or EMPLOYEE

    @OneToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // Links back to your existing Employee entity

}
