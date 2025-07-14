// Lab Technician Dashboard JavaScript
// Handles lab reports sent from doctor dashboard

// Global variables
let labReportData = [];
let testListData = [];
let previousReportsData = [];
let currentLabTechId = null;

// Get current lab technician ID from session
function getCurrentLabTechId() {
    const session = staffUtils.getSession();
    if (session && session.staffId && session.role === 'labtech') {
        console.log(`Lab Technician session found: ${session.staffId} (${session.name})`);
        return session.staffId;
    }
    console.log('No valid lab technician session found');
    return null;
}

// Validate lab technician session
function validateLabTechSession() {
    const session = staffUtils.getSession();
    if (!session) {
        console.log('No session found');
        return false;
    }
    
    if (session.role !== 'labtech') {
        console.log(`Invalid role: ${session.role}. Expected: labtech`);
        return false;
    }
    
    console.log(`Valid lab technician session: ${session.staffId} (${session.name})`);
    return true;
}

// Load lab report data from local storage
function loadLabReportData() {
    try {
        const data = localStorage.getItem('hospitalLabTechData');
        let raw = data ? JSON.parse(data) : [];
        
        // Handle the nested data structure
        labReportData = [];
        if (Array.isArray(raw)) {
            raw.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    // Check if this item has numeric keys (nested structure)
                    const keys = Object.keys(item);
                    const numericKeys = keys.filter(key => !isNaN(key));
                    
                    if (numericKeys.length > 0) {
                        // Extract the nested data
                        numericKeys.forEach(key => {
                            const nestedData = item[key];
                            if (typeof nestedData === 'object' && nestedData !== null) {
                                labReportData.push(nestedData);
                            }
                        });
                    } else {
                        // Direct object, add as is
                        labReportData.push(item);
                    }
                }
            });
        }
        
        console.log(`Loaded ${labReportData.length} lab reports from local storage:`, labReportData);
    } catch (error) {
        console.error('Error loading lab report data:', error);
        labReportData = [];
    }
}

// Save lab report data to local storage
function saveLabReportData() {
    try {
        localStorage.setItem('hospitalLabTechData', JSON.stringify(labReportData));
        console.log('Lab report data saved to local storage');
    } catch (error) {
        console.error('Error saving lab report data:', error);
    }
}

// Load test list data from local storage
function loadTestListData() {
    try {
        const data = localStorage.getItem('hospitalTestListData');
        testListData = data ? JSON.parse(data) : [];
        
        // If no test data exists, create some default tests
        if (testListData.length === 0) {
            testListData = [
                {
                    id: 'TEST001',
                    testName: 'Complete Blood Count (CBC)',
                    category: 'blood',
                    description: 'Measures red blood cells, white blood cells, and platelets',
                    price: 800,
                    duration: 24,
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'TEST002',
                    testName: 'Blood Glucose Test',
                    category: 'blood',
                    description: 'Measures blood sugar levels',
                    price: 500,
                    duration: 4,
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'TEST003',
                    testName: 'Urine Analysis',
                    category: 'urine',
                    description: 'Comprehensive urine examination',
                    price: 600,
                    duration: 6,
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'TEST004',
                    testName: 'Liver Function Test',
                    category: 'biochemistry',
                    description: 'Measures liver enzymes and proteins',
                    price: 1200,
                    duration: 24,
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'TEST005',
                    testName: 'Chest X-Ray',
                    category: 'radiology',
                    description: 'Chest imaging for lung and heart assessment',
                    price: 1500,
                    duration: 2,
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ];
            saveTestListData();
        }
        
        console.log(`Loaded ${testListData.length} tests from local storage`);
    } catch (error) {
        console.error('Error loading test list data:', error);
        testListData = [];
    }
}

// Save test list data to local storage
function saveTestListData() {
    try {
        localStorage.setItem('hospitalTestListData', JSON.stringify(testListData));
        console.log('Test list data saved to local storage');
    } catch (error) {
        console.error('Error saving test list data:', error);
    }
}

// Load previous reports data
function loadPreviousReportsData() {
    try {
        // Get all lab reports from localStorage
        const data = localStorage.getItem('hospitalLabTechData');
        let allReports = data ? JSON.parse(data) : [];
        
        // Handle nested data structure
        let flattenedReports = [];
        if (Array.isArray(allReports)) {
            allReports.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    const keys = Object.keys(item);
                    const numericKeys = keys.filter(key => !isNaN(key));
                    
                    if (numericKeys.length > 0) {
                        numericKeys.forEach(key => {
                            const nestedData = item[key];
                            if (typeof nestedData === 'object' && nestedData !== null) {
                                flattenedReports.push(nestedData);
                            }
                        });
                    } else {
                        flattenedReports.push(item);
                    }
                }
            });
        }
        
        // Filter for completed or cancelled reports from the past
        const now = new Date();
        previousReportsData = flattenedReports.filter(report => {
            // Check if status is completed or cancelled
            const isCompleted = report.status === 'complete' || report.status === 'cancelled';
            
            // Check if date is in the past
            const reportDate = new Date(report.date);
            const isPastDate = reportDate < now;
            
            return isCompleted && isPastDate;
        });
        
        console.log(`Loaded ${previousReportsData.length} previous reports from local storage`);
    } catch (error) {
        console.error('Error loading previous reports data:', error);
        previousReportsData = [];
    }
}

