// Global variables
let staffData = [];

// Local Storage Keys
const STAFF_DATA_KEY = 'hospitalStaffData';

// DOM Elements
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modalMessage');
const closeModal = document.querySelector('.close');

// Local Storage Functions
function saveStaffData() {
  localStorage.setItem(STAFF_DATA_KEY, JSON.stringify(staffData));
}

function loadStaffData() {
  const savedData = localStorage.getItem(STAFF_DATA_KEY);
  if (savedData) {
    staffData = JSON.parse(savedData);
  } else {
    staffData = [];
  }
}

// Navigation functionality
function showSection(id, event = null) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Only update button active state if event is provided
  if (event && event.target) {
    event.target.classList.add('active');
  }

  // Load data for specific sections
  if (id === 'view') {
    loadStaffTable();
  }
}

// Modal functionality
function showModal(message, type = 'success') {
  modalMessage.textContent = message;
  modalMessage.className = type === 'success' ? 'success-message' : 'error-message';
  modal.style.display = 'block';
}

function hideModal() {
  modal.style.display = 'none';
}

// Close modal when clicking on X or outside
closeModal.onclick = hideModal;
window.onclick = function(event) {
  if (event.target === modal) {
    hideModal();
  }
}

// Form validation
function validateForm(formData) {
  const errors = [];
  
  if (!formData.get('staffId') || formData.get('staffId').trim() === '') {
    errors.push('Staff ID is required');
  }
  
  if (!formData.get('fullName') || formData.get('fullName').trim() === '') {
    errors.push('Full name is required');
  } else if (!isValidName(formData.get('fullName'))) {
    errors.push('Name can only contain letters and spaces');
  }
  
  if (!formData.get('email') || !isValidEmail(formData.get('email'))) {
    errors.push('Email must be a valid Gmail address (ending with @gmail.com)');
  }
  
  if (!formData.get('phone') || !isValidPhone(formData.get('phone'))) {
    errors.push('Phone number must be 10 digits starting with 7, 8 or 9');
  }
  
  if (!formData.get('department') || formData.get('department') === '') {
    errors.push('Department is required');
  }
  
  if (!formData.get('position') || formData.get('position').trim() === '') {
    errors.push('Position is required');
  }
  
  if (!formData.get('address') || formData.get('address').trim() === '') {
    errors.push('Address is required');
  }
  

  
  // Doctor-specific validation
  if (formData.get('department') === 'doctor') {
    if (!formData.get('consultationFee') || formData.get('consultationFee') <= 0) {
      errors.push('Consultation fee is required for doctors');
    }
    
    const workingDays = formData.getAll('workingDays');
    if (workingDays.length === 0) {
      errors.push('Please select at least one working day');
    }
    
    if (!formData.get('startTime') || !formData.get('endTime')) {
      errors.push('Working hours are required for doctors');
    }
  }
  
  return errors;
}

function isValidPhone(phone) {
  const phoneRegex = /^[789][0-9]{9}$/;
  return phoneRegex.test(phone);
}

function isValidName(name) {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name);
}

function isValidPinCode(pinCode) {
  const pinCodeRegex = /^[0-9]{6}$/;
  return pinCodeRegex.test(pinCode);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@gmail\.com$/;
  return emailRegex.test(email);
}

// New Staff Registration
document.getElementById('newStaffForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const errors = validateForm(formData);
  
  if (errors.length > 0) {
    showModal(errors.join('\n'), 'error');
    return;
  }
  
  // Check if staff ID already exists
  if (staffData.find(staff => staff.id === formData.get('staffId'))) {
    showModal('Staff ID already exists. Please use a different ID.', 'error');
    return;
  }
  
  // Password confirmation is not needed since passwords are auto-generated
  // Both password fields will always match
  
  // Add new staff member
  const newStaff = {
    id: formData.get('staffId'),
    name: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    department: formData.get('department'),
    position: formData.get('position'),
    address: formData.get('address'),
    password: formData.get('password')
  };
  
  // Add doctor-specific data if department is doctor
  if (formData.get('department') === 'doctor') {
    newStaff.consultationFee = formData.get('consultationFee');
    newStaff.workingDays = formData.getAll('workingDays');
    newStaff.workingHours = {
      start: formData.get('startTime'),
      end: formData.get('endTime')
    };
  }
  
  staffData.push(newStaff);
  saveStaffData(); // Save to local storage
  showModal('Staff member registered successfully!', 'success');
  this.reset();
});

