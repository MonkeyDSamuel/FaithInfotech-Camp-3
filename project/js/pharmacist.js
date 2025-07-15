// Pharmacist Dashboard JavaScript
// Handles prescriptions sent from doctor dashboard and medicine inventory management

// Global variables
let prescriptionData = [];
let medicineData = [];
let currentPharmacistId = null;

// Storage keys
const PRESCRIPTION_DATA_KEY = 'hospitalPrescriptionData';
const MEDICINE_DATA_KEY = 'hospitalMedicineData';

// Get current pharmacist ID from session
function getCurrentPharmacistId() {
    const session = staffUtils.getSession();
    if (session && session.staffId && session.role === 'pharmacist') {
        console.log(`Pharmacist session found: ${session.staffId} (${session.name})`);
        return session.staffId;
    }
    console.log('No valid pharmacist session found');
    return null;
}

// Validate pharmacist session
function validatePharmacistSession() {
    const session = staffUtils.getSession();
    if (!session) {
        console.log('No session found');
        return false;
    }
    
    if (session.role !== 'pharmacist') {
        console.log(`Invalid role: ${session.role}. Expected: pharmacist`);
        return false;
    }
    
    console.log(`Valid pharmacist session: ${session.staffId} (${session.name})`);
    return true;
}

// ==================== PRESCRIPTION FUNCTIONS ====================

// Load prescription data from local storage
function loadPrescriptionData() {
    try {
        const data = localStorage.getItem(PRESCRIPTION_DATA_KEY);
        prescriptionData = data ? JSON.parse(data) : [];
        console.log(`Loaded ${prescriptionData.length} prescriptions from local storage`);
        
        // Debug: Log the first prescription to see its structure
        if (prescriptionData.length > 0) {
            console.log('Sample prescription data structure:', prescriptionData[0]);
        }
    } catch (error) {
        console.error('Error loading prescription data:', error);
        prescriptionData = [];
    }
}

// Save prescription data to local storage
function savePrescriptionData() {
    try {
        localStorage.setItem(PRESCRIPTION_DATA_KEY, JSON.stringify(prescriptionData));
        console.log('Prescription data saved to local storage');
    } catch (error) {
        console.error('Error saving prescription data:', error);
    }
}

