// Receptionist Dashboard JavaScript

// Global variables
let patientData = [];
const PATIENT_DATA_KEY = 'hospitalPatientData';

// Doctor data - will be loaded from admin dashboard local storage
let doctorData = {};

// Session validation functions
function validateReceptionistSession() {
    const session = staffUtils.getSession();
    if (!session) {
        console.log('No session found');
        return false;
    }
    
    if (session.role !== 'reception' && session.role !== 'receptionist') {
        console.log(`Invalid role: ${session.role}. Expected: reception or receptionist`);
        return false;
    }
    
    console.log(`Valid receptionist session: ${session.staffId} (${session.name})`);
    return true;
}

// Load doctor data from admin dashboard local storage
function loadDoctorData() {
  const staffData = staffUtils.loadData('hospitalStaffData');
  if (staffData && staffData.length > 0) {
    // Filter only doctors from staff data
    const doctors = staffData.filter(staff => staff.department === 'doctor');
    
    // Map of department keys to display names
    const departmentKeys = [
      'cardiologist',
      'neurologist',
      'orthopedic_surgeon',
      'pediatrician',
      'general_physician',
      'dermatologist',
      'psychiatrist',
      'oncologist',
      'radiologist',
      'anesthesiologist'
    ];
    
    doctorData = {};
    departmentKeys.forEach(key => {
      doctorData[key] = doctors.filter(doc => {
        if (!doc.position) return false;
        // Normalize both position and key for comparison
        const pos = doc.position.toLowerCase().replace(/\s|_/g, '');
        const dept = key.toLowerCase().replace(/\s|_/g, '');
        return pos === dept;
      });
    });
  }
  
  // If no doctors found, use fallback data
  if (Object.keys(doctorData).every(dept => doctorData[dept].length === 0)) {
    doctorData = {
      'general_physician': [
        { id: 'DR001', name: 'Dr. Sample Doctor', position: 'General Physician' }
      ]
    };
  }
}

// Local Storage Functions
function savePatientData() {
  staffUtils.saveData(patientData, PATIENT_DATA_KEY);
}

function loadPatientData() {
  patientData = staffUtils.loadData(PATIENT_DATA_KEY);
  
  // Ensure patientData is always an array
  if (!Array.isArray(patientData)) {
    patientData = [];
  }
  
  console.log(`Loaded ${patientData.length} patients from local storage`);
  
  // Log some sample data for debugging
  if (patientData.length > 0) {
    console.log('Sample patient data:', patientData[0]);
  }
}

// Auto-generate patient ID starting from PAT0001
function generatePatientId() {
  // Find the highest existing patient ID
  let maxId = 0;
  
  if (patientData && patientData.length > 0) {
    patientData.forEach(patient => {
      if (patient.id && patient.id.startsWith('PAT')) {
        const idNumber = parseInt(patient.id.substring(3));
        if (!isNaN(idNumber) && idNumber > maxId) {
          maxId = idNumber;
        }
      }
    });
  }
  
  // Generate next sequential ID
  const nextId = maxId + 1;
  return `PAT${String(nextId).padStart(4, '0')}`;
}

// Populate doctors based on department
function populateDoctors(department, doctorSelectId) {
  const doctorSelect = document.getElementById(doctorSelectId);
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  
  if (!department || !doctorData[department] || doctorData[department].length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No doctors available in this department';
    option.disabled = true;
    doctorSelect.appendChild(option);
    return;
  }
  
  doctorData[department].forEach(doctor => {
    const option = document.createElement('option');
    option.value = doctor.id;
    const schedule = getDoctorSchedule(doctor.id);
    option.textContent = `${doctor.name} - ${doctor.position || 'General Physician'} (${schedule})`;
    doctorSelect.appendChild(option);
  });
}

// Generate time slots based on doctor's working hours
function generateTimeSlotsForDoctor(doctorId) {
  const doctor = getDoctorDetails(doctorId);
  if (!doctor || !doctor.workingHours) {
    // Fallback to default hours if no working hours specified
    return generateDefaultTimeSlots();
  }
  
  const slots = [];
  const startTime = doctor.workingHours.start;
  const endTime = doctor.workingHours.end;
  
  if (!startTime || !endTime) {
    return generateDefaultTimeSlots();
  }
  
  // Parse start and end times
  const startHour = parseInt(startTime.split(':')[0]);
  const startMinute = parseInt(startTime.split(':')[1]);
  const endHour = parseInt(endTime.split(':')[0]);
  const endMinute = parseInt(endTime.split(':')[1]);
  
  // Convert to minutes for easier calculation
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Generate 30-minute slots within working hours
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
}