// Save previous reports data to local storage
function savePreviousReportsData() {
    try {
        localStorage.setItem('hospitalPreviousReportsData', JSON.stringify(previousReportsData));
        console.log('Previous reports data saved to local storage');
    } catch (error) {
        console.error('Error saving previous reports data:', error);
    }
}

// Load lab report table
function loadLabReportTable() {
    loadLabReportData();
    
    console.log(`Displaying ${labReportData.length} lab reports`);
    displayLabReportTable(labReportData);
    
    // Update info display
    const infoElement = document.getElementById('testReportInfo');
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${labReportData.length} lab reports from doctor dashboard`;
        infoElement.style.background = labReportData.length > 0 ? '#e8f5e8' : '#fff3cd';
    }
}

// Load test list table
function loadTestListTable() {
    loadTestListData();
    
    console.log(`Displaying ${testListData.length} tests`);
    displayTestListTable(testListData);
    
    // Update info display
    const infoElement = document.getElementById('testListInfo');
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${testListData.length} available tests`;
        infoElement.style.background = testListData.length > 0 ? '#e8f5e8' : '#fff3cd';
    }
}

// Load previous reports table
function loadPreviousReportsTable() {
    loadPreviousReportsData();
    
    console.log(`Displaying ${previousReportsData.length} previous reports`);
    displayPreviousReportsTable(previousReportsData);
    
    // Update info display
    const infoElement = document.getElementById('previousReportsInfo');
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> Loaded ${previousReportsData.length} previous test reports`;
        infoElement.style.background = previousReportsData.length > 0 ? '#e8f5e8' : '#fff3cd';
    }
}

// Display previous reports table
function displayPreviousReportsTable(previousReports) {
    staffUtils.displayTableData(previousReports, 'previousReportsTableBody', createPreviousReportRow);
}

// Create previous report row
function createPreviousReportRow(report) {
    const row = document.createElement('tr');
    
    const statusBadge = staffUtils.getStatusBadge(report.status);
    const reportDate = staffUtils.formatDate(report.date);
    const completedDate = report.completedAt ? staffUtils.formatDate(report.completedAt) : 'N/A';
    
    row.innerHTML = `
        <td>${report.patientId}</td>
        <td>${report.patientName}</td>
        <td>${report.doctorName || 'Unknown Doctor'}</td>
        <td>${report.testType}</td>
        <td>${reportDate}</td>
        <td>${statusBadge}</td>
        <td>
            <button onclick="viewPreviousReport('${report.id}')" class="action-btn view">
                <i class="fas fa-eye"></i> View Details
            </button>
        </td>
    `;
    
    return row;
}

// Display test list table
function displayTestListTable(tests) {
    staffUtils.displayTableData(tests, 'testListTableBody', createTestListRow);
}

// Create test list row
function createTestListRow(test) {
    const row = document.createElement('tr');
    
    const statusBadge = staffUtils.getStatusBadge(test.status);
    const categoryLabel = getCategoryLabel(test.category);
    const priceFormatted = staffUtils.formatCurrency(test.price);
    
    // Truncate description for display
    const descriptionPreview = test.description.length > 50 ? test.description.substring(0, 50) + '...' : test.description;
    
    row.innerHTML = `
        <td>${test.testName}</td>
        <td>${categoryLabel}</td>
        <td title="${test.description}">${descriptionPreview}</td>
        <td>${priceFormatted}</td>
        <td>${test.duration} hours</td>
        <td>${statusBadge}</td>
        <td>
            <button onclick="viewTest('${test.id}')" class="action-btn view">
                <i class="fas fa-eye"></i> View
            </button>
            <button onclick="editTest('${test.id}')" class="action-btn edit">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="deleteTest('${test.id}')" class="action-btn delete">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    
    return row;
}

