/**
 * auth.js - Handles frontend security and API interactions
 */

// 1. Handle Login Form Submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');

        try {
            // Using Basic Auth for the Minor Project simplicity
            // In a real app, this would return a JWT token
            const credentials = btoa(`${username}:${password}`);
            const response = await fetch('/api/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.ok) {
                // Save credentials to state (In production use HttpOnly cookies/JWT)
                localStorage.setItem('auth_token', credentials);
                localStorage.setItem('username', username);
                
                // For a minor project, we can fetch user role from a custom endpoint
                // or just redirect and let the backend handle access control
                window.location.href = 'index.html'; 
            } else {
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Login Error:", error);
            errorDiv.textContent = "Server connection failed.";
            errorDiv.classList.remove('hidden');
        }
    });
}

// 2. Protect Dashboard (Run this on index.html/dashboard_preview.html)
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// 3. Logout function
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Automatically check auth if on a protected page
if (document.title.includes('Dashboard')) {
    checkAuth();
}