// Generate default time slots (9 AM to 5 PM)
function generateDefaultTimeSlots() {
  const slots = [];
  const startTime = 9; // 9 AM
  const endTime = 17; // 5 PM
  
  for (let hour = startTime; hour < endTime; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
}

// Check if a time slot is valid for the current time (not in the past)
function isTimeSlotValid(timeSlot, appointmentDate) {
  const today = new Date().toISOString().split('T')[0];
  
  // If appointment is not today, all slots are valid
  if (appointmentDate !== today) {
    return true;
  }
  
  // For today's appointments, check if time slot is in the future
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  
  // Parse the time slot
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotTime = hours * 60 + minutes; // Slot time in minutes
  
  // Add 30 minutes buffer to current time to allow for reasonable booking time
  const bufferTime = currentTime + 30;
  
  return slotTime >= bufferTime;
}

// Get available time slots for a doctor on a specific date
function getAvailableTimeSlots(doctorId, appointmentDate, excludePatientId = null) {
  loadPatientData(); // Ensure latest patient data is loaded
  const allSlots = generateTimeSlotsForDoctor(doctorId);
  const bookedSlots = patientData
    .filter(patient => 
      patient.doctor === doctorId && 
      patient.appointmentDate === appointmentDate &&
      patient.id !== excludePatientId
    )
    .map(patient => patient.appointmentTime);
  
  // Filter out booked slots and past time slots
  return allSlots.filter(slot => 
    !bookedSlots.includes(slot) && 
    isTimeSlotValid(slot, appointmentDate)
  );
}

// Check if date is a working day for the doctor
function isWorkingDay(doctorId, appointmentDate) {
  const doctor = getDoctorDetails(doctorId);
  if (!doctor || !doctor.workingDays) {
    return true; // Assume working if no working days specified
  }
  
  const appointmentDay = new Date(appointmentDate).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[appointmentDay];
  
  return doctor.workingDays.includes(dayName);
}

// Get working days for a doctor
function getWorkingDays(doctorId) {
  const doctor = getDoctorDetails(doctorId);
  if (!doctor || !doctor.workingDays) {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']; // Default to all days
  }
  return doctor.workingDays;
}

// Get next available date for a doctor
function getNextAvailableDate(doctorId, startDate = null) {
  const workingDays = getWorkingDays(doctorId);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  let currentDate = startDate ? new Date(startDate) : new Date();
  
  // Start from today if no start date provided
  if (!startDate) {
    currentDate.setHours(0, 0, 0, 0);
  }
  
  // Look for the next available working day
  for (let i = 0; i < 180; i++) { // Check next 180 days (6 months)
    const dayName = dayNames[currentDate.getDay()];
    if (workingDays.includes(dayName)) {
      return currentDate.toISOString().split('T')[0];
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // If no working day found in 180 days, return today
  return new Date().toISOString().split('T')[0];
}

// Set date input restrictions based on doctor's working days
function setDateRestrictions(doctorId, dateInputId) {
  const dateInput = document.getElementById(dateInputId);
  if (!dateInput) return;
  
  const workingDays = getWorkingDays(doctorId);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  
  // Set max date to 6 months from today
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  dateInput.max = maxDate.toISOString().split('T')[0];
  
  // Add event listener to validate selected date
  dateInput.addEventListener('change', function() {
    const selectedDate = this.value;
    if (selectedDate && !isWorkingDay(doctorId, selectedDate)) {
      const nextAvailable = getNextAvailableDate(doctorId, selectedDate);
      staffUtils.showModal(`Selected date is not a working day for this doctor. Next available date: ${nextAvailable}`, 'error');
      this.value = nextAvailable;
    }
  });
  
  // Set initial value to next available date
  const nextAvailable = getNextAvailableDate(doctorId);
  dateInput.value = nextAvailable;
}

// Populate time slots for a doctor
function populateTimeSlots(doctorId, appointmentDate, timeSelectId, excludePatientId = null) {
  const timeSelect = document.getElementById(timeSelectId);
  timeSelect.innerHTML = '<option value="">Select Time Slot</option>';
  
  if (!doctorId || !appointmentDate) {
    return;
  }
  
  // Check if it's a working day for the doctor
  if (!isWorkingDay(doctorId, appointmentDate)) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Doctor not available on this day';
    option.disabled = true;
    timeSelect.appendChild(option);
    return;
  }
  
  const availableSlots = getAvailableTimeSlots(doctorId, appointmentDate, excludePatientId);
  
  if (availableSlots.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    
    // Check if it's today and all slots are in the past
    const today = new Date().toISOString().split('T')[0];
    if (appointmentDate === today) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      option.textContent = `No available time slots for today (current time: ${currentTime})`;
    } else {
      option.textContent = 'No available slots for this doctor on selected date';
    }
    option.disabled = true;
    timeSelect.appendChild(option);
    return;
  }
  
  availableSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = slot;
    timeSelect.appendChild(option);
  });
}

