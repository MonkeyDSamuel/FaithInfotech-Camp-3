// Staff Login JavaScript

// Login history key
const LOGIN_HISTORY_KEY = 'hospitalLoginHistory';

// Admin staff data key
const ADMIN_STAFF_DATA_KEY = 'hospitalStaffData';

// Load staff credentials from admin data
function loadStaffCredentials() {
    const staffData = localStorage.getItem(ADMIN_STAFF_DATA_KEY);
    if (!staffData) {
        return {};
    }
    
    const staffList = JSON.parse(staffData);
    const credentials = {};
    
    staffList.forEach(staff => {
        // Map department to role
        let role = '';
        switch(staff.department) {
            case 'doctor':
                role = 'doctor';
                break;
            case 'pharmacist':
                role = 'pharmacist';
                break;
            case 'reception':
            case 'receptionist':
                role = 'receptionist';
                break;
            case 'labtech':
                role = 'labtech';
                break;
            default:
                role = staff.department; // fallback
        }
        
        credentials[staff.id] = {
            password: staff.password,
            role: role,
            name: staff.name,
            department: staff.department,
            position: staff.position,
            email: staff.email,
            phone: staff.phone,
            address: staff.address,
            // Include doctor-specific data if available
            ...(staff.consultationFee && { consultationFee: staff.consultationFee }),
            ...(staff.workingDays && { workingDays: staff.workingDays }),
            ...(staff.workingHours && { workingHours: staff.workingHours })
        };
    });
    
    return credentials;
}

// Get current staff credentials
function getStaffCredentials() {
    return loadStaffCredentials();
}

// Role information
const ROLE_INFO = {
    doctor: {
        title: 'Doctor',
        description: 'Access patient records, prescriptions, and medical reports',
        icon: 'fas fa-user-md',
        dashboard: 'doctor_dashboard.html'
    },
    pharmacist: {
        title: 'Pharmacist',
        description: 'Manage medicine inventory and prescriptions',
        icon: 'fas fa-pills',
        dashboard: 'pharmacist_dashboard.html'
    },
    receptionist: {
        title: 'Receptionist',
        description: 'Handle patient registration and appointments',
        icon: 'fas fa-user-tie',
        dashboard: 'receptionist_dashboard.html'
    },
    labtech: {
        title: 'Lab Technician',
        description: 'Manage laboratory tests and reports',
        icon: 'fas fa-microscope',
        dashboard: 'labtech_dashboard.html'
    }
};

// Initialize login page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkExistingSession();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup back button handling
    setupBackButtonHandling();
    
    // Check if staff data exists
    checkStaffData();
    
    console.log('Staff Login initialized');
});

