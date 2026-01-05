// ============================================
// PATIENT LOGIN & SESSION MANAGEMENT
// ============================================

// Create login overlay
function createLoginOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.className = 'login-overlay';
    overlay.innerHTML = `
        <div class="login-container">
            <div class="login-logo">
                <div class="login-icon">
                    <i class="bi bi-shield-check" style="font-size: 2rem; color: white;"></i>
                </div>
                <h3 class="mt-3" style="color: var(--nhs-dark-blue);">Patient Portal Login</h3>
                <p class="info-text">Enter your Patient ID to access your medical records</p>
            </div>
            
            <div class="mb-4">
                <label class="form-label">Patient ID</label>
                <input type="text" id="loginPatientId" class="form-control form-control-lg" 
                       placeholder="e.g., P001, P002, P004" required autofocus>
                <div class="form-text">Your unique patient identifier provided by your healthcare provider</div>
            </div>
            
            <button id="loginBtn" class="btn btn-nhs-primary w-100 py-3">
                <i class="bi bi-arrow-right-circle me-2"></i>Access Portal
            </button>
            
            <div id="loginMessage" class="mt-3" style="min-height: 50px;"></div>
            
            <div class="mt-4 pt-3 border-top">
                <p class="small text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    If you don't know your Patient ID, please contact your GP surgery
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add login event listener
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('loginPatientId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Add CSS for login overlay
    const style = document.createElement('style');
    style.textContent = `
        .login-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a2452 0%, #2D3765 100%);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 0.5s ease;
        }
        
        .login-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 3rem;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: fadeIn 0.5s ease;
        }
        
        .login-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--nhs-aqua), #5bc0c5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .login-overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// Handle login