// Form validation rules for patient registration
const patientValidationRules = {
  fullName: { required: true, type: 'name', label: 'Full Name' },
  age: { required: true, type: 'age', label: 'Age' },
  gender: { required: true, label: 'Gender' },
  phone: { required: true, type: 'phone', label: 'Phone Number' },
  email: { type: 'email', label: 'Email' },
  address: { required: true, label: 'Address' },
  appointmentDate: { required: true, type: 'appointmentDate', label: 'Appointment Date' },
  appointmentTime: { required: true, label: 'Appointment Time' },
  department: { required: true, label: 'Department' },
  doctor: { required: true, label: 'Preferred Doctor' },
  symptoms: { required: true, label: 'Symptoms/Reason for Visit' }
};

// New Patient Registration
document.getElementById('newPatientForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const errors = staffUtils.validateForm(formData, patientValidationRules);
  
  if (errors.length > 0) {
    staffUtils.showModal(errors.join('\n'), 'error');
    return;
  }
  
  // Check if patient ID already exists
  if (patientData.find(patient => patient.id === formData.get('patientId'))) {
    staffUtils.showModal('Patient ID already exists. Please try again.', 'error');
    return;
  }
  
  // Add new patient
  const newPatient = {
    id: formData.get('patientId'),
    name: formData.get('fullName'),
    age: parseInt(formData.get('age')),
    gender: formData.get('gender'),
    phone: formData.get('phone'),
    email: formData.get('email') || '',
    bloodGroup: formData.get('bloodGroup') || '',
    emergencyContact: formData.get('emergencyContact') || '',
    address: formData.get('address'),
    appointmentDate: formData.get('appointmentDate'),
    appointmentTime: formData.get('appointmentTime'),
    department: formData.get('department'),
    doctor: formData.get('doctor') || '',
    symptoms: formData.get('symptoms'),
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  
  patientData.push(newPatient);
  savePatientData();
  staffUtils.showModal('Patient registered successfully!', 'success');
  this.reset();
  
  // Generate new patient ID for next registration
  const patientIdField = document.getElementById('patientId');
  if (patientIdField) {
    patientIdField.value = generatePatientId();
  }
});