// Load prescription table
function loadPrescriptionTable() {
    loadPrescriptionData();
    
    console.log(`Displaying ${prescriptionData.length} prescriptions`);
    displayPrescriptionTable(prescriptionData);
    
    // Update info display
    const infoElement = document.getElementById('prescriptionInfo');
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${prescriptionData.length} prescriptions from doctor dashboard`;
        infoElement.style.background = prescriptionData.length > 0 ? '#e8f5e8' : '#fff3cd';
    }
}

// Display prescription table
function displayPrescriptionTable(prescriptions) {
    staffUtils.displayTableData(prescriptions, 'prescriptionTableBody', createPrescriptionRow);
}

// Create prescription row
function createPrescriptionRow(prescription) {
    // Debug: log the prescription object
    console.log('Rendering prescription row:', prescription);

    const row = document.createElement('tr');

    // Robust field extraction
    const patientId = prescription.patientId || prescription.patient_id || 'N/A';
    const patientName = prescription.patientName || prescription.patient_name || 'N/A';
    const dateRaw = prescription.date || prescription.prescriptionDate || '';
    const prescriptionDate = dateRaw ? staffUtils.formatDate(dateRaw) : 'N/A';
    const notes = prescription.notes || prescription.medicalNotes || 'N/A';
    const medicines = prescription.medicines || prescription.medicineList || 'N/A';
    const status = prescription.status || prescription.prescriptionStatus || 'pending';
    const statusBadge = staffUtils.getStatusBadge(status);

    // Truncate for display
    const notesPreview = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;
    const medicinesPreview = medicines.length > 50 ? medicines.substring(0, 50) + '...' : medicines;

    row.innerHTML = `
        <td>${patientId}</td>
        <td>${patientName}</td>
        <td>${prescriptionDate}</td>
        <td title="${notes}">${notesPreview}</td>
        <td title="${medicines}">${medicinesPreview}</td>
        <td>${statusBadge}</td>
        <td>
            <button onclick="updatePrescriptionStatus('${prescription.id}')" class="action-btn edit">
                <i class="fas fa-edit"></i> Update Status
            </button>
        </td>
    `;

    return row;
}

// View prescription details
function viewPrescription(prescriptionId) {
    const prescription = prescriptionData.find(p => p.id === prescriptionId);
    if (!prescription) {
        staffUtils.showModal('Prescription not found.', 'error');
        return;
    }
    
    // Handle different field names
    const status = prescription.status || prescription.prescriptionStatus || 'pending';
    const doctorName = prescription.doctorName || prescription.doctor || 'Unknown Doctor';
    const receivedDate = prescription.receivedAt ? staffUtils.formatDate(prescription.receivedAt) : 
                        (prescription.createdAt ? staffUtils.formatDate(prescription.createdAt) : 'N/A');
    
    const details = `
        <div class="prescription-details">
            <h4>Prescription Details</h4>
            <p><strong>Patient ID:</strong> ${prescription.patientId || 'N/A'}</p>
            <p><strong>Patient Name:</strong> ${prescription.patientName || 'N/A'}</p>
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date:</strong> ${staffUtils.formatDate(prescription.date)}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Notes:</strong> ${prescription.notes || 'N/A'}</p>
            <p><strong>Medicines:</strong> ${prescription.medicines || 'N/A'}</p>
            <p><strong>Received:</strong> ${receivedDate}</p>
            ${prescription.updatedAt ? `<p><strong>Last Updated:</strong> ${staffUtils.formatDate(prescription.updatedAt)}</p>` : ''}
            ${prescription.createdAt ? `<p><strong>Created:</strong> ${staffUtils.formatDate(prescription.createdAt)}</p>` : ''}
        </div>
    `;
    
    staffUtils.showModal(details, 'info');
}

// --- Modal state for prescription status update ---
let currentStatusPrescriptionId = null;

function updatePrescriptionStatus(prescriptionId) {
    const prescription = prescriptionData.find(p => p.id === prescriptionId);
    if (!prescription) {
        staffUtils.showModal('Prescription not found.', 'error');
        return;
    }
    currentStatusPrescriptionId = prescriptionId;
    // Set the dropdown to the current status (normalize to capitalized)
    const currentStatus = (prescription.status || prescription.prescriptionStatus || 'Active').toLowerCase();
    const select = document.getElementById('newPrescriptionStatus');
    if (select) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value.toLowerCase() === currentStatus) {
                select.selectedIndex = i;
                break;
            }
        }
    }
    document.getElementById('updateStatusModal').style.display = 'block';
}

function closeUpdateStatusModal() {
    document.getElementById('updateStatusModal').style.display = 'none';
    currentStatusPrescriptionId = null;
}

// Handle status update form submit
const updateStatusForm = document.getElementById('updateStatusForm');
if (updateStatusForm) {
    updateStatusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!currentStatusPrescriptionId) return;
        const prescription = prescriptionData.find(p => p.id === currentStatusPrescriptionId);
        if (!prescription) {
            staffUtils.showModal('Prescription not found.', 'error');
            closeUpdateStatusModal();
            return;
        }
        const newStatus = document.getElementById('newPrescriptionStatus').value;
        prescription.status = newStatus;
        prescription.prescriptionStatus = newStatus;
        prescription.updatedAt = new Date().toISOString();
        prescription.updatedBy = currentPharmacistId;
        savePrescriptionData();
        loadPrescriptionTable();
        staffUtils.showModal('Prescription status updated successfully!', 'success');
        closeUpdateStatusModal();
    });
}

// Search prescriptions
function searchPrescriptions() {
    const searchTerm = document.getElementById('prescriptionSearch').value.trim();
    const statusFilter = document.getElementById('prescriptionStatusFilter').value;
    const dateFilter = document.getElementById('prescriptionDateFilter').value;
    
    let filteredPrescriptions = [...prescriptionData];
    
    // Apply search filter
    if (searchTerm) {
        filteredPrescriptions = staffUtils.searchTable(searchTerm, filteredPrescriptions, ['patientId', 'patientName', 'doctorName']);
    }
    
    // Apply status filter
    if (statusFilter) {
        filteredPrescriptions = staffUtils.filterTable(statusFilter, filteredPrescriptions, 'status');
    }
    
    // Apply date filter
    if (dateFilter) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        filteredPrescriptions = filteredPrescriptions.filter(prescription => {
            const prescriptionDate = new Date(prescription.date);
            
            switch (dateFilter) {
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
    
    // Sort by received date (newest first)
    filteredPrescriptions.sort((a, b) => {
        const dateA = new Date(a.receivedAt || a.date);
        const dateB = new Date(b.receivedAt || b.date);
        return dateB - dateA;
    });
    
    displayPrescriptionTable(filteredPrescriptions);
}

// ==================== MEDICINE FUNCTIONS ====================

// Load medicine data from local storage
function loadMedicineData() {
    try {
        const data = localStorage.getItem(MEDICINE_DATA_KEY);
        medicineData = data ? JSON.parse(data) : [];
        console.log(`Loaded ${medicineData.length} medicines from local storage`);
    } catch (error) {
        console.error('Error loading medicine data:', error);
        medicineData = [];
    }
}

// Save medicine data to local storage
function saveMedicineData() {
    try {
        localStorage.setItem(MEDICINE_DATA_KEY, JSON.stringify(medicineData));
        console.log('Medicine data saved to local storage');
    } catch (error) {
        console.error('Error saving medicine data:', error);
    }
}

// Load medicine table
function loadMedicineTable() {
    loadMedicineData();
    
    console.log(`Displaying ${medicineData.length} medicines`);
    displayMedicineTable(medicineData);
    
    // Update info display
    const infoElement = document.getElementById('medicinesInfo');
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${medicineData.length} medicines from local storage`;
        infoElement.style.background = medicineData.length > 0 ? '#e8f5e8' : '#fff3cd';
    }
}

