// Staff Dashboard Shared JavaScript Functions

// Global variables
let currentData = [];
const DATA_KEY = 'hospitalData';

// Authentication constants
const SESSION_KEY = 'hospitalStaffSession';

// DOM Elements
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modalMessage');
const closeModal = document.querySelector('.close');

// Local Storage Functions
function saveData(data, key = DATA_KEY) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key = DATA_KEY) {
  const savedData = localStorage.getItem(key);
  if (savedData) {
    return JSON.parse(savedData);
  } else {
    return [];
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
}

// Modal functionality
function showModal(message, type = 'success') {
  if (modalMessage) {
    modalMessage.textContent = message;
    modalMessage.className = type === 'success' ? 'success-message' : 'error-message';
  }
  if (modal) {
    modal.style.display = 'block';
  }
}

function hideModal() {
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal when clicking on X or outside
if (closeModal) {
  closeModal.onclick = hideModal;
}

window.onclick = function(event) {
  if (event.target === modal) {
    hideModal();
  }
}

// Form validation functions
function validateRequired(value, fieldName) {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

function validatePhone(phone) {
  const phoneRegex = /^[789][0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    return 'Phone number must be 10 digits starting with 7, 8 or 9';
  }
  return null;
}

function validateName(name) {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name)) {
    return 'Name can only contain letters and spaces';
  }
  return null;
}

function validateAge(age) {
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
    return 'Please enter a valid age (0-150)';
  }
  return null;
}

function validateDate(date) {
  const selectedDate = new Date(date);
  const today = new Date();
  if (selectedDate > today) {
    return 'Date cannot be in the future';
  }
  return null;
}

// Validate appointment date - allows future dates but not past dates
function validateAppointmentDate(date) {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  
  if (selectedDate < today) {
    return 'Appointment date cannot be in the past';
  }
  return null;
}

// Generic form validation
function validateForm(formData, validationRules) {
  const errors = [];
  
  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const value = formData.get(fieldName);
    
    // Required validation
    if (rules.required) {
      const requiredError = validateRequired(value, rules.label || fieldName);
      if (requiredError) {
        errors.push(requiredError);
        continue;
      }
    }
    
    // Type-specific validations
    if (value && value.trim() !== '') {
      if (rules.type === 'email') {
        const emailError = validateEmail(value);
        if (emailError) errors.push(emailError);
      }
      
      if (rules.type === 'phone') {
        const phoneError = validatePhone(value);
        if (phoneError) errors.push(phoneError);
      }
      
      if (rules.type === 'name') {
        const nameError = validateName(value);
        if (nameError) errors.push(nameError);
      }
      
      if (rules.type === 'age') {
        const ageError = validateAge(value);
        if (ageError) errors.push(ageError);
      }
      
      if (rules.type === 'date') {
        const dateError = validateDate(value);
        if (dateError) errors.push(dateError);
      }
      
      if (rules.type === 'appointmentDate') {
        const dateError = validateAppointmentDate(value);
        if (dateError) errors.push(dateError);
      }
      
      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) errors.push(customError);
      }
    }
  }
  
  return errors;
}

// Search and filter functions
function searchTable(searchTerm, data, searchFields) {
  if (!searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

function filterTable(filterValue, data, filterField) {
  if (!filterValue || filterValue === '') return data;
  
  return data.filter(item => {
    return item[filterField] === filterValue;
  });
}

// Table display functions
function displayTableData(data, tableBodyId, displayFunction) {
  const tableBody = document.getElementById(tableBodyId);
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="100%" style="text-align: center; padding: 2rem; color: #7f8c8d;">No data found</td>';
    tableBody.appendChild(row);
    return;
  }
  
  data.forEach(item => {
    const row = displayFunction(item);
    tableBody.appendChild(row);
  });
}

// Utility functions
function generateId(prefix = 'ID') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(timeString) {
  if (!timeString) return '';
  return timeString;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function getStatusBadge(status) {
  const statusClasses = {
    'active': 'status-active',
    'inactive': 'status-inactive',
    'pending': 'status-pending',
    'scheduled': 'status-pending',
    'completed': 'status-active',
    'cancelled': 'status-inactive',
    'no-show': 'status-inactive'
  };
  
  const className = statusClasses[status.toLowerCase()] || 'status-pending';
  return `<span class="status-badge ${className}">${status}</span>`;
}

// Search input functionality
function setupSearchInput(searchInputId, searchFunction) {
  const searchInput = document.getElementById(searchInputId);
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      searchFunction(searchTerm);
    });
  }
}

// Filter dropdown functionality
function setupFilterDropdown(filterSelectId, filterFunction) {
  const filterSelect = document.getElementById(filterSelectId);
  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      const filterValue = this.value;
      filterFunction(filterValue);
    });
  }
}

// Form reset functionality
function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    // Clear any custom styling or validation states
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('error', 'success');
    });
  }
}

// Confirmation dialog
function confirmAction(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}

// Loading state management
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading"></div> Loading...';
    element.disabled = true;
  }
}

function hideLoading(elementId, originalText) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = originalText;
    element.disabled = false;
  }
}

// Auto-generate ID based on prefix
function generateAutoId(prefix, existingData) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Count existing entries for today
  const todayEntries = existingData.filter(item => {
    const itemDate = new Date(item.createdAt || item.date || Date.now());
    return itemDate.toDateString() === today.toDateString();
  });
  
  const sequence = String(todayEntries.length + 1).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// Date and time utilities
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
  return new Date().toTimeString().split(' ')[0].substring(0, 5);
}

function isToday(dateString) {
  const today = new Date();
  const checkDate = new Date(dateString);
  return checkDate.toDateString() === today.toDateString();
}

// Authentication Functions
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

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function checkAuthentication() {
  const session = getSession();
  if (!session || !session.isValid) {
    window.location.href = 'staff_login.html';
    return false;
  }
  return true;
}

function getCurrentUser() {
  return getSession();
}

function logout() {
  clearSession();
  window.location.href = 'staff_login.html';
}

// Initialize authentication check for dashboards
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a dashboard page (not login page)
  if (!window.location.pathname.includes('staff_login.html')) {
    if (!checkAuthentication()) {
      return; // Will redirect to login
    }
    
    // Display user info if available
    const user = getCurrentUser();
    if (user) {
      console.log(`Logged in as: ${user.name} (${user.role})`);
    }
  }
});

// Export functions for use in specific dashboard files
window.staffUtils = {
  showSection,
  showModal,
  hideModal,
  validateForm,
  searchTable,
  filterTable,
  displayTableData,
  generateId,
  formatDate,
  formatTime,
  formatCurrency,
  getStatusBadge,
  setupSearchInput,
  setupFilterDropdown,
  resetForm,
  confirmAction,
  showLoading,
  hideLoading,
  generateAutoId,
  getCurrentDate,
  getCurrentTime,
  isToday,
  saveData,
  loadData,
  getSession,
  clearSession,
  checkAuthentication,
  getCurrentUser,
  logout
}; 