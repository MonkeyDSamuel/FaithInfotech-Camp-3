// Doctor Dashboard JavaScript

// Global variables
let patientData = [];
let prescriptionData = [];
let labReportData = [];
const PATIENT_DATA_KEY = 'hospitalPatientData';
const PRESCRIPTION_DATA_KEY = 'hospitalPrescriptionData';
const LAB_REPORT_DATA_KEY = 'hospitalLabReportData';

// Current doctor ID (set from session)
let currentDoctorId = '';

// Get current doctor ID from session
function getCurrentDoctorId() {
    const session = staffUtils.getSession();
    if (session && session.staffId && session.role === 'doctor') {
        console.log(`Doctor session found: ${session.staffId} (${session.name})`);
        return session.staffId;
    }
    console.log('No valid doctor session found');
    return null;
}

// Get current doctor name from session
function getCurrentDoctorName() {
    const session = staffUtils.getSession();
    if (session && session.name) {
        return session.name;
    }
    return 'Unknown Doctor';
}

// Validate doctor session
function validateDoctorSession() {
    const session = staffUtils.getSession();
    if (!session) {
        console.log('No session found');
        return false;
    }
    
    if (session.role !== 'doctor') {
        console.log(`Invalid role: ${session.role}. Expected: doctor`);
        return false;
    }
    
    console.log(`Valid doctor session: ${session.staffId} (${session.name})`);
    return true;
}

// Send prescription to pharmacist dashboard
function sendPrescriptionToPharmacist(prescription) {
    try {
        // Load existing pharmacist data
        const pharmacistDataKey = 'hospitalPharmacistData';
        let pharmacistData = JSON.parse(localStorage.getItem(pharmacistDataKey) || '[]');
        
        // Add prescription to pharmacist's data
        pharmacistData.push({
            ...prescription,
            source: 'doctor_dashboard',
            receivedAt: new Date().toISOString(),
            status: 'pending' // Set initial status for pharmacist
        });
        
        // Save to pharmacist's local storage
        localStorage.setItem(pharmacistDataKey, JSON.stringify(pharmacistData));
        
        console.log(`Prescription ${prescription.id} sent to pharmacist dashboard`);
        console.log('Pharmacist data updated:', pharmacistData.length, 'total prescriptions');
        
        return true;
    } catch (error) {
        console.error('Error sending prescription to pharmacist:', error);
        return false;
    }
}

// Send lab report to lab technician dashboard
function sendLabReportToLabTech(labReport) {
    try {
        // Load existing lab technician data
        const labTechDataKey = 'hospitalLabTechData';
        let labTechData = JSON.parse(localStorage.getItem(labTechDataKey) || '[]');
        // Add lab report to lab technician's data
        labTechData.push({
            ...labReport,
            source: 'doctor_dashboard',
            receivedAt: new Date().toISOString(),
            status: 'pending' // Set initial status for lab technician
        });
        // Save to lab technician's local storage
        localStorage.setItem(labTechDataKey, JSON.stringify(labTechData));
        console.log(`Lab report ${labReport.id} sent to lab technician dashboard`);
        console.log('Lab technician data updated:', labTechData.length, 'total lab reports');
        return true;
    } catch (error) {
        console.error('Error sending lab report to lab technician:', error);
        return false;
    }
}

// Load data from local storage
function loadPatientData() {
  patientData = staffUtils.loadData(PATIENT_DATA_KEY);
  if (!Array.isArray(patientData)) {
    patientData = [];
  }
  console.log(`Loaded ${patientData.length} patients from receptionist's local storage`);
  
  // Debug: Show all appointments for current doctor
  const doctorId = getCurrentDoctorId();
  if (doctorId) {
    const allDoctorAppointments = patientData.filter(patient => patient.doctor === doctorId);
    console.log(`Total appointments for doctor ${doctorId}: ${allDoctorAppointments.length}`);
    console.log('All appointments for current doctor:', allDoctorAppointments);
  }
}

function loadPrescriptionData() {
  prescriptionData = staffUtils.loadData(PRESCRIPTION_DATA_KEY);
  if (!Array.isArray(prescriptionData)) {
    prescriptionData = [];
  }
  console.log(`Loaded ${prescriptionData.length} prescriptions from local storage`);
}

function loadLabReportData() {
  labReportData = staffUtils.loadData(LAB_REPORT_DATA_KEY);
  if (!Array.isArray(labReportData)) {
    labReportData = [];
  }
  console.log(`Loaded ${labReportData.length} lab reports from local storage`);
}

