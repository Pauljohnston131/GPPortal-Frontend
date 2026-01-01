// patient.js - Updated with proper error handling and full CRUD integration

const uploadForm = document.getElementById("uploadForm");
const patientId = document.getElementById("patientId");
const fileInput = document.getElementById("fileInput");
const refreshBtn = document.getElementById("refreshBtn");
const recordsList = document.getElementById("recordsList");
const msg = document.getElementById("msg");
const progressBar = document.querySelector(".progress");
const bar = progressBar.querySelector(".progress-bar");
const selectedFileName = document.getElementById("selectedFileName");
const uploadArea = document.getElementById("uploadArea");

// Event Listeners
uploadForm.addEventListener("submit", handleUpload);
refreshBtn.addEventListener("click", loadRecords);
patientId.addEventListener("input", loadRecords);

// Enter key support for patient ID
patientId.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadRecords();
    }
});

// File input click through upload area
uploadArea.addEventListener('click', () => fileInput.click());

// File selection handler
fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        selectedFileName.innerHTML = `<i class="bi bi-file-earmark-text me-2"></i>${fileName}`;
        selectedFileName.style.display = 'block';
    } else {
        selectedFileName.style.display = 'none';
    }
});

// Drag and drop functionality
uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        const fileName = fileInput.files[0].name;
        selectedFileName.innerHTML = `<i class="bi bi-file-earmark-text me-2"></i>${fileName}`;
        selectedFileName.style.display = 'block';
    }
});

// -------------------------------
// Handle file upload
// -------------------------------
async function handleUpload(e) {
    e.preventDefault();
    
    const pid = patientId.value.trim();
    const file = fileInput.files[0];
    
    if (!pid) {
        showMessage("Please enter Patient ID", "warning");
        return;
    }
    
    if (!file) {
        showMessage("Please select a file to upload", "warning");
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showMessage("File size exceeds 10MB limit", "danger");
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showMessage("Only JPG, PNG, GIF, and PDF files are allowed", "danger");
        return;
    }
    
    showMessage("Uploading...", "info");
    progressBar.style.display = "block";
    bar.style.width = "0%";
    
    const fd = new FormData();
    fd.append("patientId", pid);
    fd.append("file", file);
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                bar.style.width = `${percent}%`;
            }
        };
        
        xhr.onload = async () => {
            progressBar.style.display = "none";
            
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                showMessage("Upload successful!", "success");
                
                // Reset form
                fileInput.value = "";
                selectedFileName.style.display = "none";
                
                // Refresh records
                await loadRecords();
                
                // Auto-scroll to records
                document.getElementById('recordsList').scrollIntoView({ behavior: 'smooth' });
                
            } else {
                const error = JSON.parse(xhr.responseText);
                showMessage(error.error || "Upload failed", "danger");
            }
        };
        
        xhr.onerror = () => {
            progressBar.style.display = "none";
            showMessage("Network error during upload", "danger");
        };
        
        xhr.open("POST", `${API_BASE}/upload`);
        xhr.send(fd);
        
    } catch (error) {
        console.error("Upload error:", error);
        progressBar.style.display = "none";
        showMessage("Upload failed", "danger");
    }
}

// -------------------------------
// Load patient records
// -------------------------------
async function loadRecords() {
    const pid = patientId.value.trim();
    
    if (!pid) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-file-earmark-medical"></i>
                </div>
                <h5>No Patient ID entered</h5>
                <p class="info-text">Enter your Patient ID to view your records</p>
            </div>`;
        document.getElementById("recordCount").textContent = "0 records";
        return;
    }
    
    try {
        const data = await apiGet(`/records?patientId=${pid}`);
        
        if (data.error) {
            showMessage(data.error, "warning");
            displayEmptyState();
            return;
        }
        
        const records = data.records || [];
        
        // Update record count
        document.getElementById("recordCount").textContent = `${records.length} record${records.length !== 1 ? 's' : ''}`;
        
        if (records.length === 0) {
            displayEmptyState();
            return;
        }
        
        renderRecords(records);
        
    } catch (error) {
        console.error("Error loading records:", error);
        showMessage("Error loading records. Please try again.", "danger");
        displayEmptyState();
    }
}

// -------------------------------
// Render records list
// -------------------------------
function renderRecords(records) {
    recordsList.innerHTML = "";
    
    // Sort by creation date (newest first)
    records.sort((a, b) => b.createdAt - a.createdAt);
    
    records.forEach(rec => {
        const path = rec.blobName || extractBlobName(rec.blobUrl);
        const isImage = rec.contentType && rec.contentType.startsWith("image/");
        
        const preview = isImage
            ? `<img src="${API_BASE}/media/${path}" class="preview-img" onerror="this.onerror=null;this.src='img/file-icon.png'" alt="preview">`
            : `<div class="preview-img bg-light d-flex align-items-center justify-content-center">
                   <i class="bi bi-file-earmark-text fs-3 text-muted"></i>
               </div>`;
        
        const card = document.createElement("div");
        card.className = "record-card d-flex align-items-start";
        card.innerHTML = `
            ${preview}
            <div class="ms-3 flex-grow-1">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong class="d-block">${rec.originalName || 'Unnamed file'}</strong>
                        <div class="small text-muted mt-1">
                            <i class="bi bi-calendar me-1"></i>${formatDate(rec.createdAt)}
                        </div>
                    </div>
                    <span class="status-badge status-${rec.status || 'pending'}">
                        ${formatStatus(rec.status)}
                    </span>
                </div>
                
                ${rec.gpNotes ? `
                    <div class="mt-2 p-2 bg-light rounded small">
                        <strong><i class="bi bi-chat-left-text me-1"></i>GP Notes:</strong>
                        <p class="mb-0 mt-1">${rec.gpNotes}</p>
                    </div>
                ` : ''}
                
                <div class="mt-3">
                    <a href="${API_BASE}/media/${path}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                        <i class="bi bi-eye me-1"></i>View
                    </a>
                    <button class="btn btn-sm btn-outline-secondary copy-url-btn" data-url="${API_BASE}/media/${path}">
                        <i class="bi bi-link me-1"></i>Copy Link
                    </button>
                </div>
            </div>
        `;
        
        recordsList.appendChild(card);
    });
    
    // Add copy URL functionality
    document.querySelectorAll('.copy-url-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            navigator.clipboard.writeText(url).then(() => {
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
                this.classList.add('btn-success');
                this.classList.remove('btn-outline-secondary');
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            });
        });
    });
}

// -------------------------------
// Helper Functions
// -------------------------------
function extractBlobName(blobUrl) {
    if (!blobUrl) return '';
    const parts = blobUrl.split('patient-uploads/');
    return parts.length > 1 ? parts[1] : '';
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function formatStatus(status) {
    if (!status) return 'Pending';
    return status.replace(/_/g, ' ');
}

function displayEmptyState() {
    recordsList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="bi bi-cloud-upload"></i>
            </div>
            <h5>No records found</h5>
            <p class="info-text">Upload files to see them here</p>
            <button class="btn btn-nhs-primary mt-3" onclick="document.getElementById('fileInput').click()">
                <i class="bi bi-cloud-arrow-up me-2"></i>Upload Your First File
            </button>
        </div>`;
    document.getElementById("recordCount").textContent = "0 records";
}

function showMessage(message, type = 'info') {
    msg.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    setTimeout(() => {
        const alert = msg.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Auto-load records if patient ID is pre-filled
document.addEventListener('DOMContentLoaded', function() {
    if (patientId.value.trim()) {
        loadRecords();
    }
});