// Search patient for update
function searchPatient() {
  const patientId = document.getElementById('searchPatientId').value.trim();
  
  if (!patientId) {
    staffUtils.showModal('Please enter a Patient ID to search.', 'error');
    return;
  }
  
  const patient = patientData.find(p => p.id === patientId);
  
  if (!patient) {
    staffUtils.showModal('Patient not found. Please check the Patient ID.', 'error');
    return;
  }
  
  // Populate update form
  document.getElementById('updatePatientId').value = patient.id;
  document.getElementById('updateFullName').value = patient.name;
  document.getElementById('updateAge').value = patient.age;
  document.getElementById('updateGender').value = patient.gender;
  document.getElementById('updatePhone').value = patient.phone;
  document.getElementById('updateEmail').value = patient.email || '';
  document.getElementById('updateBloodGroup').value = patient.bloodGroup || '';
  document.getElementById('updateEmergencyContact').value = patient.emergencyContact || '';
  document.getElementById('updateAddress').value = patient.address;
  document.getElementById('updateAppointmentDate').value = patient.appointmentDate;
  document.getElementById('updateDepartment').value = patient.department;
  
  // Populate doctor dropdown based on department
  populateDoctors(patient.department, 'updateDoctor');
  document.getElementById('updateDoctor').value = patient.doctor || '';
  
  // If doctor not found in current department, try to find in any department
  if (!patient.doctor || !getDoctorDetails(patient.doctor)) {
    const doctorDetails = getDoctorDetails(patient.doctor);
    if (doctorDetails) {
      // Find which department this doctor belongs to
      for (const dept in doctorData) {
        if (doctorData[dept].find(d => d.id === patient.doctor)) {
          populateDoctors(dept, 'updateDoctor');
          document.getElementById('updateDepartment').value = dept;
          document.getElementById('updateDoctor').value = patient.doctor;
          break;
        }
      }
    }
  }
  
  // Set date restrictions and validate existing appointment date
  if (patient.doctor) {
    setDateRestrictions(patient.doctor, 'updateAppointmentDate');
    
    // Check if existing appointment date is a working day
    if (patient.appointmentDate && !isWorkingDay(patient.doctor, patient.appointmentDate)) {
      const nextAvailable = getNextAvailableDate(patient.doctor, patient.appointmentDate);
      staffUtils.showModal(`Original appointment date (${patient.appointmentDate}) is not a working day for this doctor. Suggested date: ${nextAvailable}`, 'error');
      document.getElementById('updateAppointmentDate').value = nextAvailable;
      populateTimeSlots(patient.doctor, nextAvailable, 'updateAppointmentTime', patient.id);
    } else {
      document.getElementById('updateAppointmentDate').value = patient.appointmentDate;
      populateTimeSlots(patient.doctor, patient.appointmentDate, 'updateAppointmentTime', patient.id);
    }
  }
  
  document.getElementById('updateAppointmentTime').value = patient.appointmentTime;
  
  document.getElementById('updateSymptoms').value = patient.symptoms;
  
  // Show update form
  document.getElementById('updatePatientForm').style.display = 'block';
}

// Cancel update
function cancelUpdate() {
  document.getElementById('updatePatientForm').style.display = 'none';
  document.getElementById('searchPatientId').value = '';
}

// Update patient form submission
document.getElementById('updatePatientForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const errors = staffUtils.validateForm(formData, patientValidationRules);
  
  if (errors.length > 0) {
    staffUtils.showModal(errors.join('\n'), 'error');
    return;
  }
  
  const patientId = formData.get('updatePatientId');
  const patientIndex = patientData.findIndex(p => p.id === patientId);
  
  if (patientIndex === -1) {
    staffUtils.showModal('Patient not found.', 'error');
    return;
  }
  
  // Update patient data
  patientData[patientIndex] = {
    ...patientData[patientIndex],
    name: formData.get('updateFullName'),
    age: parseInt(formData.get('updateAge')),
    gender: formData.get('updateGender'),
    phone: formData.get('updatePhone'),
    email: formData.get('updateEmail') || '',
    bloodGroup: formData.get('updateBloodGroup') || '',
    emergencyContact: formData.get('updateEmergencyContact') || '',
    address: formData.get('updateAddress'),
    appointmentDate: formData.get('updateAppointmentDate'),
    appointmentTime: formData.get('updateAppointmentTime'),
    department: formData.get('updateDepartment'),
    doctor: formData.get('updateDoctor') || '',
    symptoms: formData.get('updateSymptoms'),
    updatedAt: new Date().toISOString()
  };
  
  savePatientData();
  staffUtils.showModal('Patient details updated successfully!', 'success');
  cancelUpdate();
});