// Search staff for update
function searchStaff() {
  const staffId = document.getElementById('searchStaffId').value.trim();
  
  if (!staffId) {
    showModal('Please enter a Staff ID to search.', 'error');
    return;
  }
  
  const staff = staffData.find(s => s.id === staffId);
  
  if (!staff) {
    showModal('Staff member not found. Please check the Staff ID.', 'error');
    return;
  }
  
  // Populate update form
  document.getElementById('updateStaffId').value = staff.id;
  document.getElementById('updateFullName').value = staff.name;
  document.getElementById('updateEmail').value = staff.email;
  document.getElementById('updatePhone').value = staff.phone;
  document.getElementById('updateDepartment').value = staff.department;
  document.getElementById('updatePosition').value = staff.position;
  document.getElementById('updateAddress').value = staff.address || '';
  
  // Populate doctor-specific fields if staff is a doctor
  if (staff.department === 'doctor') {
    document.getElementById('updateConsultationFee').value = staff.consultationFee || '';
    document.getElementById('updateStartTime').value = staff.workingHours?.start || '';
    document.getElementById('updateEndTime').value = staff.workingHours?.end || '';
    
    // Populate working days
    const workingDaysSelect = document.getElementById('updateWorkingDays');
    if (staff.workingDays) {
      Array.from(workingDaysSelect.options).forEach(option => {
        option.selected = staff.workingDays.includes(option.value);
      });
    }
    
    // Show doctor fields and enable required validation
    document.getElementById('updateDoctorFields').style.display = 'block';
    document.getElementById('updateStartTime').required = true;
    document.getElementById('updateEndTime').required = true;
    document.getElementById('updateConsultationFee').required = true;
    document.getElementById('updateWorkingDays').required = true;
  } else {
    // Hide doctor fields and disable required validation
    document.getElementById('updateDoctorFields').style.display = 'none';
    document.getElementById('updateStartTime').required = false;
    document.getElementById('updateEndTime').required = false;
    document.getElementById('updateConsultationFee').required = false;
    document.getElementById('updateWorkingDays').required = false;
  }
  
  document.getElementById('updateStaffForm').style.display = 'block';
}

// Cancel update
function cancelUpdate() {
  document.getElementById('updateStaffForm').style.display = 'none';
  document.getElementById('searchStaffId').value = '';
  
  // Reset required attributes for doctor fields when canceling
  document.getElementById('updateStartTime').required = false;
  document.getElementById('updateEndTime').required = false;
  document.getElementById('updateConsultationFee').required = false;
  document.getElementById('updateWorkingDays').required = false;
}