// Get category label
function getCategoryLabel(category) {
    const categoryLabels = {
        'blood': 'Blood Tests',
        'urine': 'Urine Tests',
        'biochemistry': 'Biochemistry',
        'microbiology': 'Microbiology',
        'radiology': 'Radiology',
        'other': 'Other'
    };
    
    return categoryLabels[category] || 'Other';
}

// Display lab report table
function displayLabReportTable(labReports) {
    staffUtils.displayTableData(labReports, 'testReportTableBody', createLabReportRow);
}

// Create lab report row
function createLabReportRow(labReport) {
    const row = document.createElement('tr');
    
    const statusBadge = staffUtils.getStatusBadge(labReport.status);
    const labReportDate = staffUtils.formatDate(labReport.date);
    
    row.innerHTML = `
        <td>${labReport.patientId}</td>
        <td>${labReport.patientName}</td>
        <td>${labReport.doctorName || 'Unknown Doctor'}</td>
        <td>${labReport.testType}</td>
        <td>${labReportDate}</td>
        <td>${statusBadge}</td>
        <td>
            <button onclick="viewLabReport('${labReport.id}')" class="action-btn view">
                <i class="fas fa-eye"></i> View
            </button>
            <button onclick="updateLabReportStatus('${labReport.id}')" class="action-btn edit">
                <i class="fas fa-edit"></i> Update Status
            </button>
        </td>
    `;
    
    return row;
}

// Get priority badge
function getPriorityBadge(priority) {
    const priorityClasses = {
        'low': 'status-active',
        'normal': 'status-pending',
        'high': 'status-warning',
        'urgent': 'status-error'
    };
    
    const priorityLabels = {
        'low': 'Low',
        'normal': 'Normal',
        'high': 'High',
        'urgent': 'Urgent'
    };
    
    const className = priorityClasses[priority] || 'status-pending';
    const label = priorityLabels[priority] || 'Normal';
    
    return `<span class="status-badge ${className}">${label}</span>`;
}

// View test details
function viewTest(testId) {
    const test = testListData.find(t => t.id === testId);
    if (!test) {
        staffUtils.showModal('Test not found.', 'error');
        return;
    }
    
    const details = `
        <div class="test-details">
            <h4>Test Details</h4>
            <p><strong>Test Name:</strong> ${test.testName}</p>
            <p><strong>Category:</strong> ${getCategoryLabel(test.category)}</p>
            <p><strong>Description:</strong> ${test.description}</p>
            <p><strong>Price:</strong> ${staffUtils.formatCurrency(test.price)}</p>
            <p><strong>Duration:</strong> ${test.duration} hours</p>
            <p><strong>Status:</strong> ${test.status}</p>
            <p><strong>Created:</strong> ${staffUtils.formatDate(test.createdAt)}</p>
        </div>
    `;
    
    staffUtils.showModal(details, 'info');
}

