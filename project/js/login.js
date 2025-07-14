// Check if admin is already logged in
function checkExistingSession() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (isLoggedIn && loginTime) {
        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
            // Session is valid, redirect to dashboard
            window.location.href = "../pages/admin_dashboard.html";
            return true;
        } else {
            // Session expired, clear it
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
        }
    }
    return false;
}

function login(event) {
    event.preventDefault(); // Prevent form from submitting

    let uname = document.getElementById("username").value;
    let pwd = document.getElementById("password").value;
    let un = "admin";
    let pw = "admin123";

    if (uname === un && pwd === pw) {
        // Set admin session
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        
        // Successful login - redirect to admin dashboard
        window.location.href = "../pages/admin_dashboard.html";
    } else {
        alert("Login failed! Please try again.");
    }
}

// Check for existing session when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
});