// Update staff form submission
document.getElementById('updateStaffForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const staffId = formData.get('updateStaffId');
  
  // Validate phone number
  if (!isValidPhone(formData.get('updatePhone'))) {
    showModal('Phone number must be 10 digits starting with 7, 8 or 9', 'error');
    return;
  }
  
  const staffIndex = staffData.findIndex(s => s.id === staffId);
  
  if (staffIndex === -1) {
    showModal('Staff member not found.', 'error');
    return;
  }
  
  // Update staff data
  const updatedStaff = {
    ...staffData[staffIndex],
    name: formData.get('updateFullName'),
    email: formData.get('updateEmail'),
    phone: formData.get('updatePhone'),
    department: formData.get('updateDepartment'),
    position: formData.get('updatePosition'),
    address: formData.get('updateAddress')
  };
  
  // Add doctor-specific data if department is doctor
  if (formData.get('updateDepartment') === 'doctor') {
    updatedStaff.consultationFee = formData.get('updateConsultationFee');
    updatedStaff.workingDays = formData.getAll('updateWorkingDays');
    updatedStaff.workingHours = {
      start: formData.get('updateStartTime'),
      end: formData.get('updateEndTime')
    };
  } else {
    // Remove doctor-specific data if department changed from doctor
    delete updatedStaff.consultationFee;
    delete updatedStaff.workingDays;
    delete updatedStaff.workingHours;
  }
  
  staffData[staffIndex] = updatedStaff;
  
  saveStaffData(); // Save to local storage
  showModal('Staff details updated successfully!', 'success');
  this.style.display = 'none';
  document.getElementById('searchStaffId').value = '';
});