// Edit test
function editTest(testId) {
    const test = testListData.find(t => t.id === testId);
    if (!test) {
        staffUtils.showModal('Test not found.', 'error');
        return;
    }
    
    // Populate the modal with test data
    document.getElementById('testName').value = test.testName;
    document.getElementById('testCategory').value = test.category;
    document.getElementById('testDescription').value = test.description;
    document.getElementById('testPrice').value = test.price;
    document.getElementById('testDuration').value = test.duration;
    
    // Update modal title and form
    document.getElementById('testModalTitle').textContent = 'Edit Test';
    document.getElementById('testForm').setAttribute('data-edit-id', testId);
    
    // Show modal
    document.getElementById('testModal').style.display = 'block';
}

// Delete test
function deleteTest(testId) {
    const test = testListData.find(t => t.id === testId);
    if (!test) {
        staffUtils.showModal('Test not found.', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${test.testName}"?`)) {
        testListData = testListData.filter(t => t.id !== testId);
        saveTestListData();
        loadTestListTable();
        staffUtils.showModal('Test deleted successfully!', 'success');
    }
}

// View previous report details
function viewPreviousReport(reportId) {
    const report = previousReportsData.find(r => r.id === reportId);
    if (!report) {
        staffUtils.showModal('Previous report not found.', 'error');
        return;
    }
    
    const completedDate = report.completedAt ? staffUtils.formatDate(report.completedAt) : 'N/A';
    const updatedDate = report.updatedAt ? staffUtils.formatDate(report.updatedAt) : 'N/A';
    
    const details = `
        <div class="previous-report-details">
            <h4>Previous Test Report Details</h4>
            <p><strong>Patient ID:</strong> ${report.patientId}</p>
            <p><strong>Patient Name:</strong> ${report.patientName}</p>
            <p><strong>Doctor:</strong> ${report.doctorName || 'Unknown Doctor'}</p>
            <p><strong>Test Type:</strong> ${report.testType}</p>
            <p><strong>Test Date:</strong> ${staffUtils.formatDate(report.date)}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <p><strong>Notes:</strong> ${report.notes || 'No notes'}</p>
            <p><strong>Completed Date:</strong> ${completedDate}</p>
            <p><strong>Last Updated:</strong> ${updatedDate}</p>
            <p><strong>Updated By:</strong> ${report.updatedBy || 'Unknown'}</p>
        </div>
    `;
    
    staffUtils.showModal(details, 'info');
}

// View lab report details
function viewLabReport(labReportId) {
    const labReport = labReportData.find(l => l.id === labReportId);
    if (!labReport) {
        staffUtils.showModal('Lab report not found.', 'error');
        return;
    }
    
    const details = `
        <div class="lab-report-details">
            <h4>Lab Report Details</h4>
            <p><strong>Patient ID:</strong> ${labReport.patientId}</p>
            <p><strong>Patient Name:</strong> ${labReport.patientName}</p>
            <p><strong>Doctor:</strong> ${labReport.doctorName || 'Unknown Doctor'}</p>
            <p><strong>Date:</strong> ${staffUtils.formatDate(labReport.date)}</p>
            <p><strong>Test Type:</strong> ${labReport.testType}</p>
            <p><strong>Priority:</strong> ${labReport.priority || 'normal'}</p>
            <p><strong>Status:</strong> ${labReport.status}</p>
            <p><strong>Notes:</strong> ${labReport.notes}</p>
            <p><strong>Received:</strong> ${labReport.receivedAt ? staffUtils.formatDate(labReport.receivedAt) : 'N/A'}</p>
        </div>
    `;
    
    staffUtils.showModal(details, 'info');
}

// Update lab report status
function updateLabReportStatus(labReportId) {
    const labReport = labReportData.find(l => l.id === labReportId);
    if (!labReport) {
        staffUtils.showModal('Lab report not found.', 'error');
        return;
    }
    
    // Create a custom modal for status update
    showStatusUpdateModal(labReport);
}

// Show status update modal
function showStatusUpdateModal(labReport) {
    const statusOptions = ['in-progress', 'complete', 'cancelled'];
    const currentStatus = labReport.status;
    
    // Create modal HTML
    const modalHTML = `
        <div id="statusUpdateModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close" onclick="closeStatusUpdateModal()">&times;</span>
                <h3>Update Lab Report Status</h3>
                
                <div class="status-update-info">
                    <p><strong>Patient:</strong> ${labReport.patientName} (${labReport.patientId})</p>
                    <p><strong>Test:</strong> ${labReport.testType}</p>
                    <p><strong>Current Status:</strong> <span class="status-badge">${currentStatus}</span></p>
                </div>
                
                <form id="statusUpdateForm" class="dashboard-form">
                    <div class="form-group">
                        <label for="newStatus">New Status:</label>
                        <select id="newStatus" name="newStatus" required>
                            ${statusOptions.map(status => 
                                `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Update Status
                        </button>
                        <button type="button" onclick="closeStatusUpdateModal()" class="btn btn-secondary">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('statusUpdateModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('statusUpdateModal');
    modal.style.display = 'block';
    
    // Setup form submission
    const form = document.getElementById('statusUpdateForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        confirmStatusUpdate(labReport.id);
    });
}

// Close status update modal
function closeStatusUpdateModal() {
    const modal = document.getElementById('statusUpdateModal');
    if (modal) {
        modal.remove();
    }
}

// Confirm status update
function confirmStatusUpdate(labReportId) {
    const labReport = labReportData.find(l => l.id === labReportId);
    if (!labReport) {
        staffUtils.showModal('Lab report not found.', 'error');
        return;
    }
    
    const newStatus = document.getElementById('newStatus').value;
    const validStatuses = ['in-progress', 'complete', 'cancelled'];
    
    if (validStatuses.includes(newStatus)) {
        labReport.status = newStatus;
        labReport.updatedAt = new Date().toISOString();
        labReport.updatedBy = currentLabTechId;
        
        // If completed, add completion timestamp
        if (newStatus === 'complete') {
            labReport.completedAt = new Date().toISOString();
        }
        
        saveLabReportData();
        loadLabReportTable();
        closeStatusUpdateModal();
        staffUtils.showModal('Lab report status updated successfully!', 'success');
    } else {
        staffUtils.showModal('Invalid status selected.', 'error');
    }
}

// Search test list
function searchTestList() {
    const searchTerm = document.getElementById('testListSearch').value.trim();
    const categoryFilter = document.getElementById('testCategoryFilter').value;
    
    let filteredTests = [...testListData];
    
    // Apply search filter
    if (searchTerm) {
        filteredTests = staffUtils.searchTable(searchTerm, filteredTests, ['testName', 'description']);
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredTests = filteredTests.filter(test => test.category === categoryFilter);
    }
    
    // Sort by test name
    filteredTests.sort((a, b) => a.testName.localeCompare(b.testName));
    
    displayTestListTable(filteredTests);
}

// Search previous reports
function searchPreviousReports() {
    const searchTerm = document.getElementById('previousReportsSearch').value.trim();
    const statusFilter = document.getElementById('previousReportsStatusFilter').value;
    const dateFilter = document.getElementById('previousReportsDateFilter').value;
    
    let filteredReports = [...previousReportsData];
    
    // Apply search filter
    if (searchTerm) {
        filteredReports = staffUtils.searchTable(searchTerm, filteredReports, ['patientId', 'patientName', 'doctorName', 'testType']);
    }
    
    // Apply status filter
    if (statusFilter) {
        filteredReports = filteredReports.filter(report => report.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        
        filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.date);
            
            switch (dateFilter) {
                case 'today':
                    return reportDate.toDateString() === today.toDateString();
                case 'week':
                    return reportDate >= weekAgo;
                case 'month':
                    return reportDate >= monthAgo;
                case 'year':
                    return reportDate >= yearAgo;
                default:
                    return true;
            }
        });
    }
    
    // Sort by date (newest first)
    filteredReports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    displayPreviousReportsTable(filteredReports);
}

