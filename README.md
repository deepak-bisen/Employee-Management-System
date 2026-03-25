#Employee Management System
 --------------------------
 
#EMS Pro - Secure Employee Management & Analytics System

📝 Overview
-
EMS Pro is a robust, full-stack enterprise-grade web application designed for comprehensive employee lifecycle management. Beyond standard CRUD operations, this "Pro" version incorporates advanced security, role-based access control (RBAC), a leave management workflow, and real-time data visualization.
The system features a Spring Boot backend with a MariaDB database and a sophisticated, responsive frontend styled with Tailwind CSS and powered by Chart.js.

✨ Features
-
Secure Authentication: Multi-role login system (Admin & Employee) using Spring Security and BCrypt password hashing.
Employee Directory: Full CRUD capabilities for staff records.
Leave Management Center:
Employees: Can submit leave requests with start/end dates and specific reasons.
Admins: Can moderate (Approve/Reject) company-wide requests.
Interactive Analytics: Data-driven dashboard visualizing leave distributions and monthly request trends.
Advanced Frontend Logic: Features a client-side API caching layer, input sanitization for XSS prevention, and a modular utility system.
Responsive Design: A sleek, indigo-themed interface that adapts perfectly to mobile, tablet, and desktop viewports.

🛠️ Technologies Used
-
Backend
   Java 21
   Spring Boot 3.5.5
   Spring Security (Basic Auth & Role-based Authorization)
   Spring Data JPA / Hibernate
   MariaDB (Database)
   Lombok (Boilerplate reduction)
   Maven (Build Tool)

Frontend
  HTML5 / CSS3
  JavaScript (ES6+)
  Tailwind CSS (Utility-first styling)
  Chart.js (Data visualization)
  Font Awesome 6 (Iconography)

🚀 Getting Started
-
Prerequisites
JDK 21 or later
Apache Maven
MariaDB Server
A modern web browser
Backend Setup
Clone the Repository
git clone [https://github.com/deepak-bisen/Employee-Management-System.git](https://github.com/deepak-bisen/Employee-Management-System.git)
cd Employee-Management-System/employee


Database Configuration
Create a database named employee_db in your MariaDB/MySQL instance.
Update src/main/resources/application.properties with your credentials:
spring.datasource.username=your_username
spring.datasource.password=your_password


Run the Application
mvn spring-boot:run

The server will start on http://localhost:8080.
Frontend Setup
Navigate to the employee-frontend directory.
Open index.html in your browser.
Tip: Use a local server extension (like VS Code Live Server) for the best experience.
🔑 Default Credentials
The application automatically initializes an administrator account on first run:
Username: admin
Password: admin123
📖 API Endpoints Reference
Authentication & Staff
Method
Endpoint
Description
Access
POST
/api/auth/register
Register a new user & employee profile
Public
GET
/api/employees
List all employees
Authenticated
POST
/api/employees
Create a new employee
Admin Only
PUT
/api/employees/{id}
Update employee details
Admin Only
DELETE
/api/employees/{id}
Remove employee profile
Admin Only

Leave Management
Method
Endpoint
Description
Access
GET
/api/leaves
Fetch leave requests (filtered by user role)
Authenticated
POST
/api/leaves
Submit a new leave application
Authenticated
PUT
/api/leaves/{id}/status
Update status (APPROVED/REJECTED)
Admin Only

🤝 Contributing
Fork the Project
Create your Feature Branch (git checkout -b feature/NewFeature)
Commit your Changes (git commit -m 'Add some NewFeature')
Push to the Branch (git push origin feature/NewFeature)
Open a Pull Request