async function handleLogin() {
    const loginPatientId = document.getElementById('loginPatientId').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');
    
    if (!loginPatientId) {
        showLoginMessage('Please enter your Patient ID', 'warning');
        return;
    }
    
    // Disable button and show loading state
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';
    loginBtn.disabled = true;
    
    try {
        // Use the mock function from api.js
        const patientData = await getPatientInfo(loginPatientId);
        
        // For mock data, check if we got a valid response
        if (!patientData || patientData.name === 'Unknown Patient') {
            showLoginMessage('Invalid Patient ID. Please check and try again.', 'danger');
        } else {
            // Login successful - store patient ID in session
            sessionStorage.setItem('patientId', loginPatientId);
            sessionStorage.setItem('patientName', patientData.name || 'Patient');
            sessionStorage.setItem('gpName', patientData.gpName || 'Dr. Smith');
            
            // Hide login overlay
            document.getElementById('loginOverlay').classList.add('hidden');
            
            // Initialize portal with patient data
            initializePortal(loginPatientId);
            
            // Show welcome message
            setTimeout(() => {
                showMessage(`Welcome back, ${patientData.name || 'Patient'}!`, 'success');
            }, 500);
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage('Unable to verify Patient ID. Please try again.', 'danger');
    } finally {
        // Reset button
        loginBtn.innerHTML = '<i class="bi bi-arrow-right-circle me-2"></i>Access Portal';
        loginBtn.disabled = false;
    }
}

function showLoginMessage(message, type) {
    const loginMessage = document.getElementById('loginMessage');
    loginMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Initialize portal after login
function initializePortal(patientId) {
    // Set patient ID in the main input
    const patientIdInput = document.getElementById('patientId');
    patientIdInput.value = patientId;
    patientIdInput.disabled = true; // Disable editing after login
    
    // Update patient info display
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    patientIdDisplay.textContent = `Patient ID: ${patientId}`;
    patientIdDisplay.style.color = 'var(--nhs-dark-blue)';
    
    // Update patient name
    const patientName = sessionStorage.getItem('patientName');
    const gpName = sessionStorage.getItem('gpName');
    document.getElementById('patientName').textContent = `Welcome, ${patientName}`;
    document.getElementById('gpNameBadge').textContent = `GP: ${gpName}`;
    
    // Load initial data
    loadRecords();
    loadPatientData();
    
    // Remove logout button if it exists, then add it
    const existingLogoutBtn = document.getElementById('logoutBtn');
    if (existingLogoutBtn) {
        existingLogoutBtn.remove();
    }
    
    // Add logout button to navbar
    addLogoutButton();
}

// Add logout button to navbar
function addLogoutButton() {
    const navbarContainer = document.querySelector('.navbar-container');
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'btn btn-sm btn-outline-light ms-3';
    logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i>Logout';
    logoutBtn.addEventListener('click', handleLogout);
    
    // Insert before patient info
    const patientInfo = document.querySelector('.patient-info');
    navbarContainer.insertBefore(logoutBtn, patientInfo);
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session storage
        sessionStorage.clear();
        
        // Reset form
        const patientIdInput = document.getElementById('patientId');
        patientIdInput.value = '';
        patientIdInput.disabled = false;
        
        // Reset displays
        document.getElementById('patientIdDisplay').textContent = 'Patient ID: Not entered';
        document.getElementById('patientName').textContent = 'Welcome';
        document.getElementById('gpNameBadge').textContent = 'GP: Dr. Smith';
        
        // Clear records and messages
        document.getElementById('recordsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-file-earmark-medical"></i>
                </div>
                <h5>No Patient ID entered</h5>
                <p class="info-text">Enter your Patient ID to view your records</p>
            </div>`;
        
        document.getElementById('recordCount').textContent = '0 records';
        
        // Remove logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.remove();
        }
        
        // Show login overlay
        const loginOverlay = document.getElementById('loginOverlay');
        loginOverlay.classList.remove('hidden');
        document.getElementById('loginPatientId').value = '';
        document.getElementById('loginPatientId').focus();
        
        showMessage('You have been logged out successfully.', 'info');
    }
}

// Check for existing session on page load
function checkExistingSession() {
    const patientId = sessionStorage.getItem('patientId');
    if (patientId) {
        // User is already logged in
        initializePortal(patientId);
        // Hide login overlay immediately
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlay.classList.add('hidden');
        }
    } else {
        // User needs to login
        createLoginOverlay();
    }
}

// ============================================
// EXISTING PATIENT.JS CODE (MODIFIED)
// ============================================

const uploadForm = document.getElementById("uploadForm");
const patientId = document.getElementById("patientId");
const fileInput = document.getElementById("fileInput");
const refreshBtn = document.getElementById("refreshBtn");
const recordsList = document.getElementById("recordsList");
const msg = document.getElementById("msg");
const progressBar = document.querySelector(".progress");
const bar = progressBar.querySelector(".progress-bar");
const uploadNote = document.getElementById("uploadNote");
const fileThumbnails = document.getElementById("fileThumbnails");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messagesContainer = document.getElementById("messagesContainer");

// View management
let currentView = 'upload';

// Modified: Check for session before allowing actions
function requireLogin() {
    if (!sessionStorage.getItem('patientId')) {
        showMessage('Please login first', 'warning');
        return false;
    }
    return true;
}

// Modified Event Listeners
uploadForm.addEventListener("submit", function(e) {
    if (!requireLogin()) {
        e.preventDefault();
        return;
    }
    handleUpload(e);
});

refreshBtn.addEventListener("click", function() {
    if (!requireLogin()) return;
    loadRecords();
});

// Modified: Load data only if logged in
patientId.addEventListener("input", function() {
    if (!requireLogin()) return;
    loadRecords();
    loadPatientData();
});

// Modified: Enter key support - check login first
patientId.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (!requireLogin()) return;
        loadRecords();
        loadPatientData();
    }
});

// Modified message functionality
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!requireLogin()) return;
        sendMessage();
    }
});

sendMessageBtn.addEventListener('click', function() {
    if (!requireLogin()) return;
    sendMessage();
});

// File input click through upload area
document.getElementById('uploadArea').addEventListener('click', () => {
    if (!requireLogin()) return;
    fileInput.click();
});

// File selection handler
fileInput.addEventListener('change', updateFileThumbnails);

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');
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
    
    if (!requireLogin()) return;
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileThumbnails();
    }
});

function updateFileThumbnails() {
    fileThumbnails.innerHTML = '';
    if (fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach((file, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'upload-thumbnail';
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    thumbnail.innerHTML = `
                        <img src="${e.target.result}" class="thumbnail-img" alt="${file.name}">
                        <div class="thumbnail-remove" data-index="${index}">×</div>
                    `;
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                thumbnail.innerHTML = `
                    <div class="thumbnail-img bg-light d-flex align-items-center justify-content-center">
                        <i class="bi bi-file-earmark-play-fill fs-4 text-muted"></i>
                    </div>
                    <div class="thumbnail-remove" data-index="${index}">×</div>
                `;
            } else {
                thumbnail.innerHTML = `
                    <div class="thumbnail-img bg-light d-flex align-items-center justify-content-center">
                        <i class="bi bi-file-earmark-text-fill fs-4 text-muted"></i>
                    </div>
                    <div class="thumbnail-remove" data-index="${index}">×</div>
                `;
            }
            
            fileThumbnails.appendChild(thumbnail);
        });
        
        // Add remove functionality
        document.querySelectorAll('.thumbnail-remove').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                const dt = new DataTransfer();
                const files = Array.from(fileInput.files);
                files.splice(index, 1);
                files.forEach(file => dt.items.add(file));
                fileInput.files = dt.files;
                updateFileThumbnails();
            });
        });
    }
}

// -------------------------------
// Handle file upload (modified)
// -------------------------------
async function handleUpload(e) {
    e.preventDefault();
    
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) {
        showMessage("Please login first", "warning");
        return;
    }
    
    const note = uploadNote.value.trim();
    const files = fileInput.files;
    
    if (files.length === 0) {
        showMessage("Please select at least one file to upload", "warning");
        return;
    }
    
    // Validate files
    for (let file of files) {
        // Validate file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
            showMessage(`File "${file.name}" exceeds 20MB limit`, "danger");
            return;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mov', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            showMessage(`File "${file.name}" has unsupported format`, "danger");
            return;
        }
    }
    
    showMessage("Uploading...", "info");
    progressBar.style.display = "block";
    bar.style.width = "0%";
    
    try {
        let successCount = 0;
        const totalFiles = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fd = new FormData();
            fd.append("patientId", patientIdFromSession);
            fd.append("file", file);
            if (note) fd.append("note", note);
            
            await uploadFile(fd, i + 1, totalFiles);
            successCount++;
        }
        
        progressBar.style.display = "none";
        
        if (successCount === totalFiles) {
            showMessage(`${successCount} file(s) uploaded successfully!`, "success");
            
            // Reset form
            fileInput.value = "";
            uploadNote.value = "";
            fileThumbnails.innerHTML = "";
            
            // Refresh records and patient data
            await loadRecords();
            await loadPatientData();
            
            // Switch to records view
            switchView('records');
            
        } else {
            showMessage(`${successCount} of ${totalFiles} files uploaded. Some files failed.`, "warning");
        }
        
    } catch (error) {
        console.error("Upload error:", error);
        progressBar.style.display = "none";
        showMessage("Upload failed", "danger");
    }
}

async function uploadFile(formData, current, total) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const filePercent = (e.loaded / e.total) * 100;
                const overallPercent = ((current - 1) * 100 + filePercent) / total;
                bar.style.width = `${overallPercent}%`;
            }
        };
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || "Upload failed"));
            }
        };
        
        xhr.onerror = () => {
            reject(new Error("Network error during upload"));
        };
        
        xhr.open("POST", `${API_BASE}/upload`);
        xhr.send(formData);
    });
}

// -------------------------------
// Load patient data (modified)
// -------------------------------
async function loadPatientData() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) return;
    
    try {
        // Use the mock function from api.js
        const data = await getPatientInfo(patientIdFromSession);
        if (data.name) {
            document.getElementById('patientName').textContent = `Welcome, ${data.name}`;
            sessionStorage.setItem('patientName', data.name);
        }
        if (data.gpName) {
            document.getElementById('gpNameBadge').textContent = `GP: ${data.gpName}`;
            sessionStorage.setItem('gpName', data.gpName);
        }
        
        // Update notification badges
        const unreadCount = data.unreadMessages || 0;
        document.getElementById('unreadBadge').textContent = unreadCount;
        
        if (unreadCount > 0) {
            document.getElementById('notificationCount').textContent = unreadCount;
            document.getElementById('notificationCount').style.display = 'block';
        } else {
            document.getElementById('notificationCount').style.display = 'none';
        }
        
        // Enable message input if patient ID is valid
        messageInput.disabled = false;
        sendMessageBtn.disabled = false;
        
    } catch (error) {
        console.error('Error loading patient data:', error);
        messageInput.disabled = true;
        sendMessageBtn.disabled = true;
    }
}

// -------------------------------
// Send message to GP (modified)
// -------------------------------
async function sendMessage() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    const content = messageInput.value.trim();
    
    if (!patientIdFromSession) {
        showMessage("Please login first", "warning");
        return;
    }
    
    if (!content) {
        showMessage("Please enter a message", "warning");
        return;
    }
    
    try {
        // Use the mock function from api.js
        const response = await sendMessage(patientIdFromSession, content, 'patient');
        
        if (response.success) {
            // Add message to UI immediately
            addMessageToUI({
                content: content,
                sender: 'patient',
                timestamp: new Date().toISOString(),
                unread: false
            });
            
            // Clear input
            messageInput.value = '';
            
            // Show success message
            showMessage("Message sent successfully", "success");
            
        } else {
            showMessage("Failed to send message", "danger");
        }
        
    } catch (error) {
        console.error("Error sending message:", error);
        showMessage("Error sending message", "danger");
    }
}

// -------------------------------
// Load messages (modified)
// -------------------------------
async function loadMessages() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) return;
    
    try {
        // Use the mock function from api.js
        const data = await getMessages(patientIdFromSession);
        displayMessages(data.messages || []);
        
        // Mark messages as read using mock function
        if (data.messages && data.messages.some(m => m.unread)) {
            await markMessagesAsRead(patientIdFromSession);
            updateNotificationBadge();
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-chat-left-text"></i>
                </div>
                <h5>No messages yet</h5>
                <p class="info-text">Your GP will message you here about your records</p>
            </div>`;
        return;
    }
    
    messagesContainer.innerHTML = '';
    messages.forEach(msg => {
        addMessageToUI(msg);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToUI(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.sender === 'patient' ? 'message-patient' : 'message-gp'} ${msg.unread ? 'unread-message' : ''}`;
    
    let fileHtml = '';
    if (msg.fileUrl) {
        fileHtml = `
            <div class="message-file">
                <i class="bi bi-paperclip"></i>
                <a href="${msg.fileUrl}" target="_blank" class="small">${msg.fileName || 'Attachment'}</a>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${msg.sender === 'patient' ? 'You' : 'GP'}</span>
            <span class="message-time">${new Date(msg.timestamp).toLocaleString()}</span>
        </div>
        <div class="message-content">${msg.content}</div>
        ${fileHtml}
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// -------------------------------
// Load patient records (modified)
// -------------------------------
async function loadRecords() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    
    if (!patientIdFromSession) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-file-earmark-medical"></i>
                </div>
                <h5>Please login to view records</h5>
                <p class="info-text">Enter your Patient ID in the login screen</p>
            </div>`;
        document.getElementById("recordCount").textContent = "0 records";
        return;
    }
    
    try {
        const data = await apiGet(`/records?patientId=${patientIdFromSession}`);
        
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
        const isVideo = rec.contentType && rec.contentType.startsWith("video/");
        
        let preview;
        if (isImage) {
            preview = `<img src="${API_BASE}/media/${path}" class="preview-img" onerror="this.onerror=null;this.src='img/file-icon.png'" alt="preview">`;
        } else if (isVideo) {
            preview = `
                <div class="preview-img video-thumbnail" data-video-url="${API_BASE}/media/${path}">
                    <div class="preview-img bg-dark d-flex align-items-center justify-content-center">
                        <i class="bi bi-play-circle-fill fs-3 text-white"></i>
                    </div>
                    <div class="video-play-btn">
                        <i class="bi bi-play-fill"></i>
                    </div>
                </div>`;
        } else {
            preview = `<div class="preview-img bg-light d-flex align-items-center justify-content-center">
                <i class="bi bi-file-earmark-text fs-3 text-muted"></i>
            </div>`;
        }
        
        const card = document.createElement("div");
        card.className = "record-card";
        card.innerHTML = `
            <div class="d-flex align-items-start">
                ${preview}
                <div class="ms-3 flex-grow-1">
                    <div class="record-card-header">
                        <div>
                            <strong class="d-block">${rec.originalName || 'Unnamed file'}</strong>
                            <div class="small text-muted mt-1">
                                <i class="bi bi-calendar me-1"></i>${formatDate(rec.createdAt)}
                                ${rec.note ? `<br><i class="bi bi-chat-left me-1"></i>${rec.note}` : ''}
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
                    
                    <div class="record-card-actions mt-3">
                        <a href="${API_BASE}/media/${path}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-eye me-1"></i>View
                        </a>
                        <button class="btn btn-sm btn-outline-secondary copy-url-btn" data-url="${API_BASE}/media/${path}">
                            <i class="bi bi-link me-1"></i>Copy Link
                        </button>
                        ${isVideo ? `
                            <button class="btn btn-sm btn-outline-info video-preview-btn" data-video-url="${API_BASE}/media/${path}">
                                <i class="bi bi-play-circle me-1"></i>Preview
                            </button>
                        ` : ''}
                    </div>
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
    
    // Add video preview functionality
    document.querySelectorAll('.video-preview-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-video-url');
            const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
            const videoPlayer = document.getElementById('videoPlayer');
            videoPlayer.src = videoUrl;
            videoModal.show();
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
            <button class="btn btn-nhs-primary mt-3" onclick="switchView('upload')">
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

function switchView(view) {
    if (view === currentView) return;
    
    currentView = view;
    
    // Update UI based on view
    const panels = ['uploadPanel', 'messagesPanel', 'recordsPanel', 'appointmentsPanel'];
    panels.forEach(panel => {
        document.getElementById(panel).style.display = 'none';
    });
    
    // Update button states
    const buttons = ['btnUpload', 'btnMessages', 'btnRecords', 'btnAppointments'];
    buttons.forEach(btn => {
        document.getElementById(btn).classList.remove('active');
    });
    
    switch(view) {
        case 'upload':
            document.getElementById('uploadPanel').style.display = 'block';
            document.getElementById('btnUpload').classList.add('active');
            break;
        case 'messages':
            document.getElementById('messagesPanel').style.display = 'block';
            document.getElementById('btnMessages').classList.add('active');
            loadMessages();
            break;
        case 'records':
            document.getElementById('recordsPanel').style.display = 'block';
            document.getElementById('btnRecords').classList.add('active');
            loadRecords();
            break;
        case 'appointments':
            document.getElementById('appointmentsPanel').style.display = 'block';
            document.getElementById('btnAppointments').classList.add('active');
            loadAppointments();
            break;
    }
}

async function loadAppointments() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) return;
    
    try {
        // Use the mock function from api.js
        const data = await getAppointments(patientIdFromSession);
        displayAppointments(data.appointments || []);
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-calendar"></i>
                </div>
                <h5>No upcoming appointments</h5>
                <p class="info-text">Request an appointment with your GP</p>
                <button class="btn btn-nhs-primary mt-3" id="requestAppointmentBtn">
                    <i class="bi bi-plus-circle me-2"></i>Request Appointment
                </button>
            </div>`;
        
        // Re-add event listener for the button
        document.getElementById('requestAppointmentBtn').addEventListener('click', requestAppointment);
        return;
    }
    
    container.innerHTML = '';
    appointments.forEach(appt => {
        const apptDiv = document.createElement('div');
        apptDiv.className = 'record-card';
        apptDiv.innerHTML = `
            <div class="record-card-header">
                <div>
                    <strong>${appt.type} Appointment</strong>
                    <div class="small text-muted mt-1">
                        <i class="bi bi-calendar me-1"></i>${new Date(appt.date).toLocaleDateString()}
                        <i class="bi bi-clock ms-2 me-1"></i>${appt.time}
                    </div>
                </div>
                <span class="status-badge status-${appt.status}">${appt.status}</span>
            </div>
            ${appt.notes ? `<p class="mb-2">${appt.notes}</p>` : ''}
            <div class="record-card-actions mt-3">
                ${appt.videoLink ? `
                    <a href="${appt.videoLink}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                        <i class="bi bi-camera-video me-1"></i>Join Video Call
                    </a>
                ` : ''}
                <button class="btn btn-sm btn-outline-secondary me-2 cancel-appointment-btn" data-id="${appt.id}">
                    <i class="bi bi-calendar-x me-1"></i>Cancel
                </button>
                <button class="btn btn-sm btn-outline-primary reschedule-appointment-btn" data-id="${appt.id}">
                    <i class="bi bi-clock-history me-1"></i>Reschedule
                </button>
            </div>
        `;
        container.appendChild(apptDiv);
    });
    
    // Add appointment action listeners
    document.querySelectorAll('.cancel-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            cancelAppointment(appointmentId);
        });
    });
    
    document.querySelectorAll('.reschedule-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            rescheduleAppointment(appointmentId);
        });
    });
}

async function requestAppointment() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) {
        showMessage("Please login first", "warning");
        return;
    }
    
    // Use the mock function from api.js
    showMessage("Appointment request feature coming soon!", "info");
}

async function cancelAppointment(appointmentId) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
        // Use the mock function from api.js
        const response = await cancelAppointment(appointmentId);
        if (response.success) {
            showMessage("Appointment cancelled successfully", "success");
            loadAppointments();
        }
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        showMessage("Failed to cancel appointment", "danger");
    }
}

async function rescheduleAppointment(appointmentId) {
    showMessage("Reschedule feature coming soon!", "info");
}

async function updateNotificationBadge() {
    const patientIdFromSession = sessionStorage.getItem('patientId');
    if (!patientIdFromSession) return;
    
    try {
        // Use the mock function from api.js
        const data = await getPatientInfo(patientIdFromSession);
        const unreadCount = data.unreadMessages || 0;
        document.getElementById('unreadBadge').textContent = unreadCount;
        document.getElementById('notificationCount').textContent = unreadCount;
        document.getElementById('notificationCount').style.display = unreadCount > 0 ? 'block' : 'none';
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Modified: Check for existing session on page load
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    
    // Initialize view switching - only if logged in
    document.getElementById('btnUpload').addEventListener('click', () => {
        if (!requireLogin()) return;
        switchView('upload');
    });
    
    document.getElementById('btnMessages').addEventListener('click', () => {
        if (!requireLogin()) return;
        switchView('messages');
    });
    
    document.getElementById('btnRecords').addEventListener('click', () => {
        if (!requireLogin()) return;
        switchView('records');
    });
    
    document.getElementById('btnAppointments').addEventListener('click', () => {
        if (!requireLogin()) return;
        switchView('appointments');
    });
});