// Load staff table
function loadStaffTable() {
  const tbody = document.getElementById('staffTableBody');
  tbody.innerHTML = '';
  
  if (staffData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7f8c8d;">No staff members found. Add your first staff member!</td></tr>';
    return;
  }
  
  staffData.forEach(staff => {
    const row = document.createElement('tr');
    
    // Generate details cell content
    let detailsContent = '-';
    if (staff.department === 'doctor') {
      const consultationFee = staff.consultationFee ? `₹${staff.consultationFee}` : 'Not set';
      const workingDays = staff.workingDays ? staff.workingDays.join(', ') : 'Not set';
      const workingHours = staff.workingHours ? `${staff.workingHours.start} - ${staff.workingHours.end}` : 'Not set';
      
      detailsContent = `
        <div class="doctor-details">
          <div><strong>Fee:</strong> ${consultationFee}</div>
          <div><strong>Days:</strong> ${workingDays}</div>
          <div><strong>Hours:</strong> ${workingHours}</div>
        </div>
      `;
    } else {
      // Show address for non-doctor staff
      if (staff.address) {
        detailsContent = `<div class="address-details"><div><strong>Address:</strong> ${staff.address}</div></div>`;
      }
    }
    
    row.innerHTML = `
      <td>${staff.id}</td>
      <td>${staff.name}</td>
      <td>${staff.email}</td>
      <td>${staff.phone}</td>
      <td>${getDepartmentName(staff.department)}</td>
      <td>${staff.position}</td>
      <td>${detailsContent}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editStaff('${staff.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn delete-btn" onclick="deleteStaff('${staff.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getDepartmentName(department) {
  const departments = {
    'reception': 'Reception',
    'doctor': 'Doctor',
    'labtech': 'Lab Technician',
    'pharmacist': 'Pharmacist'
  };
  return departments[department] || department;
}

// Search staff table
function searchStaffTable() {
  const searchTerm = document.getElementById('staffSearch').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value;
  
  const filteredData = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm) ||
                         staff.id.toLowerCase().includes(searchTerm) ||
                         staff.department.toLowerCase().includes(searchTerm);
    
    const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  
  displayFilteredStaff(filteredData);
}

function displayFilteredStaff(filteredData) {
  const tbody = document.getElementById('staffTableBody');
  tbody.innerHTML = '';
  
  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7f8c8d;">No staff members found</td></tr>';
    return;
  }
  
  filteredData.forEach(staff => {
    const row = document.createElement('tr');
    
    // Generate details cell content
    let detailsContent = '-';
    if (staff.department === 'doctor') {
      const consultationFee = staff.consultationFee ? `₹${staff.consultationFee}` : 'Not set';
      const workingDays = staff.workingDays ? staff.workingDays.join(', ') : 'Not set';
      const workingHours = staff.workingHours ? `${staff.workingHours.start} - ${staff.workingHours.end}` : 'Not set';
      
      detailsContent = `
        <div class="doctor-details">
          <div><strong>Fee:</strong> ${consultationFee}</div>
          <div><strong>Days:</strong> ${workingDays}</div>
          <div><strong>Hours:</strong> ${workingHours}</div>
        </div>
      `;
    } else {
      // Show address for non-doctor staff
      if (staff.address) {
        detailsContent = `<div class="address-details"><div><strong>Address:</strong> ${staff.address}</div></div>`;
      }
    }
    
    row.innerHTML = `
      <td>${staff.id}</td>
      <td>${staff.name}</td>
      <td>${staff.email}</td>
      <td>${staff.phone}</td>
      <td>${getDepartmentName(staff.department)}</td>
      <td>${staff.position}</td>
      <td>${detailsContent}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editStaff('${staff.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn delete-btn" onclick="deleteStaff('${staff.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Edit staff from table
function editStaff(staffId) {
  const staff = staffData.find(s => s.id === staffId);
  if (!staff) return;
  
  // Switch to update section and populate form
  showSection('updated');
  
  document.getElementById('searchStaffId').value = staff.id;
  document.getElementById('updateStaffId').value = staff.id;
  document.getElementById('updateFullName').value = staff.name;
  document.getElementById('updateEmail').value = staff.email;
  document.getElementById('updatePhone').value = staff.phone;
  document.getElementById('updateDepartment').value = staff.department;
  document.getElementById('updatePosition').value = staff.position;
  document.getElementById('updateAddress').value = staff.address || '';
  
  // Handle doctor-specific fields
  if (staff.department === 'doctor') {
    document.getElementById('updateConsultationFee').value = staff.consultationFee || '';
    document.getElementById('updateStartTime').value = staff.workingHours?.start || '';
    document.getElementById('updateEndTime').value = staff.workingHours?.end || '';
    
    // Populate working days
    const workingDaysSelect = document.getElementById('updateWorkingDays');
    if (staff.workingDays) {
      Array.from(workingDaysSelect.options).forEach(option => {
        option.selected = staff.workingDays.includes(option.value);
      });
    }
    
    // Show doctor fields and enable required validation
    document.getElementById('updateDoctorFields').style.display = 'block';
    document.getElementById('updateStartTime').required = true;
    document.getElementById('updateEndTime').required = true;
    document.getElementById('updateConsultationFee').required = true;
    document.getElementById('updateWorkingDays').required = true;
  } else {
    // Hide doctor fields and disable required validation
    document.getElementById('updateDoctorFields').style.display = 'none';
    document.getElementById('updateStartTime').required = false;
    document.getElementById('updateEndTime').required = false;
    document.getElementById('updateConsultationFee').required = false;
    document.getElementById('updateWorkingDays').required = false;
  }
  
  document.getElementById('updateStaffForm').style.display = 'block';
}

// Delete staff
function deleteStaff(staffId) {
  if (confirm('Are you sure you want to delete this staff member?')) {
    staffData = staffData.filter(staff => staff.id !== staffId);
    saveStaffData(); // Save to local storage
    loadStaffTable();
    showModal('Staff member deleted successfully!', 'success');
  }
}

// Change password functionality
document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const staffId = formData.get('passwordStaffId');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmNewPassword');
  
  if (!staffId) {
    showModal('Please enter a Staff ID.', 'error');
    return;
  }
  
  const staff = staffData.find(s => s.id === staffId);
  if (!staff) {
    showModal('Staff member not found. Please check the Staff ID.', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showModal('Passwords do not match.', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showModal('Password must be at least 6 characters long.', 'error');
    return;
  }
  
  // Update password
  staff.password = newPassword;
  saveStaffData(); // Save to local storage
  showModal('Password changed successfully!', 'success');
  this.reset();
  document.getElementById('staffName').value = '';
});

// Auto-populate staff name when staff ID is entered
document.getElementById('passwordStaffId').addEventListener('blur', function() {
  const staffId = this.value.trim();
  const staffNameField = document.getElementById('staffName');
  
  if (staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (staff) {
      staffNameField.value = staff.name;
    } else {
      staffNameField.value = '';
    }
  } else {
    staffNameField.value = '';
  }
});

// Department filter change
document.getElementById('departmentFilter').addEventListener('change', searchStaffTable);

// Logout functionality
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear any stored data
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'admin_login.html';
  }
}

// Check admin authentication
function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('adminLoggedIn');
  const loginTime = localStorage.getItem('adminLoginTime');
  
  if (!isLoggedIn || !loginTime) {
    window.location.href = 'admin_login.html';
    return false;
  }
  
  // Check if session is expired (24 hours)
  const loginDate = new Date(loginTime);
  const now = new Date();
  const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'admin_login.html';
    return false;
  }
  
  return true;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication first
  if (!checkAdminAuth()) {
    return;
  }
  
  // Load staff data from local storage
  loadStaffData();
  
  // Show default section
  showSection('new');
  
  // Load initial staff table data
  loadStaffTable();
  
  // Add event listeners for search
  document.getElementById('staffSearch').addEventListener('input', searchStaffTable);
  
  // Initialize required attributes for doctor fields (disabled by default since fields are hidden)
  document.getElementById('startTime').required = false;
  document.getElementById('endTime').required = false;
  document.getElementById('consultationFee').required = false;
  document.getElementById('workingDays').required = false;
  
  document.getElementById('updateStartTime').required = false;
  document.getElementById('updateEndTime').required = false;
  document.getElementById('updateConsultationFee').required = false;
  document.getElementById('updateWorkingDays').required = false;
  
  console.log('Admin Dashboard initialized successfully!');
  
  // Auto-generate password when full name is entered
  document.getElementById('fullName').addEventListener('input', function() {
    const fullName = this.value.trim();
    const staffId = document.getElementById('staffId').value;
    const department = document.getElementById('department').value;
    
    if (fullName && staffId && department) {
      const firstName = fullName.split(' ')[0];
      const generatedPassword = generatePassword(firstName, staffId);
      document.getElementById('password').value = generatedPassword;
      document.getElementById('confirmPassword').value = generatedPassword;
    }
  });
  
  // Note: PIN code auto-population removed since address is now a single textarea
});

