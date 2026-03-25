EMS Pro: Advanced Employee Management System
--------------------------------------------
EMS Pro is a full-stack, secure web application designed for modern workplace management. Beyond simple record-keeping, it integrates role-based access control, automated leave management workflows, and real-time data visualization.

📝 Project Overview
-------------------
This system serves as a robust solution for HR departments to manage staff records and for employees to interact with company processes like leave applications. The backend is powered by Spring Boot 3 with a MariaDB database, secured via Spring Security. The frontend is a high-performance Single Page Application (SPA) built with vanilla JavaScript, Tailwind CSS, and Chart.js.

✨ Key Features
----------------
🔐 Secure Access Control
-
* Role-Based Security (RBAC): Distinct permissions for ADMIN and EMPLOYEE roles.
* Encrypted Passwords: BCrypt hashing for all user credentials.
* Automated Initialization: System automatically creates an initial admin account (admin / admin123) on first launch.

👥 Staff Management (Admin Only)
---------------------------------
* Full CRUD: Create, View, Update, and Delete employee records.
* User Linking: Every system user is linked to a specific employee profile.

📅 Leave Management Workflow
----------------------------
* Application: Employees can apply for leaves with start/end dates and specific reasons.
* Moderation: Admins have a dedicated interface to Approve or Reject pending requests.
* History: Employees can track the real-time status of their own applications.

📊 Real-time Analytics
----------------------
* Distribution Charts: Visual breakdown of leave statuses (Pending/Approved/Rejected).
* Trend Analysis: Monthly request volume tracking via interactive bar charts.

🛠️ Technology Stack
-------------------
Layer               Technologies
-
* Backend           Java 21, Spring Boot 3.5, Spring Data JPA, Spring Security
* Database          MariaDB 11+
* Frontend          HTML5, Tailwind CSS, JavaScript (ES6+), Chart.js
* Build Tools       Maven, Lombok

🚀 Getting Started
------------------
Prerequisites
-
* JDK 21 installed.
* MariaDB server running.
* Maven (or use the included ./mvnw wrapper).

1. Database Setup
   -
* Create the database in your MariaDB console:
* CREATE DATABASE employee_db;


2. Backend Configuration
   -
* Update employee/src/main/resources/application.properties with your database credentials:
  
spring.datasource.username=your_username
spring.datasource.password=your_password


3. Run the Application
   -
Navigate to the employee directory and start the server:

./mvnw spring-boot:run

The server will start at http://localhost:8080.

4. Launch Frontend
   -  
Open employee-frontend/index.html in any modern web browser.

* Initial Admin Login: admin / admin123
* Employee Access: Use the "Register" link on the login page.

📖 API Reference
-
Method       Endpoint                Access               Description
-
* POST      /api/auth/register       Public               Register a new Employee account
* GET       /api/employees           Authenticated        List all employees
* POST      /api/employees           Admin Only           Add a new employee
* PUT       /api/employees/{id}      Admin Only           Update employee details
* POST      /api/leaves              Authenticated        Submit a leave request
* PUT       /api/leaves/{id}/status  Admin Only           Approve/Reject a leave request

🛡️ Security Architecture
-
* Basic Authentication: Secure headers used for all API communication.
* CSRF Protection: Configured for development/minor project compatibility.
* CORS: Explicitly configured to allow secure communication between the frontend and backend.

🤝 Contributing
-
* Fork the Project.
* Create your Feature Branch (git checkout -b feature/AmazingFeature).
* Commit your Changes (git commit -m 'Add some AmazingFeature').
* Push to the Branch (git push origin feature/AmazingFeature).
* Open a Pull Request.