// Display medicine table
function displayMedicineTable(medicines) {
    staffUtils.displayTableData(medicines, 'medicineTableBody', createMedicineRow);
}

// Create medicine row
function createMedicineRow(medicine) {
    const row = document.createElement('tr');
    
    const stockStatus = getStockStatus(medicine.quantity);
    const expiryDate = staffUtils.formatDate(medicine.expiryDate);
    const isExpired = new Date(medicine.expiryDate) < new Date();
    
    row.innerHTML = `
        <td>${medicine.name}</td>
        <td>${medicine.genericName}</td>
        <td>${getCategoryName(medicine.category)}</td>
        <td>${medicine.quantity}</td>
        <td>${medicine.dosage}</td>
        <td class="${isExpired ? 'text-danger' : ''}">${expiryDate}</td>
        <td>${stockStatus}</td>
        <td>
            <button onclick="editMedicine('${medicine.id}')" class="action-btn edit">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="reduceQuantity('${medicine.id}')" class="action-btn edit">
                <i class="fas fa-minus"></i> Reduce
            </button>
            <button onclick="deleteMedicine('${medicine.id}')" class="action-btn delete">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    
    return row;
}

// Get stock status badge
function getStockStatus(quantity) {
    if (quantity <= 0) {
        return '<span class="status-badge status-error">Out of Stock</span>';
    } else if (quantity <= 10) {
        return '<span class="status-badge status-warning">Low Stock</span>';
    } else {
        return '<span class="status-badge status-active">In Stock</span>';
    }
}

// Get category name
function getCategoryName(category) {
    const categoryNames = {
        'antibiotics': 'Antibiotics',
        'painkillers': 'Painkillers',
        'vitamins': 'Vitamins',
        'diabetes': 'Diabetes',
        'cardiac': 'Cardiac',
        'other': 'Other'
    };
    return categoryNames[category] || category;
}

// Show add medicine form
function showAddMedicineForm() {
    document.getElementById('medicineModalTitle').textContent = 'Add New Medicine';
    document.getElementById('medicineForm').reset();
    document.getElementById('medicineForm').dataset.medicineId = '';
    document.getElementById('medicineModal').style.display = 'block';
}

// Edit medicine
function editMedicine(medicineId) {
    const medicine = medicineData.find(m => m.id === medicineId);
    if (!medicine) {
        staffUtils.showModal('Medicine not found.', 'error');
        return;
    }
    
    document.getElementById('medicineModalTitle').textContent = 'Edit Medicine';
    document.getElementById('medicineName').value = medicine.name;
    document.getElementById('genericName').value = medicine.genericName;
    document.getElementById('medicineCategory').value = medicine.category;
    document.getElementById('medicineQuantity').value = medicine.quantity;
    document.getElementById('medicineDosage').value = medicine.dosage;
    document.getElementById('medicineExpiry').value = medicine.expiryDate;
    document.getElementById('medicinePrice').value = medicine.price || '';
    document.getElementById('medicineManufacturer').value = medicine.manufacturer || '';
    document.getElementById('medicineDescription').value = medicine.description || '';
    
    document.getElementById('medicineForm').dataset.medicineId = medicineId;
    document.getElementById('medicineModal').style.display = 'block';
}

// Close medicine modal
function closeMedicineModal() {
    document.getElementById('medicineModal').style.display = 'none';
    document.getElementById('medicineForm').dataset.medicineId = '';
}

// View medicine details
function viewMedicine(medicineId) {
    const medicine = medicineData.find(m => m.id === medicineId);
    if (!medicine) {
        staffUtils.showModal('Medicine not found.', 'error');
        return;
    }
    
    const isExpired = new Date(medicine.expiryDate) < new Date();
    const stockStatus = getStockStatus(medicine.quantity);
    
    const details = `
        <div class="medicine-details">
            <h4>Medicine Details</h4>
            <p><strong>Name:</strong> ${medicine.name}</p>
            <p><strong>Generic Name:</strong> ${medicine.genericName}</p>
            <p><strong>Category:</strong> ${getCategoryName(medicine.category)}</p>
            <p><strong>Quantity:</strong> ${medicine.quantity}</p>
            <p><strong>Dosage:</strong> ${medicine.dosage}</p>
            <p><strong>Expiry Date:</strong> <span class="${isExpired ? 'text-danger' : ''}">${staffUtils.formatDate(medicine.expiryDate)}</span></p>
            <p><strong>Status:</strong> ${stockStatus}</p>
            <p><strong>Price:</strong> ${medicine.price ? '₹' + medicine.price : 'N/A'}</p>
            <p><strong>Manufacturer:</strong> ${medicine.manufacturer || 'N/A'}</p>
            <p><strong>Description:</strong> ${medicine.description || 'N/A'}</p>
            <p><strong>Created:</strong> ${medicine.createdAt ? staffUtils.formatDate(medicine.createdAt) : 'N/A'}</p>
            ${medicine.updatedAt ? `<p><strong>Last Updated:</strong> ${staffUtils.formatDate(medicine.updatedAt)}</p>` : ''}
        </div>
    `;
    
    staffUtils.showModal(details, 'info');
}

// Delete medicine
function deleteMedicine(medicineId) {
    staffUtils.confirmAction('Are you sure you want to delete this medicine?', function() {
        const medicineIndex = medicineData.findIndex(m => m.id === medicineId);
        
        if (medicineIndex === -1) {
            staffUtils.showModal('Medicine not found.', 'error');
            return;
        }
        
        medicineData.splice(medicineIndex, 1);
        saveMedicineData();
        loadMedicineTable();
        staffUtils.showModal('Medicine deleted successfully!', 'success');
    });
}

// Reduce medicine quantity
function reduceQuantity(medicineId) {
    const medicine = medicineData.find(m => m.id === medicineId);
    if (!medicine) {
        staffUtils.showModal('Medicine not found.', 'error');
        return;
    }
    
    document.getElementById('reduceMedicineName').value = medicine.name;
    document.getElementById('currentQuantity').value = medicine.quantity;
    document.getElementById('reduceQuantityForm').dataset.medicineId = medicineId;
    document.getElementById('reduceQuantityModal').style.display = 'block';
}

// Close reduce quantity modal
function closeReduceQuantityModal() {
    document.getElementById('reduceQuantityModal').style.display = 'none';
    document.getElementById('reduceQuantityForm').dataset.medicineId = '';
}

// Search medicines
function searchMedicines() {
    const searchTerm = document.getElementById('medicineSearch').value.trim();
    const categoryFilter = document.getElementById('medicineCategoryFilter').value;
    const stockFilter = document.getElementById('medicineStockFilter').value;
    
    let filteredMedicines = [...medicineData];
    
    // Apply search filter
    if (searchTerm) {
        filteredMedicines = staffUtils.searchTable(searchTerm, filteredMedicines, ['name', 'genericName', 'manufacturer']);
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredMedicines = staffUtils.filterTable(categoryFilter, filteredMedicines, 'category');
    }
    
    // Apply stock filter
    if (stockFilter) {
        filteredMedicines = filteredMedicines.filter(medicine => {
            switch (stockFilter) {
                case 'in-stock':
                    return medicine.quantity > 10;
                case 'low-stock':
                    return medicine.quantity > 0 && medicine.quantity <= 10;
                case 'out-of-stock':
                    return medicine.quantity <= 0;
                default:
                    return true;
            }
        });
    }
    
    // Sort by name
    filteredMedicines.sort((a, b) => a.name.localeCompare(b.name));
    displayMedicineTable(filteredMedicines);
}

// ==================== FORM HANDLERS ====================

// Medicine form submission
document.addEventListener('DOMContentLoaded', function() {
    // Medicine form submission
    const medicineForm = document.getElementById('medicineForm');
    if (medicineForm) {
        medicineForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const medicineId = this.dataset.medicineId;
            
            const newMedicine = {
                id: medicineId || staffUtils.generateId('MED'),
                name: formData.get('medicineName'),
                genericName: formData.get('genericName'),
                category: formData.get('category'),
                quantity: parseInt(formData.get('quantity')),
                dosage: formData.get('dosage'),
                expiryDate: formData.get('expiryDate'),
                price: formData.get('price') ? parseFloat(formData.get('price')) : null,
                manufacturer: formData.get('manufacturer') || '',
                description: formData.get('description') || '',
                createdBy: currentPharmacistId,
                createdAt: medicineId ? undefined : new Date().toISOString(),
                updatedAt: medicineId ? new Date().toISOString() : undefined
            };
            
            if (medicineId) {
                // Update existing medicine
                const index = medicineData.findIndex(m => m.id === medicineId);
                if (index !== -1) {
                    medicineData[index] = { ...medicineData[index], ...newMedicine };
                }
            } else {
                // Add new medicine
                medicineData.push(newMedicine);
            }
            
            saveMedicineData();
            loadMedicineTable();
            closeMedicineModal();
            staffUtils.showModal('Medicine saved successfully!', 'success');
        });
    }
    
    // Reduce quantity form submission
    const reduceQuantityForm = document.getElementById('reduceQuantityForm');
    if (reduceQuantityForm) {
        reduceQuantityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const medicineId = this.dataset.medicineId;
            const reduceQuantity = parseInt(formData.get('reduceQuantity'));
            const reason = formData.get('reason');
            const notes = formData.get('notes');
            
            const medicine = medicineData.find(m => m.id === medicineId);
            if (!medicine) {
                staffUtils.showModal('Medicine not found.', 'error');
                return;
            }
            
            if (reduceQuantity > medicine.quantity) {
                staffUtils.showModal('Cannot reduce more than available quantity.', 'error');
                return;
            }
            
            medicine.quantity -= reduceQuantity;
            medicine.updatedAt = new Date().toISOString();
            medicine.updatedBy = currentPharmacistId;
            
            // Add reduction history
            if (!medicine.reductionHistory) {
                medicine.reductionHistory = [];
            }
            medicine.reductionHistory.push({
                date: new Date().toISOString(),
                quantity: reduceQuantity,
                reason: reason,
                notes: notes,
                reducedBy: currentPharmacistId
            });
            
            saveMedicineData();
            loadMedicineTable();
            closeReduceQuantityModal();
            staffUtils.showModal('Quantity reduced successfully!', 'success');
        });
    }
});

// ==================== UTILITY FUNCTIONS ====================

// Logout function
function logout() {
    staffUtils.confirmAction('Are you sure you want to logout?', function() {
        staffUtils.clearSession();
        window.location.href = 'staff_login.html';
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Validate session
    if (!validatePharmacistSession()) {
        window.location.href = 'staff_login.html';
        return;
    }
    
    currentPharmacistId = getCurrentPharmacistId();
    
    // Load data
    loadPrescriptionData();
    loadMedicineData();
    
    // Show default section
    staffUtils.showSection('prescriptions');
    
    // Load initial table data
    loadPrescriptionTable();
    loadMedicineTable();
    
    // Setup search functionality
    staffUtils.setupSearchInput('prescriptionSearch', searchPrescriptions);
    staffUtils.setupFilterDropdown('prescriptionStatusFilter', searchPrescriptions);
    staffUtils.setupFilterDropdown('prescriptionDateFilter', searchPrescriptions);
    
    staffUtils.setupSearchInput('medicineSearch', searchMedicines);
    staffUtils.setupFilterDropdown('medicineCategoryFilter', searchMedicines);
    staffUtils.setupFilterDropdown('medicineStockFilter', searchMedicines);
    
    const session = staffUtils && staffUtils.getSession ? staffUtils.getSession() : null;
    if (session && session.name) {
        const welcomeEl = document.getElementById('welcomeStaff');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome ${session.name}`;
        }
    }
    console.log('Pharmacist Dashboard initialized successfully!');
}); 