// Search lab reports
function searchLabReports() {
    const searchTerm = document.getElementById('testReportSearch').value.trim();
    const statusFilter = document.getElementById('testReportStatusFilter').value;
    
    let filteredLabReports = [...labReportData];
    
    // Apply search filter
    if (searchTerm) {
        filteredLabReports = staffUtils.searchTable(searchTerm, filteredLabReports, ['patientId', 'patientName', 'doctorName', 'testType']);
    }
    
    // Apply status filter
    if (statusFilter) {
        filteredLabReports = staffUtils.filterTable(statusFilter, filteredLabReports, 'status');
    }
    
    // Sort by priority and received date (urgent first, then by date)
    filteredLabReports.sort((a, b) => {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;
        
        if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
        }
        
        // If same priority, sort by received date (newest first)
        const dateA = new Date(a.receivedAt || a.date);
        const dateB = new Date(b.receivedAt || b.date);
        return dateB - dateA;
    });
    
    displayLabReportTable(filteredLabReports);
}

// Modal functions for test management
function showAddTestForm() {
    // Reset form
    document.getElementById('testForm').reset();
    document.getElementById('testForm').removeAttribute('data-edit-id');
    document.getElementById('testModalTitle').textContent = 'Add New Test';
    
    // Show modal
    document.getElementById('testModal').style.display = 'block';
}

