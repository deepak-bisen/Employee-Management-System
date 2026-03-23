package com.ghtk.employee.controller;

import com.ghtk.employee.model.LeaveRequest;
import com.ghtk.employee.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestRepository leaveRepository;

    @GetMapping
    public List<LeaveRequest> getAllRequests() {
        return leaveRepository.findAll();
    }

    @PostMapping
    public LeaveRequest applyForLeave(@RequestBody LeaveRequest request) {
        request.setStatus("PENDING");
        return leaveRepository.save(request);
    }

    @PutMapping("/{id}/status")
    public LeaveRequest updateStatus(@PathVariable Long id, @RequestParam String status) {
        LeaveRequest request = leaveRepository.findById(id).orElseThrow();
        request.setStatus(status);
        return leaveRepository.save(request);
    }
}