// Note: Country-state data removed since address is now a single textarea

// Note: populateStateAndDistrict function removed since address is now a single textarea

// Note: fetchAddressFromPinCode function removed since address is now a single textarea

// Utility functions
function generateStaffId(department) {
  const departmentPrefixes = {
    'doctor': 'DOC',
    'reception': 'REC',
    'labtech': 'LAB',
    'pharmacist': 'PHM'
  };
  
  const prefix = departmentPrefixes[department];
  if (!prefix) {
    return '';
  }
  
  // Get existing IDs for this department
  const existingIds = staffData
    .filter(staff => staff.department === department)
    .map(staff => staff.id);
  
  let counter = 1;
  let newId = `${prefix}${counter.toString().padStart(4, '0')}`;
  
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${counter.toString().padStart(4, '0')}`;
  }
  
  return newId;
}

function generatePassword(firstName, staffId) {
  // Remove any special characters and spaces from first name
  const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  // Combine first name with staff ID
  return `${cleanFirstName}${staffId}`;
}

// Role suggestions for each department
const roleSuggestions = {
  'doctor': [
    'Cardiologist',
    'Neurologist',
    'Orthopedic Surgeon',
    'Pediatrician',
    'General Physician',
    'Dermatologist',
    'Psychiatrist',
    'Oncologist',
    'Radiologist',
    'Anesthesiologist'
  ],
  'reception': [
    'Receptionist',
    'Front Desk Officer',
    'Patient Coordinator',
    'Appointment Scheduler',
    'Customer Service Representative'
  ],
  'labtech': [
    'Lab Technician',
    'Medical Laboratory Scientist',
    'Clinical Laboratory Technician',
    'Pathology Technician',
    'Blood Bank Technician',
    'Microbiology Technician'
  ],
  'pharmacist': [
    'Clinical Pharmacist',
    'Hospital Pharmacist',
    'Pharmacy Manager',
    'Drug Information Specialist',
    'Clinical Pharmacy Specialist'
  ]
};

// Auto-generate staff ID and populate role suggestions when department is selected
document.getElementById('department').addEventListener('change', function() {
  const department = this.value;
  const staffIdField = document.getElementById('staffId');
  const positionField = document.getElementById('position');
  const positionSuggestions = document.getElementById('positionSuggestions');
  const doctorFields = document.getElementById('doctorFields');
  
  if (department) {
    // Generate staff ID
    const generatedId = generateStaffId(department);
    staffIdField.value = generatedId;
    
    // Auto-generate password when both name and staff ID are available
    const fullNameField = document.getElementById('fullName');
    if (fullNameField.value.trim()) {
      const firstName = fullNameField.value.trim().split(' ')[0];
      const generatedPassword = generatePassword(firstName, generatedId);
      document.getElementById('password').value = generatedPassword;
      document.getElementById('confirmPassword').value = generatedPassword;
    }
    
    // Populate role suggestions
    const suggestions = roleSuggestions[department] || [];
    positionSuggestions.innerHTML = '';
    suggestions.forEach(role => {
      const option = document.createElement('option');
      option.value = role;
      positionSuggestions.appendChild(option);
    });
    
    // Add hover title for suggestions
    positionField.title = `Suggested roles: ${suggestions.join(', ')}`;
    
    // Show/hide doctor-specific fields
    if (department === 'doctor') {
      doctorFields.style.display = 'block';
      // Enable required validation for doctor fields
      document.getElementById('startTime').required = true;
      document.getElementById('endTime').required = true;
      document.getElementById('consultationFee').required = true;
      document.getElementById('workingDays').required = true;
    } else {
      doctorFields.style.display = 'none';
      // Disable required validation for doctor fields when hidden
      document.getElementById('startTime').required = false;
      document.getElementById('endTime').required = false;
      document.getElementById('consultationFee').required = false;
      document.getElementById('workingDays').required = false;
    }
  } else {
    staffIdField.value = '';
    positionSuggestions.innerHTML = '';
    positionField.title = '';
    doctorFields.style.display = 'none';
  }
});

// Update role suggestions for update form
document.getElementById('updateDepartment').addEventListener('change', function() {
  const department = this.value;
  const positionField = document.getElementById('updatePosition');
  const positionSuggestions = document.getElementById('updatePositionSuggestions');
  const updateDoctorFields = document.getElementById('updateDoctorFields');
  
  if (department) {
    // Populate role suggestions
    const suggestions = roleSuggestions[department] || [];
    positionSuggestions.innerHTML = '';
    suggestions.forEach(role => {
      const option = document.createElement('option');
      option.value = role;
      positionSuggestions.appendChild(option);
    });
    
    // Add hover title for suggestions
    positionField.title = `Suggested roles: ${suggestions.join(', ')}`;
    
    // Show/hide doctor-specific fields
    if (department === 'doctor') {
      updateDoctorFields.style.display = 'block';
      // Enable required validation for doctor fields
      document.getElementById('updateStartTime').required = true;
      document.getElementById('updateEndTime').required = true;
      document.getElementById('updateConsultationFee').required = true;
      document.getElementById('updateWorkingDays').required = true;
    } else {
      updateDoctorFields.style.display = 'none';
      // Disable required validation for doctor fields when hidden
      document.getElementById('updateStartTime').required = false;
      document.getElementById('updateEndTime').required = false;
      document.getElementById('updateConsultationFee').required = false;
      document.getElementById('updateWorkingDays').required = false;
    }
  } else {
    positionSuggestions.innerHTML = '';
    positionField.title = '';
    updateDoctorFields.style.display = 'none';
  }
});