// Load patient table
function loadPatientTable() {
  // Ensure we have the latest data from local storage
  loadPatientData();
  
  const todayPatients = patientData.filter(patient => 
    staffUtils.isToday(patient.appointmentDate)
  );
  
  console.log(`Found ${todayPatients.length} patients for today`);
  displayPatientTable(todayPatients);
  
  // Update info display
  const infoElement = document.getElementById('todayPatientsInfo');
  if (infoElement) {
    infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${todayPatients.length} patients for today from local storage (Total: ${patientData.length} patients)`;
    infoElement.style.background = todayPatients.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Load all patients table
function loadAllPatientTable() {
  // Ensure we have the latest data from local storage
  loadPatientData();
  
  console.log(`Displaying all ${patientData.length} patients`);
  displayAllPatientTable(patientData);
  
  // Update info display
  const infoElement = document.getElementById('allPatientsInfo');
  if (infoElement) {
    infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${patientData.length} patients from local storage`;
    infoElement.style.background = patientData.length > 0 ? '#e8f5e8' : '#fff3cd';
  }
}

// Display patient table
function displayPatientTable(patients) {
  staffUtils.displayTableData(patients, 'patientTableBody', createPatientRow);
}

// Display all patients table
function displayAllPatientTable(patients) {
  staffUtils.displayTableData(patients, 'allPatientTableBody', createAllPatientRow);
}

// Create patient table row
function createPatientRow(patient) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(patient.status);
  const appointmentDateTime = `${staffUtils.formatDate(patient.appointmentDate)} ${patient.appointmentTime}`;
  const doctorName = getDoctorName(patient.doctor);
  
  row.innerHTML = `
    <td>${patient.id}</td>
    <td>${patient.name}</td>
    <td>${patient.age}</td>
    <td>${patient.phone}</td>
    <td>${getDepartmentName(patient.department)}</td>
    <td>${doctorName}</td>
    <td>${appointmentDateTime}</td>
    <td>${statusBadge}</td>
    <td>
      <button onclick="editPatient('${patient.id}')" class="action-btn edit">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button onclick="deletePatient('${patient.id}')" class="action-btn delete">
        <i class="fas fa-trash"></i> Delete
      </button>
    </td>
  `;
  
  return row;
}

// Create all patients table row
function createAllPatientRow(patient) {
  const row = document.createElement('tr');
  
  const statusBadge = staffUtils.getStatusBadge(patient.status);
  const appointmentDate = staffUtils.formatDate(patient.appointmentDate);
  const doctorName = getDoctorName(patient.doctor);
  
  row.innerHTML = `
    <td>${patient.id}</td>
    <td>${patient.name}</td>
    <td>${patient.age}</td>
    <td>${patient.phone}</td>
    <td>${getDepartmentName(patient.department)}</td>
    <td>${appointmentDate}</td>
    <td>${patient.appointmentTime}</td>
    <td>${statusBadge}</td>
    <td>
      <button onclick="editPatient('${patient.id}')" class="action-btn edit">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button onclick="deletePatient('${patient.id}')" class="action-btn delete">
        <i class="fas fa-trash"></i> Delete
      </button>
    </td>
  `;
  
  return row;
}

// Get department name
function getDepartmentName(department) {
  const departmentNames = {
    'cardiologist': 'Cardiologist',
    'neurologist': 'Neurologist',
    'orthopedic_surgeon': 'Orthopedic Surgeon',
    'pediatrician': 'Pediatrician',
    'general_physician': 'General Physician',
    'dermatologist': 'Dermatologist',
    'psychiatrist': 'Psychiatrist',
    'oncologist': 'Oncologist',
    'radiologist': 'Radiologist',
    'anesthesiologist': 'Anesthesiologist'
  };
  
  return departmentNames[department] || department;
}

// Get doctor name by ID
function getDoctorName(doctorId) {
  for (const department in doctorData) {
    const doctor = doctorData[department].find(d => d.id === doctorId);
    if (doctor) {
      return doctor.name;
    }
  }
  return doctorId; // Return ID if doctor not found
}

// Get doctor details by ID
function getDoctorDetails(doctorId) {
  for (const department in doctorData) {
    const doctor = doctorData[department].find(d => d.id === doctorId);
    if (doctor) {
      return doctor;
    }
  }
  return null;
}