// Check if staff data exists and show appropriate message
function checkStaffData() {
    const staffCredentials = getStaffCredentials();
    const staffCount = Object.keys(staffCredentials).length;
    
    if (staffCount === 0) {
        showModal('No staff members registered yet. Please contact the administrator to register staff members.', 'info');
    } else {
        console.log(`${staffCount} staff members found in system`);
        
        // Log available staff for debugging
        console.log('Available staff members:');
        Object.keys(staffCredentials).forEach(staffId => {
            const staff = staffCredentials[staffId];
            console.log(`- ${staffId}: ${staff.name} (${staff.department})`);
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Role selection change
    document.getElementById('staffRole').addEventListener('change', function() {
        showRoleInfo(this.value);
    });
    
    // Login form submission
    document.getElementById('staffLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Reset password form submission
    document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordReset();
    });
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Check existing session
function checkExistingSession() {
    const session = getSession();
    if (session && session.isValid) {
        // Redirect to appropriate dashboard
        redirectToDashboard(session.role);
    }
}

// Setup back button handling
function setupBackButtonHandling() {
    // Listen for browser back button
    window.addEventListener('popstate', function() {
        // Clear session when back button is pressed
        clearSession();
        window.location.reload();
    });
    
    // Add a history entry to detect back button
    if (window.history.state === null) {
        window.history.pushState({ page: 'login' }, 'Staff Login', window.location.href);
    }
}

// Handle login
function handleLogin() {
    const formData = new FormData(document.getElementById('staffLoginForm'));
    const staffId = formData.get('staffId').trim();
    const password = formData.get('password');
    const role = formData.get('role');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validate inputs
    if (!staffId || !password || !role) {
        showModal('Please fill in all required fields.', 'error');
        return;
    }
    
    // Check credentials
    if (validateCredentials(staffId, password, role)) {
        const staffCredentials = getStaffCredentials();
        const staffInfo = staffCredentials[staffId];
        
        // Create session
        const session = {
            staffId: staffId,
            role: role,
            name: staffInfo.name,
            department: staffInfo.department,
            position: staffInfo.position,
            email: staffInfo.email,
            phone: staffInfo.phone,
            loginTime: new Date().toISOString(),
            isValid: true
        };
        
        // Save session
        saveSession(session, rememberMe);
        
        // Log login history
        logLoginHistory(staffId, role);
        
        // Show success message
        showModal(`Welcome back, ${session.name}! Redirecting to your dashboard...`, 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            redirectToDashboard(role);
        }, 1500);
    } else {
        showModal('Invalid credentials. Please check your Staff ID, password, and role.', 'error');
    }
}

// Validate credentials
function validateCredentials(staffId, password, role) {
    const staffCredentials = getStaffCredentials();
    const credentials = staffCredentials[staffId];
    
    console.log(`Validating credentials for Staff ID: ${staffId}, Role: ${role}`);
    console.log('Available staff credentials:', Object.keys(staffCredentials));
    
    if (!credentials) {
        console.log(`Staff ID ${staffId} not found in admin data`);
        return false;
    }
    
    console.log(`Found staff: ${credentials.name} (${credentials.department})`);
    console.log(`Password match: ${credentials.password === password}`);
    console.log(`Role match: ${credentials.role} === ${role}`);
    
    if (credentials.password !== password) {
        console.log('Password mismatch');
        return false;
    }
    
    if (credentials.role !== role) {
        console.log('Role mismatch');
        return false;
    }
    
    console.log('Credentials validated successfully');
    return true;
}

// Save session
function saveSession(session, rememberMe) {
    const sessionData = {
        ...session,
        expiresAt: rememberMe ? 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days
            new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

// Get session
function getSession() {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
        return null;
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
        clearSession();
        return null;
    }
    
    return session;
}

// Clear session
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Log login history
function logLoginHistory(staffId, role) {
    const history = JSON.parse(localStorage.getItem(LOGIN_HISTORY_KEY) || '[]');
    history.push({
        staffId: staffId,
        role: role,
        loginTime: new Date().toISOString(),
        userAgent: navigator.userAgent
    });
    
    // Keep only last 10 logins
    if (history.length > 10) {
        history.splice(0, history.length - 10);
    }
    
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history));
}

// Redirect to dashboard
function redirectToDashboard(role) {
    const dashboardInfo = ROLE_INFO[role];
    if (dashboardInfo) {
        window.location.href = dashboardInfo.dashboard;
    } else {
        showModal('Invalid role. Please try again.', 'error');
    }
}

// Show role information
function showRoleInfo(role) {
    const roleInfo = ROLE_INFO[role];
    const roleInfoDiv = document.getElementById('roleInfo');
    const roleDetailsDiv = document.getElementById('roleDetails');
    
    if (role && roleInfo) {
        roleDetailsDiv.innerHTML = `
            <div class="role-detail">
                <i class="${roleInfo.icon}"></i>
                <h5>${roleInfo.title}</h5>
                <p>${roleInfo.description}</p>
            </div>
        `;
        roleInfoDiv.style.display = 'block';
    } else {
        roleInfoDiv.style.display = 'none';
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleButton.className = 'fas fa-eye';
    }
}

// Show forgot password modal
function showForgotPassword() {
    document.getElementById('forgotPasswordModal').style.display = 'block';
}

// Close forgot password modal
function closeForgotPassword() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
    document.getElementById('resetPasswordForm').reset();
}

// Show help modal
function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
}

// Close help modal
function closeHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// Handle password reset
function handlePasswordReset() {
    const formData = new FormData(document.getElementById('resetPasswordForm'));
    const staffId = formData.get('resetStaffId');
    const role = formData.get('resetRole');
    const email = formData.get('resetEmail');
    
    // Validate inputs
    if (!staffId || !role || !email) {
        showModal('Please fill in all fields.', 'error');
        return;
    }
    
    // Check if staff exists
    const staffCredentials = getStaffCredentials();
    const credentials = staffCredentials[staffId];
    if (!credentials || credentials.role !== role) {
        showModal('Invalid Staff ID or role combination.', 'error');
        return;
    }
    
    // In a real application, this would send an email
    // For demo purposes, we'll just show a success message
    showModal('Password reset link has been sent to your email address.', 'success');
    closeForgotPassword();
}

// Show modal
function showModal(message, type = 'info') {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    
    modalMessage.innerHTML = `
        <div class="modal-${type}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <p>${message}</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Logout function (called from dashboards)
function logout() {
    clearSession();
    window.location.href = 'staff_login.html';
}

// Check if user is authenticated (called from dashboards)
function checkAuthentication() {
    const session = getSession();
    if (!session || !session.isValid) {
        window.location.href = 'staff_login.html';
        return false;
    }
    return true;
}

// Get current user info (called from dashboards)
function getCurrentUser() {
    return getSession();
}

// Auto-logout on page unload (optional security measure)
window.addEventListener('beforeunload', function() {
    // Only clear session if not using "Remember me"
    const session = getSession();
    if (session && !session.rememberMe) {
        // For demo purposes, we'll keep the session
        // In production, you might want to clear it
    }
}); 