function closeTestModal() {
    document.getElementById('testModal').style.display = 'none';
    document.getElementById('testForm').reset();
    document.getElementById('testForm').removeAttribute('data-edit-id');
}

// Handle test form submission
function handleTestFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const testData = {
        testName: formData.get('testName'),
        category: formData.get('category'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        duration: parseInt(formData.get('duration')),
        status: 'active'
    };
    
    // Validation
    if (!testData.testName || !testData.category || !testData.price || !testData.duration) {
        staffUtils.showModal('Please fill in all required fields.', 'error');
        return;
    }
    
    const editId = event.target.getAttribute('data-edit-id');
    
    if (editId) {
        // Edit existing test
        const existingTest = testListData.find(t => t.id === editId);
        if (existingTest) {
            Object.assign(existingTest, testData);
            existingTest.updatedAt = new Date().toISOString();
            staffUtils.showModal('Test updated successfully!', 'success');
        }
    } else {
        // Add new test
        const newTest = {
            ...testData,
            id: 'TEST' + Date.now(),
            createdAt: new Date().toISOString()
        };
        testListData.push(newTest);
        staffUtils.showModal('Test added successfully!', 'success');
    }
    
    saveTestListData();
    loadTestListTable();
    closeTestModal();
}

// Logout function
function logout() {
    staffUtils.clearSession();
    window.location.href = 'staff_login.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Validate session
    if (!validateLabTechSession()) {
        window.location.href = 'staff_login.html';
        return;
    }
    
    currentLabTechId = getCurrentLabTechId();
    
    // Load data
    loadLabReportData();
    loadTestListData();
    loadPreviousReportsData();
    
    // Show default section
    staffUtils.showSection('testlist');
    
    // Load initial table data
    loadTestListTable();
    loadLabReportTable();
    loadPreviousReportsTable();
    
    // Setup search functionality for test list
    staffUtils.setupSearchInput('testListSearch', searchTestList);
    staffUtils.setupFilterDropdown('testCategoryFilter', searchTestList);
    
    // Setup search functionality for lab reports
    staffUtils.setupSearchInput('testReportSearch', searchLabReports);
    staffUtils.setupFilterDropdown('testReportStatusFilter', searchLabReports);
    
    // Setup search functionality for previous reports
    staffUtils.setupSearchInput('previousReportsSearch', searchPreviousReports);
    staffUtils.setupFilterDropdown('previousReportsStatusFilter', searchPreviousReports);
    staffUtils.setupFilterDropdown('previousReportsDateFilter', searchPreviousReports);
    
    // Setup test form submission
    const testForm = document.getElementById('testForm');
    if (testForm) {
        testForm.addEventListener('submit', handleTestFormSubmit);
    }
    
    console.log('Lab Technician Dashboard initialized successfully!');
}); 