// Get doctor's working schedule for display
function getDoctorSchedule(doctorId) {
  const doctor = getDoctorDetails(doctorId);
  if (!doctor) return 'Schedule not available';
  
  let schedule = '';
  
  if (doctor.workingDays && doctor.workingDays.length > 0) {
    const dayNames = {
      'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 
      'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'
    };
    const workingDays = doctor.workingDays.map(day => dayNames[day] || day).join(', ');
    schedule += `Working Days: ${workingDays}`;
  }
  
  if (doctor.workingHours && doctor.workingHours.start && doctor.workingHours.end) {
    schedule += ` | Hours: ${doctor.workingHours.start} - ${doctor.workingHours.end}`;
  }
  
  return schedule || 'Schedule not available';
}

// Show doctor schedule information
function showDoctorScheduleInfo(schedule) {
  // Create or update schedule info element
  let scheduleInfo = document.getElementById('doctorScheduleInfo');
  if (!scheduleInfo) {
    scheduleInfo = document.createElement('div');
    scheduleInfo.id = 'doctorScheduleInfo';
    scheduleInfo.style.cssText = `
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 5px;
      padding: 10px;
      margin: 10px 0;
      font-size: 0.9rem;
      color: #1976d2;
    `;
    
    // Insert after the doctor select
    const doctorSelect = document.querySelector('select[name="doctor"]');
    if (doctorSelect) {
      doctorSelect.parentNode.parentNode.appendChild(scheduleInfo);
    }
  }
  
  scheduleInfo.innerHTML = `<strong>Doctor Schedule:</strong> ${schedule}`;
  scheduleInfo.style.display = 'block';
}

// Refresh doctor data (useful when admin adds new doctors)
function refreshDoctorData() {
  loadDoctorData();
  // Refresh any open doctor dropdowns
  const departmentSelect = document.getElementById('department');
  const updateDepartmentSelect = document.getElementById('updateDepartment');
  
  if (departmentSelect && departmentSelect.value) {
    populateDoctors(departmentSelect.value, 'doctor');
  }
  
  if (updateDepartmentSelect && updateDepartmentSelect.value) {
    populateDoctors(updateDepartmentSelect.value, 'updateDoctor');
  }
}

// Refresh patient data from local storage
function refreshPatientData() {
  loadPatientData();
  loadPatientTable();
  loadAllPatientTable();
  staffUtils.showModal('Patient data refreshed from local storage!', 'success');
}

// Debug function to show local storage info
function debugLocalStorage() {
  const allData = localStorage.getItem(PATIENT_DATA_KEY);
  const parsedData = allData ? JSON.parse(allData) : [];
  
  console.log('=== Local Storage Debug Info ===');
  console.log('Storage Key:', PATIENT_DATA_KEY);
  console.log('Raw Data:', allData);
  console.log('Parsed Data:', parsedData);
  console.log('Data Type:', typeof parsedData);
  console.log('Is Array:', Array.isArray(parsedData));
  console.log('Length:', parsedData.length);
  
  if (parsedData.length > 0) {
    console.log('First Patient:', parsedData[0]);
    console.log('Last Patient:', parsedData[parsedData.length - 1]);
  }
  
  staffUtils.showModal(`Debug Info: ${parsedData.length} patients in local storage. Check console for details.`, 'success');
}

// Search patient table
function searchPatientTable() {
  const searchTerm = document.getElementById('patientSearch').value.trim();
  const filterValue = document.getElementById('departmentFilter').value;
  
  let filteredPatients = patientData.filter(patient => 
    staffUtils.isToday(patient.appointmentDate)
  );
  
  // Apply search filter
  if (searchTerm) {
    filteredPatients = staffUtils.searchTable(searchTerm, filteredPatients, ['id', 'name', 'department']);
  }
  
  // Apply department filter
  if (filterValue) {
    filteredPatients = staffUtils.filterTable(filterValue, filteredPatients, 'department');
  }
  
  displayPatientTable(filteredPatients);
}