// Save data to local storage
function savePrescriptionData() {
  staffUtils.saveData(prescriptionData, PRESCRIPTION_DATA_KEY);
}

function saveLabReportData() {
  staffUtils.saveData(labReportData, LAB_REPORT_DATA_KEY);
}

// Get today's appointments for the current doctor
function getTodayAppointments() {
  const today = new Date().toISOString().split('T')[0];
  const doctorId = getCurrentDoctorId();
  
  if (!doctorId) {
    console.log('No doctor ID found in session');
    return [];
  }
  
  return patientData.filter(patient => 
    patient.doctor === doctorId && 
    patient.appointmentDate === today
  );
}

// Get future appointments for the current doctor
function getFutureAppointments() {
  const today = new Date().toISOString().split('T')[0];
  const doctorId = getCurrentDoctorId();
  
  if (!doctorId) {
    console.log('No doctor ID found in session');
    return [];
  }
  
  return patientData.filter(patient => 
    patient.doctor === doctorId && 
    patient.appointmentDate > today
  );
}

// Load today's appointments
function loadTodayAppointments() {
  // Validate doctor session first
  if (!validateDoctorSession()) {
    const infoElement = document.getElementById('todayAppointmentsInfo');
    if (infoElement) {
      infoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Invalid session. Please login as a doctor.`;
      infoElement.style.background = '#ffebee';
    }
    return;
  }
  
  loadPatientData();
  
  // Set current doctor ID from session
  currentDoctorId = getCurrentDoctorId();
  console.log(`Current Doctor ID: ${currentDoctorId}`);
  
  const todayAppointments = getTodayAppointments();
  
  console.log(`Found ${todayAppointments.length} appointments for today for doctor ${currentDoctorId}`);
  displayTodayAppointments(todayAppointments);
  
  // Update info display
  const infoElement = document.getElementById('todayAppointmentsInfo');
  if (infoElement) {
    if (currentDoctorId) {
      infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${todayAppointments.length} appointments for today (Doctor: ${currentDoctorId}) from receptionist's local storage`;
    } else {
      infoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> No doctor session found. Please login as a doctor.`;
    }
    infoElement.style.background = todayAppointments.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Load future appointments
function loadFutureAppointments() {
  // Validate doctor session first
  if (!validateDoctorSession()) {
    const infoElement = document.getElementById('futureAppointmentsInfo');
    if (infoElement) {
      infoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Invalid session. Please login as a doctor.`;
      infoElement.style.background = '#ffebee';
    }
    return;
  }
  
  loadPatientData();
  
  // Set current doctor ID from session
  currentDoctorId = getCurrentDoctorId();
  console.log(`Current Doctor ID: ${currentDoctorId}`);
  
  const futureAppointments = getFutureAppointments();
  
  console.log(`Found ${futureAppointments.length} future appointments for doctor ${currentDoctorId}`);
  displayFutureAppointments(futureAppointments);
  
  // Update info display
  const infoElement = document.getElementById('futureAppointmentsInfo');
  if (infoElement) {
    if (currentDoctorId) {
      infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${futureAppointments.length} future appointments (Doctor: ${currentDoctorId}) from receptionist's local storage`;
    } else {
      infoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> No doctor session found. Please login as a doctor.`;
    }
    infoElement.style.background = futureAppointments.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Display today's appointments
function displayTodayAppointments(appointments) {
  staffUtils.displayTableData(appointments, 'todayAppointmentsTableBody', createTodayAppointmentRow);
}

// Display future appointments
function displayFutureAppointments(appointments) {
  staffUtils.displayTableData(appointments, 'futureAppointmentsTableBody', createFutureAppointmentRow);
}

// Create today's appointment row
function createTodayAppointmentRow(appointment) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(appointment.status);
  const appointmentTime = appointment.appointmentTime;
  
  row.innerHTML = `
    <td>${appointment.id}</td>
    <td>${appointment.name}</td>
    <td>${appointment.age}</td>
    <td>${appointment.phone}</td>
    <td>${appointmentTime}</td>
    <td>${appointment.symptoms || 'N/A'}</td>
    <td>${statusBadge}</td>
    <td>
      <button onclick="viewPatientDetails('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-eye"></i> View
      </button>
      <button onclick="addPrescription('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-prescription-bottle-medical"></i> Prescribe
      </button>
      <button onclick="addLabReport('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-flask"></i> Lab Test
      </button>
    </td>
  `;
  
  return row;
}

// Create future appointment row
function createFutureAppointmentRow(appointment) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(appointment.status);
  const appointmentDate = staffUtils.formatDate(appointment.appointmentDate);
  
  row.innerHTML = `
    <td>${appointment.id}</td>
    <td>${appointment.name}</td>
    <td>${appointment.age}</td>
    <td>${appointment.phone}</td>
    <td>${appointmentDate}</td>
    <td>${appointment.appointmentTime}</td>
    <td>${appointment.symptoms || 'N/A'}</td>
    <td>${statusBadge}</td>
    <td>
      <button onclick="viewPatientDetails('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-eye"></i> View
      </button>
      <button onclick="addPrescription('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-prescription-bottle-medical"></i> Prescribe
      </button>
      <button onclick="addLabReport('${appointment.id}')" class="action-btn edit">
        <i class="fas fa-flask"></i> Lab Test
      </button>
    </td>
  `;
  
  return row;
}

// Load prescription data
function loadPrescriptionTable() {
  loadPrescriptionData();
  
  // Sort prescriptions by patient ID
  const sortedPrescriptions = prescriptionData.sort((a, b) => a.patientId.localeCompare(b.patientId));
  
  console.log(`Displaying ${sortedPrescriptions.length} prescriptions`);
  displayPrescriptionTable(sortedPrescriptions);
  
  // Update info display
  const infoElement = document.getElementById('prescriptionInfo');
  if (infoElement) {
    infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${sortedPrescriptions.length} prescriptions from local storage (sorted by Patient ID)`;
    infoElement.style.background = sortedPrescriptions.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Display prescription table
function displayPrescriptionTable(prescriptions) {
  staffUtils.displayTableData(prescriptions, 'prescriptionTableBody', createPrescriptionRow);
}

// Create prescription row
function createPrescriptionRow(prescription) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(prescription.status);
  const prescriptionDate = staffUtils.formatDate(prescription.date);
  
  // Truncate notes and medicines for display
  const notesPreview = prescription.notes.length > 50 ? prescription.notes.substring(0, 50) + '...' : prescription.notes;
  const medicinesPreview = prescription.medicines.length > 50 ? prescription.medicines.substring(0, 50) + '...' : prescription.medicines;
  
  row.innerHTML = `
    <td>${prescription.patientId}</td>
    <td>${prescription.patientName}</td>
    <td>${prescriptionDate}</td>
    <td title="${prescription.notes}">${notesPreview}</td>
    <td title="${prescription.medicines}">${medicinesPreview}</td>
    <td>
      <button onclick="editPrescription('${prescription.id}')" class="action-btn edit">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button onclick="deletePrescription('${prescription.id}')" class="action-btn delete">
        <i class="fas fa-trash"></i> Delete
      </button>
    </td>
  `;
  
  return row;
}

// Load lab report data
function loadLabReportTable() {
  loadLabReportData();
  
  console.log(`Displaying ${labReportData.length} lab reports`);
  displayLabReportTable(labReportData);
  
  // Update info display
  const infoElement = document.getElementById('labReportInfo');
  if (infoElement) {
    infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${labReportData.length} lab reports from local storage`;
    infoElement.style.background = labReportData.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Display lab report table
function displayLabReportTable(labReports) {
  staffUtils.displayTableData(labReports, 'labReportTableBody', createLabReportRow);
}

// Create lab report row
function createLabReportRow(labReport) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(labReport.status);
  const labReportDate = staffUtils.formatDate(labReport.date);
  
  // Truncate notes for display
  const notesPreview = labReport.notes.length > 50 ? labReport.notes.substring(0, 50) + '...' : labReport.notes;
  
  row.innerHTML = `
    <td>${labReport.patientId}</td>
    <td>${labReport.patientName}</td>
    <td>${labReportDate}</td>
    <td>${labReport.testType}</td>
    <td title="${labReport.notes}">${notesPreview}</td>
    <td>${statusBadge}</td>
    <td>
      <button onclick="editLabReport('${labReport.id}')" class="action-btn edit">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button onclick="deleteLabReport('${labReport.id}')" class="action-btn delete">
        <i class="fas fa-trash"></i> Delete
      </button>
    </td>
  `;
  
  return row;
}

// Prescription functions
function showAddPrescriptionForm() {
  document.getElementById('prescriptionModalTitle').textContent = 'Add New Prescription';
  document.getElementById('prescriptionForm').reset();
  document.getElementById('prescriptionPatientId').value = '';
  document.getElementById('prescriptionPatientName').value = '';
  document.getElementById('prescriptionDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('prescriptionModal').style.display = 'block';
}

function addPrescription(patientId) {
  const patient = patientData.find(p => p.id === patientId);
  if (!patient) {
    staffUtils.showModal('Patient not found.', 'error');
    return;
  }
  
  document.getElementById('prescriptionModalTitle').textContent = 'Add New Prescription';
  document.getElementById('prescriptionForm').reset();
  document.getElementById('prescriptionPatientId').value = patient.id;
  document.getElementById('prescriptionPatientName').value = patient.name;
  document.getElementById('prescriptionDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('prescriptionModal').style.display = 'block';
}

function editPrescription(prescriptionId) {
  const prescription = prescriptionData.find(p => p.id === prescriptionId);
  if (!prescription) {
    staffUtils.showModal('Prescription not found.', 'error');
    return;
  }
  
  document.getElementById('prescriptionModalTitle').textContent = 'Edit Prescription';
  document.getElementById('prescriptionPatientId').value = prescription.patientId;
  document.getElementById('prescriptionPatientName').value = prescription.patientName;
  document.getElementById('prescriptionDate').value = prescription.date;
  document.getElementById('prescriptionStatus').value = prescription.status;
  document.getElementById('prescriptionNotes').value = prescription.notes;
  document.getElementById('prescriptionMedicines').value = prescription.medicines;
  
  // Store the prescription ID for update
  document.getElementById('prescriptionForm').dataset.prescriptionId = prescriptionId;
  document.getElementById('prescriptionModal').style.display = 'block';
}

function closePrescriptionModal() {
  document.getElementById('prescriptionModal').style.display = 'none';
  document.getElementById('prescriptionForm').dataset.prescriptionId = '';
}

// Lab report functions
function showAddLabReportForm() {
  document.getElementById('labReportModalTitle').textContent = 'Add New Lab Report';
  document.getElementById('labReportForm').reset();
  document.getElementById('labReportPatientId').value = '';
  document.getElementById('labReportPatientName').value = '';
  document.getElementById('labReportDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('labReportModal').style.display = 'block';
}

function addLabReport(patientId) {
  const patient = patientData.find(p => p.id === patientId);
  if (!patient) {
    staffUtils.showModal('Patient not found.', 'error');
    return;
  }
  
  document.getElementById('labReportModalTitle').textContent = 'Add New Lab Report';
  document.getElementById('labReportForm').reset();
  document.getElementById('labReportPatientId').value = patient.id;
  document.getElementById('labReportPatientName').value = patient.name;
  document.getElementById('labReportDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('labReportModal').style.display = 'block';
}

function editLabReport(labReportId) {
  const labReport = labReportData.find(l => l.id === labReportId);
  if (!labReport) {
    staffUtils.showModal('Lab report not found.', 'error');
    return;
  }
  
  document.getElementById('labReportModalTitle').textContent = 'Edit Lab Report';
  document.getElementById('labReportPatientId').value = labReport.patientId;
  document.getElementById('labReportPatientName').value = labReport.patientName;
  document.getElementById('labReportDate').value = labReport.date;
  document.getElementById('labReportStatus').value = labReport.status;
  document.getElementById('labReportTestType').value = labReport.testType;
  document.getElementById('labReportPriority').value = labReport.priority || 'normal';
  document.getElementById('labReportNotes').value = labReport.notes;
  
  // Store the lab report ID for update
  document.getElementById('labReportForm').dataset.labReportId = labReportId;
  document.getElementById('labReportModal').style.display = 'block';
}

function closeLabReportModal() {
  document.getElementById('labReportModal').style.display = 'none';
  document.getElementById('labReportForm').dataset.labReportId = '';
}

// Delete functions
function deletePrescription(prescriptionId) {
  staffUtils.confirmAction('Are you sure you want to delete this prescription?', function() {
    const prescriptionIndex = prescriptionData.findIndex(p => p.id === prescriptionId);
    
    if (prescriptionIndex === -1) {
      staffUtils.showModal('Prescription not found.', 'error');
      return;
    }
    
    prescriptionData.splice(prescriptionIndex, 1);
    savePrescriptionData();
    loadPrescriptionTable();
    staffUtils.showModal('Prescription deleted successfully!', 'success');
  });
}

function deleteLabReport(labReportId) {
  staffUtils.confirmAction('Are you sure you want to delete this lab report?', function() {
    const labReportIndex = labReportData.findIndex(l => l.id === labReportId);
    
    if (labReportIndex === -1) {
      staffUtils.showModal('Lab report not found.', 'error');
      return;
    }
    
    labReportData.splice(labReportIndex, 1);
    saveLabReportData();
    loadLabReportTable();
    staffUtils.showModal('Lab report deleted successfully!', 'success');
  });
}

// View patient details
function viewPatientDetails(patientId) {
  const patient = patientData.find(p => p.id === patientId);
  if (!patient) {
    staffUtils.showModal('Patient not found.', 'error');
    return;
  }
  
  const details = `
    <strong>Patient Details:</strong><br><br>
    <strong>ID:</strong> ${patient.id}<br>
    <strong>Name:</strong> ${patient.name}<br>
    <strong>Age:</strong> ${patient.age}<br>
    <strong>Gender:</strong> ${patient.gender}<br>
    <strong>Phone:</strong> ${patient.phone}<br>
    <strong>Email:</strong> ${patient.email || 'N/A'}<br>
    <strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}<br>
    <strong>Address:</strong> ${patient.address}<br>
    <strong>Appointment Date:</strong> ${staffUtils.formatDate(patient.appointmentDate)}<br>
    <strong>Appointment Time:</strong> ${patient.appointmentTime}<br>
    <strong>Department:</strong> ${getDepartmentName(patient.department)}<br>
    <strong>Symptoms:</strong> ${patient.symptoms || 'N/A'}<br>
    <strong>Status:</strong> ${patient.status}
  `;
  
  staffUtils.showModal(details, 'success');
}

// Get department name
function getDepartmentName(department) {
  const departmentNames = {
    'cardiology': 'Cardiology',
    'neurology': 'Neurology',
    'orthopedics': 'Orthopedics',
    'pediatrics': 'Pediatrics',
    'dermatology': 'Dermatology',
    'ophthalmology': 'Ophthalmology',
    'general': 'General Medicine',
    'surgery': 'Surgery'
  };
  
  return departmentNames[department] || department;
}

// Logout function
function logout() {
  staffUtils.confirmAction('Are you sure you want to logout?', function() {
    staffUtils.clearSession();
    window.location.href = 'staff_login.html';
  });
}

// Search and filter functions
function searchTodayAppointments() {
  const searchTerm = document.getElementById('todayAppointmentSearch').value.trim();
  const filterValue = document.getElementById('todayStatusFilter').value;
  
  let filteredAppointments = getTodayAppointments();
  
  // Apply search filter
  if (searchTerm) {
    filteredAppointments = staffUtils.searchTable(searchTerm, filteredAppointments, ['id', 'name']);
  }
  
  // Apply status filter
  if (filterValue) {
    filteredAppointments = staffUtils.filterTable(filterValue, filteredAppointments, 'status');
  }
  
  displayTodayAppointments(filteredAppointments);
}

function searchFutureAppointments() {
  const searchTerm = document.getElementById('futureAppointmentSearch').value.trim();
  const filterValue = document.getElementById('futureStatusFilter').value;
  
  let filteredAppointments = getFutureAppointments();
  
  // Apply search filter
  if (searchTerm) {
    filteredAppointments = staffUtils.searchTable(searchTerm, filteredAppointments, ['id', 'name']);
  }
  
  // Apply status filter
  if (filterValue) {
    filteredAppointments = staffUtils.filterTable(filterValue, filteredAppointments, 'status');
  }
  
  displayFutureAppointments(filteredAppointments);
}

function searchPrescriptions() {
  const searchTerm = document.getElementById('prescriptionSearch').value.trim();
  const filterValue = document.getElementById('prescriptionDateFilter').value;
  
  let filteredPrescriptions = [...prescriptionData];
  
  // Apply search filter
  if (searchTerm) {
    filteredPrescriptions = staffUtils.searchTable(searchTerm, filteredPrescriptions, ['patientId', 'patientName']);
  }
  
  // Apply date filter
  if (filterValue) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    filteredPrescriptions = filteredPrescriptions.filter(prescription => {
      const prescriptionDate = new Date(prescription.date);
      
      switch (filterValue) {
        case 'today':
          return prescriptionDate.toDateString() === today.toDateString();
        case 'week':
          return prescriptionDate >= startOfWeek;
        case 'month':
          return prescriptionDate >= startOfMonth;
        default:
          return true;
      }
    });
  }
  
  // Sort by patient ID
  filteredPrescriptions.sort((a, b) => a.patientId.localeCompare(b.patientId));
  displayPrescriptionTable(filteredPrescriptions);
}

function searchLabReports() {
  const searchTerm = document.getElementById('labReportSearch').value.trim();
  const filterValue = document.getElementById('labReportStatusFilter').value;
  
  let filteredLabReports = [...labReportData];
  
  // Apply search filter
  if (searchTerm) {
    filteredLabReports = staffUtils.searchTable(searchTerm, filteredLabReports, ['patientId', 'patientName']);
  }
  
  // Apply status filter
  if (filterValue) {
    filteredLabReports = staffUtils.filterTable(filterValue, filteredLabReports, 'status');
  }
  
  displayLabReportTable(filteredLabReports);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Validate session first
  if (!validateDoctorSession()) {
    window.location.href = 'staff_login.html';
    return;
  }
  
  // Load all data from local storage
  loadPatientData();
  loadPrescriptionData();
  loadLabReportData();
  
  // Show default section
  staffUtils.showSection('today');
  
  // Load initial table data
  loadTodayAppointments();
  loadFutureAppointments();
  loadPrescriptionTable();
  loadLabReportTable();
  
  // Setup search functionality
  staffUtils.setupSearchInput('todayAppointmentSearch', searchTodayAppointments);
  staffUtils.setupFilterDropdown('todayStatusFilter', searchTodayAppointments);
  
  staffUtils.setupSearchInput('futureAppointmentSearch', searchFutureAppointments);
  staffUtils.setupFilterDropdown('futureStatusFilter', searchFutureAppointments);
  
  staffUtils.setupSearchInput('prescriptionSearch', searchPrescriptions);
  staffUtils.setupFilterDropdown('prescriptionDateFilter', searchPrescriptions);
  
  staffUtils.setupSearchInput('labReportSearch', searchLabReports);
  staffUtils.setupFilterDropdown('labReportStatusFilter', searchLabReports);
  
  console.log('Doctor Dashboard initialized successfully!');
});

// Prescription form submission
document.getElementById('prescriptionForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const prescriptionId = this.dataset.prescriptionId;
  
  const newPrescription = {
    id: prescriptionId || staffUtils.generateId('PRES'),
    patientId: formData.get('patientId'),
    patientName: formData.get('patientName'),
    date: formData.get('date'),
    status: formData.get('status'),
    notes: formData.get('notes'),
    medicines: formData.get('medicines'),
    doctorId: currentDoctorId,
    doctorName: getCurrentDoctorName(),
    createdAt: prescriptionId ? undefined : new Date().toISOString(),
    updatedAt: prescriptionId ? new Date().toISOString() : undefined
  };
  
  if (prescriptionId) {
    // Update existing prescription
    const index = prescriptionData.findIndex(p => p.id === prescriptionId);
    if (index !== -1) {
      prescriptionData[index] = { ...prescriptionData[index], ...newPrescription };
    }
  } else {
    // Add new prescription
    prescriptionData.push(newPrescription);
  }
  
  savePrescriptionData();
  
  // Send to pharmacist dashboard
  sendPrescriptionToPharmacist(prescriptionData);
  
  loadPrescriptionTable();
  closePrescriptionModal();
  staffUtils.showModal('Prescription saved locally and sent to pharmacist!', 'success');
});

// Lab report form submission
document.getElementById('labReportForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const labReportId = this.dataset.labReportId;
  
  const newLabReport = {
    id: labReportId || staffUtils.generateId('LAB'),
    patientId: formData.get('patientId'),
    patientName: formData.get('patientName'),
    date: formData.get('date'),
    status: formData.get('status'),
    testType: formData.get('testType'),
    priority: formData.get('priority'),
    notes: formData.get('notes'),
    doctorId: currentDoctorId,
    doctorName: getCurrentDoctorName(),
    createdAt: labReportId ? undefined : new Date().toISOString(),
    updatedAt: labReportId ? new Date().toISOString() : undefined
  };
  
  if (labReportId) {
    // Update existing lab report
    const index = labReportData.findIndex(l => l.id === labReportId);
    if (index !== -1) {
      labReportData[index] = { ...labReportData[index], ...newLabReport };
    }
  } else {
    // Add new lab report
    labReportData.push(newLabReport);
  }
  
  saveLabReportData();
  
  // Send to lab technician dashboard
  sendLabReportToLabTech(labReportData);
  
  loadLabReportTable();
  closeLabReportModal();
  staffUtils.showModal('Lab report saved locally and sent to lab technician!', 'success');
}); 