// Search all patients table
function searchAllPatientTable() {
  const searchTerm = document.getElementById('allPatientSearch').value.trim();
  const departmentFilter = document.getElementById('allDepartmentFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  
  let filteredPatients = patientData;
  
  // Apply search filter
  if (searchTerm) {
    filteredPatients = staffUtils.searchTable(searchTerm, filteredPatients, ['id', 'name', 'department']);
  }
  
  // Apply department filter
  if (departmentFilter) {
    filteredPatients = staffUtils.filterTable(departmentFilter, filteredPatients, 'department');
  }
  
  // Apply status filter
  if (statusFilter) {
    filteredPatients = staffUtils.filterTable(statusFilter, filteredPatients, 'status');
  }
  
  displayAllPatientTable(filteredPatients);
}

// Edit patient
function editPatient(patientId) {
  const patient = patientData.find(p => p.id === patientId);
  if (!patient) {
    staffUtils.showModal('Patient not found.', 'error');
    return;
  }
  
  // Switch to update section
  staffUtils.showSection('update');
  
  // Populate search field and form
  document.getElementById('searchPatientId').value = patientId;
  searchPatient();
}

// Delete patient
function deletePatient(patientId) {
  staffUtils.confirmAction('Are you sure you want to delete this patient?', function() {
    const patientIndex = patientData.findIndex(p => p.id === patientId);
    
    if (patientIndex === -1) {
      staffUtils.showModal('Patient not found.', 'error');
      return;
    }
    
    patientData.splice(patientIndex, 1);
    savePatientData();
    loadPatientTable();
    loadAllPatientTable(); // Also update all patients table
    staffUtils.showModal('Patient deleted successfully!', 'success');
  });
}

// Logout function
function logout() {
  staffUtils.confirmAction('Are you sure you want to logout?', function() {
    staffUtils.clearSession();
    window.location.href = 'staff_login.html';
  });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Validate session first
  if (!validateReceptionistSession()) {
    window.location.href = 'staff_login.html';
    return;
  }
  
  // Load patient data from local storage
  loadPatientData();
  
  // Load doctor data from admin dashboard local storage
  loadDoctorData();
  
  // Show default section
  staffUtils.showSection('new');
  
  // Load initial patient table data
  loadPatientTable();
  loadAllPatientTable();
  
  // Setup search functionality
  staffUtils.setupSearchInput('patientSearch', searchPatientTable);
  staffUtils.setupFilterDropdown('departmentFilter', searchPatientTable);
  
  // Setup all patients search functionality
  staffUtils.setupSearchInput('allPatientSearch', searchAllPatientTable);
  staffUtils.setupFilterDropdown('allDepartmentFilter', searchAllPatientTable);
  staffUtils.setupFilterDropdown('statusFilter', searchAllPatientTable);
  
  // Setup department and doctor dropdowns
  setupDepartmentDoctorDropdowns();
  
  // Generate and set initial patient ID
  const patientIdField = document.getElementById('patientId');
  if (patientIdField) {
    patientIdField.value = generatePatientId();
    patientIdField.readOnly = true;
  }
  
  // Add form reset handler to regenerate patient ID
  const newPatientForm = document.getElementById('newPatientForm');
  if (newPatientForm) {
    newPatientForm.addEventListener('reset', function() {
      setTimeout(() => {
        const patientIdField = document.getElementById('patientId');
        if (patientIdField) {
          patientIdField.value = generatePatientId();
        }
      }, 0);
    });
  }
  
  // Don't set default date - it will be set when doctor is selected
  
  console.log('Receptionist Dashboard initialized successfully!');
  const session = staffUtils && staffUtils.getSession ? staffUtils.getSession() : null;
    if (session && session.name) {
        const welcomeEl = document.getElementById('welcomeStaff');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome ${session.name}`;
        }
    }
});

// Setup department and doctor dropdown functionality
function setupDepartmentDoctorDropdowns() {
  // New patient form
  const departmentSelect = document.getElementById('department');
  const doctorSelect = document.getElementById('doctor');
  const appointmentDateInput = document.getElementById('appointmentDate');
  const appointmentTimeSelect = document.getElementById('appointmentTime');
  
  // Update patient form
  const updateDepartmentSelect = document.getElementById('updateDepartment');
  const updateDoctorSelect = document.getElementById('updateDoctor');
  const updateAppointmentDateInput = document.getElementById('updateAppointmentDate');
  const updateAppointmentTimeSelect = document.getElementById('updateAppointmentTime');
  
  // Department change handlers for new patient form
  if (departmentSelect) {
    departmentSelect.addEventListener('change', function() {
      const selectedDepartment = this.value;
      populateDoctors(selectedDepartment, 'doctor');
      // Clear time slots when department changes
      appointmentTimeSelect.innerHTML = '<option value="">Select Doctor First</option>';
    });
  }
  
  // Doctor change handler for new patient form
  if (doctorSelect) {
    doctorSelect.addEventListener('change', function() {
      const selectedDoctor = this.value;
      
      if (selectedDoctor) {
        // Show doctor's schedule
        const schedule = getDoctorSchedule(selectedDoctor);
        showDoctorScheduleInfo(schedule);
        
        // Set date restrictions based on doctor's working days
        setDateRestrictions(selectedDoctor, 'appointmentDate');
        
        // Get the next available date and populate time slots
        const nextAvailableDate = getNextAvailableDate(selectedDoctor);
        appointmentDateInput.value = nextAvailableDate;
        populateTimeSlots(selectedDoctor, nextAvailableDate, 'appointmentTime');
      } else {
        // Clear date and time when no doctor is selected
        appointmentDateInput.value = '';
        appointmentTimeSelect.innerHTML = '<option value="">Select Doctor First</option>';
      }
    });
  }
  
  // Date change handler for new patient form
  if (appointmentDateInput) {
    appointmentDateInput.addEventListener('change', function() {
      const selectedDate = this.value;
      const selectedDoctor = doctorSelect.value;
      if (selectedDoctor && selectedDate) {
        // Validate if selected date is a working day
        if (isWorkingDay(selectedDoctor, selectedDate)) {
          populateTimeSlots(selectedDoctor, selectedDate, 'appointmentTime');
        } else {
          const nextAvailable = getNextAvailableDate(selectedDoctor, selectedDate);
          staffUtils.showModal(`Selected date is not a working day for this doctor. Next available date: ${nextAvailable}`, 'error');
          this.value = nextAvailable;
          populateTimeSlots(selectedDoctor, nextAvailable, 'appointmentTime');
        }
      }
    });
  }
  
  // Department change handlers for update patient form
  if (updateDepartmentSelect) {
    updateDepartmentSelect.addEventListener('change', function() {
      const selectedDepartment = this.value;
      populateDoctors(selectedDepartment, 'updateDoctor');
      // Clear time slots when department changes
      updateAppointmentTimeSelect.innerHTML = '<option value="">Select Doctor First</option>';
    });
  }
  
  // Doctor change handler for update patient form
  if (updateDoctorSelect) {
    updateDoctorSelect.addEventListener('change', function() {
      const selectedDoctor = this.value;
      
      if (selectedDoctor) {
        // Show doctor's schedule
        const schedule = getDoctorSchedule(selectedDoctor);
        showDoctorScheduleInfo(schedule);
        
        // Set date restrictions based on doctor's working days
        setDateRestrictions(selectedDoctor, 'updateAppointmentDate');
        
        // Get the next available date and populate time slots
        const nextAvailableDate = getNextAvailableDate(selectedDoctor);
        updateAppointmentDateInput.value = nextAvailableDate;
        populateTimeSlots(selectedDoctor, nextAvailableDate, 'updateAppointmentTime');
      } else {
        // Clear date and time when no doctor is selected
        updateAppointmentDateInput.value = '';
        updateAppointmentTimeSelect.innerHTML = '<option value="">Select Doctor First</option>';
      }
    });
  }
  
  // Date change handler for update patient form
  if (updateAppointmentDateInput) {
    updateAppointmentDateInput.addEventListener('change', function() {
      const selectedDate = this.value;
      const selectedDoctor = updateDoctorSelect.value;
      if (selectedDoctor && selectedDate) {
        // Validate if selected date is a working day
        if (isWorkingDay(selectedDoctor, selectedDate)) {
          populateTimeSlots(selectedDoctor, selectedDate, 'updateAppointmentTime');
        } else {
          const nextAvailable = getNextAvailableDate(selectedDoctor, selectedDate);
          staffUtils.showModal(`Selected date is not a working day for this doctor. Next available date: ${nextAvailable}`, 'error');
          this.value = nextAvailable;
          populateTimeSlots(selectedDoctor, nextAvailable, 'updateAppointmentTime');
        }
      }
    });
  }
} 