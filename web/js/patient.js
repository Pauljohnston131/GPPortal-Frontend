// patient.js - Real implementation
// Constants
const API_BASE = window.location.hostname.includes("azurewebsites.net")
    ? "https://gpportal-api-hmd0bjameudkarc5.uksouth-01.azurewebsites.net"
    : "http://127.0.0.1:8000";

// Set current date on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Initialize the application
    initPatientPortal();
});

function initPatientPortal() {
    // DOM Elements
    const patientIdInput = document.getElementById('patientId');
    const patientIdSubmitBtn = document.getElementById('patientIdSubmitBtn');
    const patientIdEntry = document.getElementById('patientIdEntry');
    const patientInfoBar = document.getElementById('patientInfoBar');
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    const changePatientBtn = document.getElementById('changePatientBtn');
    const communicationActions = document.getElementById('communicationActions');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const checkMessagesBtn = document.getElementById('checkMessagesBtn');
    const fileThumbnails = document.getElementById('fileThumbnails');
    const uploadForm = document.getElementById('uploadForm');
    const msg = document.getElementById('msg');
    const progressBarElement = document.querySelector('.progress');
    const progressBarFill = progressBarElement ? progressBarElement.querySelector('.progress-bar') : null;
    const uploadNote = document.getElementById('uploadNote');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const recordsList = document.getElementById('recordsList');
    
    // View switching elements
    const btnUpload = document.getElementById('btnUpload');
    const btnMessages = document.getElementById('btnMessages');
    const btnRecords = document.getElementById('btnRecords');
    const btnAppointments = document.getElementById('btnAppointments');
    
    const uploadPanel = document.getElementById('uploadPanel');
    const messagesPanel = document.getElementById('messagesPanel');
    const recordsPanel = document.getElementById('recordsPanel');
    const appointmentsPanel = document.getElementById('appointmentsPanel');
    
    // State variables
    let currentPatientId = '';
    let currentView = 'upload';
    
    // Event Listeners
    function setupEventListeners() {
        // Patient ID submission
        patientIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitPatientId();
        });
        
        patientIdSubmitBtn.addEventListener('click', submitPatientId);
        
        // Change patient
        changePatientBtn.addEventListener('click', resetPatient);
        
        // File upload
        uploadArea.addEventListener('click', function() {
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                return;
            }
            fileInput.click();
        });
        
        fileInput.addEventListener('change', updateFileThumbnails);
        
        // Drag and drop
        setupDragAndDrop();
        
        // View switching
        btnUpload.addEventListener('click', () => {
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                return;
            }
            switchView('upload');
        });
        
        btnMessages.addEventListener('click', () => {
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                return;
            }
            switchView('messages');
            loadMessages();
        });
        
        btnRecords.addEventListener('click', () => {
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                return;
            }
            switchView('records');
            loadRecords();
        });
        
        btnAppointments.addEventListener('click', () => {
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                return;
            }
            switchView('appointments');
            loadAppointments();
        });
        
        // Messages
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendPatientMessage();
            }
        });
        
        sendMessageBtn.addEventListener('click', sendPatientMessage);
        
        // Refresh
        refreshBtn.addEventListener('click', refreshData);
        
        // Check messages
        checkMessagesBtn.addEventListener('click', () => {
            switchView('messages');
            loadMessages();
        });
        
        // Form submission
        uploadForm.addEventListener('submit', handleUploadSubmit);
        
        // Check for patient ID in URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const storedPatientId = localStorage.getItem('patientId') || urlParams.get('patientId');
        
        if (storedPatientId) {
            patientIdInput.value = storedPatientId;
            // Auto-load after a short delay to ensure DOM is ready
            setTimeout(() => submitPatientId(), 100);
        }
        
        // Auto-focus patient ID input
        patientIdInput.focus();
    }
    
    // Setup drag and drop
    function setupDragAndDrop() {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="bi bi-cloud-check-fill"></i>
                </div>
                <h5>Drop files to upload</h5>
                <p class="info-text">Release to upload your files</p>
            `;
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
            resetUploadArea();
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (!currentPatientId) {
                showAlert('Please enter your Patient ID first', 'warning');
                resetUploadArea();
                return;
            }
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileThumbnails();
                resetUploadArea();
            }
        });
    }
    
    function resetUploadArea() {
        uploadArea.innerHTML = `
            <input type="file" id="fileInput" class="d-none" accept="image/*,application/pdf,video/*" multiple required>
            <div class="upload-icon">
                <i class="bi bi-cloud-arrow-up-fill"></i>
            </div>
            <h5>Upload your files</h5>
            <p class="info-text">Click to browse or drag and drop files here</p>
            <p class="info-text">Supported formats: JPG, PNG, PDF, MP4, MOV (Max 20MB each)</p>
            <div id="selectedFileName" class="mt-3 fw-bold text-primary" style="display: none;"></div>
        `;
        // Reattach event listeners
        const newFileInput = uploadArea.querySelector('#fileInput');
        newFileInput.addEventListener('change', updateFileThumbnails);
        fileInput = newFileInput;
    }
    
    // Core Functions
    async function submitPatientId() {
        const pid = patientIdInput.value.trim();
        
        if (!pid) {
            showAlert('Please enter a Patient ID', 'warning');
            return;
        }
        
        // Show loading state
        patientIdSubmitBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Loading...';
        patientIdSubmitBtn.disabled = true;
        
        try {
            console.log('Loading patient data for ID:', pid);
            
            // Load patient data
            const patientData = await getPatientInfo(pid);
            console.log('Patient data loaded:', patientData);
            
            // Store current patient ID
            currentPatientId = pid;
            localStorage.setItem('patientId', pid);
            
            // Update UI
            updatePatientUI(patientData, pid);
            
            // Show portal sections
            patientIdEntry.style.display = 'none';
            patientInfoBar.style.display = 'flex';
            communicationActions.style.display = 'flex';
            
            // Switch to upload view
            switchView('upload');
            
            // Load initial data
            await loadRecords();
            
            showAlert(`Welcome back! Patient ID ${pid} loaded successfully.`, 'success');
            
        } catch (error) {
            console.error('Error loading patient data:', error);
            showAlert('Invalid Patient ID or unable to load patient data. Please try again.', 'danger');
        } finally {
            // Reset button state
            patientIdSubmitBtn.innerHTML = '<i class="bi bi-arrow-right-circle me-2"></i>Access Portal';
            patientIdSubmitBtn.disabled = false;
        }
    }
    
    function updatePatientUI(patientData, pid) {
        patientIdDisplay.textContent = `Patient ID: ${pid}`;
        
        if (patientData.name) {
            document.getElementById('patientName').textContent = `Welcome, ${patientData.name}`;
        }
        
        if (patientData.gpName) {
            document.getElementById('gpNameBadge').textContent = `GP: ${patientData.gpName}`;
        }
        
        // Update notification badges
        const unreadCount = patientData.unreadMessages || 0;
        document.getElementById('unreadBadge').textContent = unreadCount;
        document.getElementById('notificationCount').textContent = unreadCount;
        document.getElementById('notificationCount').style.display = unreadCount > 0 ? 'block' : 'none';
        
        // Enable message input
        messageInput.disabled = false;
        sendMessageBtn.disabled = false;
    }
    
    function resetPatient() {
        // Reset to patient ID entry
        patientInfoBar.style.display = 'none';
        communicationActions.style.display = 'none';
        patientIdEntry.style.display = 'block';
        
        // Clear patient ID
        currentPatientId = '';
        localStorage.removeItem('patientId');
        patientIdInput.value = '';
        patientIdInput.focus();
        
        // Reset patient info
        document.getElementById('patientName').textContent = 'Welcome';
        document.getElementById('notificationCount').style.display = 'none';
        
        // Reset all panels
        switchView('upload');
        
        // Clear any loaded data
        displayEmptyState();
        
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-chat-left-text"></i>
                </div>
                <h5>No messages yet</h5>
                <p class="info-text">Your GP will message you here about your records</p>
            </div>`;
    }
    
    function switchView(view) {
        if (view === currentView) return;
        
        currentView = view;
        
        // Hide all panels
        uploadPanel.style.display = 'none';
        messagesPanel.style.display = 'none';
        recordsPanel.style.display = 'none';
        appointmentsPanel.style.display = 'none';
        
        // Remove active class from all buttons
        btnUpload.classList.remove('active');
        btnMessages.classList.remove('active');
        btnRecords.classList.remove('active');
        btnAppointments.classList.remove('active');
        
        // Show selected panel and activate button
        switch(view) {
            case 'upload':
                uploadPanel.style.display = 'block';
                btnUpload.classList.add('active');
                break;
            case 'messages':
                messagesPanel.style.display = 'block';
                btnMessages.classList.add('active');
                break;
            case 'records':
                recordsPanel.style.display = 'block';
                btnRecords.classList.add('active');
                break;
            case 'appointments':
                appointmentsPanel.style.display = 'block';
                btnAppointments.classList.add('active');
                break;
        }
    }
    
    async function refreshData() {
        if (!currentPatientId) return;
        
        try {
            // Reload patient data
            const patientData = await getPatientInfo(currentPatientId);
            updatePatientUI(patientData, currentPatientId);
            
            // Reload current view data
            switch(currentView) {
                case 'messages':
                    await loadMessages();
                    break;
                case 'records':
                    await loadRecords();
                    break;
                case 'appointments':
                    await loadAppointments();
                    break;
            }
            
            showAlert('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            showAlert('Failed to refresh data', 'warning');
        }
    }
    
    // File Upload Functions
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
    
    async function handleUploadSubmit(e) {
        e.preventDefault();
        
        if (!currentPatientId) {
            showAlert('Please enter your Patient ID first', 'warning');
            return;
        }
        
        const files = fileInput.files;
        const note = uploadNote.value.trim();
        
        if (files.length === 0) {
            showAlert('Please select at least one file to upload', 'warning');
            return;
        }
        
        // Validate files
        for (let file of files) {
            if (file.size > 20 * 1024 * 1024) {
                showAlert(`File "${file.name}" exceeds 20MB limit`, "danger");
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mov', 'video/quicktime'];
            if (!allowedTypes.includes(file.type)) {
                showAlert(`File "${file.name}" has unsupported format`, "danger");
                return;
            }
        }
        
        try {
            const formData = new FormData();
            formData.append('patientId', currentPatientId);
            
            // Append all files
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });
            
            if (note) {
                formData.append('note', note);
            }
            
            // Show progress
            if (progressBarElement && progressBarFill) {
                progressBarElement.style.display = 'block';
                progressBarFill.style.width = '0%';
                progressBarFill.textContent = '0%';
            }
            
            showMessage("Uploading...", "info");
            
            // Upload using API function
            const response = await uploadMedicalEvidence(formData, (e) => {
                if (e.lengthComputable && progressBarFill) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressBarFill.style.width = `${percentComplete}%`;
                    progressBarFill.textContent = `${percentComplete}%`;
                }
            });
            
            if (progressBarElement) {
                progressBarElement.style.display = 'none';
            }
            
            if (response.success) {
                showMessage(`${files.length} file(s) uploaded successfully!`, "success");
                
                // Reset form
                fileInput.value = '';
                uploadNote.value = '';
                fileThumbnails.innerHTML = '';
                
                // Refresh records
                await loadRecords();
                
                // Switch to records view
                switchView('records');
                
            } else {
                showMessage("Upload failed. Please try again.", "danger");
            }
            
        } catch (error) {
            console.error('Error uploading files:', error);
            if (progressBarElement) {
                progressBarElement.style.display = 'none';
            }
            showMessage(`Upload failed: ${error.message}`, "danger");
        }
    }
    
    // Records Functions
    async function loadRecords() {
        if (!currentPatientId) {
            displayEmptyState();
            return;
        }
        
        try {
            const data = await getPatientRecords(currentPatientId);
            const records = data.records || data || [];
            
            // Update record count
            const count = Array.isArray(records) ? records.length : 0;
            document.getElementById("recordCount").textContent = `${count} record${count !== 1 ? 's' : ''}`;
            
            if (count === 0) {
                displayEmptyState();
                return;
            }
            
            renderRecords(records);
            
        } catch (error) {
            console.error('Error loading records:', error);
            showMessage("Error loading records. Please try again.", "danger");
            displayEmptyState();
        }
    }
    
    function displayEmptyState() {
        if (!recordsList) return;
        
        recordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-cloud-upload"></i>
                </div>
                <h5>No records found</h5>
                <p class="info-text">Upload files to see them here</p>
                <button class="btn btn-nhs-primary mt-3" onclick="switchToUploadView()">
                    <i class="bi bi-cloud-arrow-up me-2"></i>Upload Your First File
                </button>
            </div>`;
        if (document.getElementById("recordCount")) {
            document.getElementById("recordCount").textContent = "0 records";
        }
    }
    
    function renderRecords(records) {
        if (!recordsList) return;
        
        recordsList.innerHTML = "";
        
        // Sort by creation date (newest first)
        records.sort((a, b) => {
            const dateA = a.createdAt || a.uploadDate || 0;
            const dateB = b.createdAt || b.uploadDate || 0;
            return dateB - dateA;
        });
        
        records.forEach(rec => {
            const path = rec.blobName || rec.fileName || extractBlobName(rec.blobUrl || rec.url);
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
                                <strong class="d-block">${rec.originalName || rec.fileName || 'Unnamed file'}</strong>
                                <div class="small text-muted mt-1">
                                    <i class="bi bi-calendar me-1"></i>${formatDate(rec.createdAt || rec.uploadDate)}
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
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) {
                    videoPlayer.src = videoUrl;
                    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
                    videoModal.show();
                }
            });
        });
    }
    
    // Messages Functions
    async function loadMessages() {
        if (!currentPatientId) return;
        
        try {
            const data = await getMessages(currentPatientId);
            displayMessages(data.messages || []);
            
            // Mark messages as read
            if (data.messages && data.messages.some(m => m.unread)) {
                await markMessagesAsRead(currentPatientId);
                updateNotificationBadge();
            }
            
        } catch (error) {
            console.error('Error loading messages:', error);
            showMessage("Error loading messages", "danger");
        }
    }
    
    function displayMessages(messages) {
        if (!messagesContainer) return;
        
        if (!messages || messages.length === 0) {
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
        if (!messagesContainer) return;
        
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
                <span class="message-time">${formatDate(msg.timestamp || msg.createdAt)}</span>
            </div>
            <div class="message-content">${msg.content || ''}</div>
            ${fileHtml}
        `;
        
        messagesContainer.appendChild(messageDiv);
    }
    
    async function sendPatientMessage() {
        const content = messageInput.value.trim();
        
        if (!currentPatientId) {
            showAlert("Please enter Patient ID first", "warning");
            return;
        }
        
        if (!content) {
            showAlert("Please enter a message", "warning");
            return;
        }
        
        try {
            const response = await sendMessage(currentPatientId, content, 'patient');
            
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
                showAlert("Message sent successfully", "success");
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
            } else {
                showAlert("Failed to send message", "danger");
            }
            
        } catch (error) {
            console.error("Error sending message:", error);
            showAlert(`Error sending message: ${error.message}`, "danger");
        }
    }
    
    // Appointments Functions
    async function loadAppointments() {
        if (!currentPatientId) return;
        
        try {
            const data = await getAppointments(currentPatientId);
            displayAppointments(data.appointments || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
            showMessage("Error loading appointments", "danger");
        }
    }
    
    function displayAppointments(appointments) {
        const container = document.getElementById('appointmentsList');
        if (!container) return;
        
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="bi bi-calendar"></i>
                    </div>
                    <h5>No upcoming appointments</h5>
                    <p class="info-text">Request an appointment with your GP</p>
                    <button class="btn btn-nhs-primary mt-3" id="requestAppointmentBtnModal">
                        <i class="bi bi-plus-circle me-2"></i>Request Appointment
                    </button>
                </div>`;
            
            // Re-add event listener for the button
            document.getElementById('requestAppointmentBtnModal').addEventListener('click', requestAppointment);
            return;
        }
        
        container.innerHTML = '';
        appointments.forEach(appt => {
            const apptDiv = document.createElement('div');
            apptDiv.className = 'record-card';
            apptDiv.innerHTML = `
                <div class="record-card-header">
                    <div>
                        <strong>${appt.type || 'Appointment'}</strong>
                        <div class="small text-muted mt-1">
                            <i class="bi bi-calendar me-1"></i>${formatDate(appt.date || appt.appointmentDate)}
                            <i class="bi bi-clock ms-2 me-1"></i>${appt.time || appt.appointmentTime}
                        </div>
                    </div>
                    <span class="status-badge status-${appt.status || 'scheduled'}">${appt.status || 'Scheduled'}</span>
                </div>
                ${appt.notes ? `<p class="mb-2">${appt.notes}</p>` : ''}
                <div class="record-card-actions mt-3">
                    ${appt.videoLink ? `
                        <a href="${appt.videoLink}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-camera-video me-1"></i>Join Video Call
                        </a>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-secondary me-2 cancel-appointment-btn" data-id="${appt.id || appt._id}">
                        <i class="bi bi-calendar-x me-1"></i>Cancel
                    </button>
                    <button class="btn btn-sm btn-outline-primary reschedule-appointment-btn" data-id="${appt.id || appt._id}">
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
                cancelPatientAppointment(appointmentId);
            });
        });
        
        document.querySelectorAll('.reschedule-appointment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const appointmentId = this.getAttribute('data-id');
                reschedulePatientAppointment(appointmentId);
            });
        });
    }
    
    async function cancelPatientAppointment(appointmentId) {
        if (!confirm("Are you sure you want to cancel this appointment?")) return;
        
        try {
            const response = await cancelAppointment(appointmentId);
            if (response.success) {
                showAlert("Appointment cancelled successfully", "success");
                loadAppointments();
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            showAlert(`Failed to cancel appointment: ${error.message}`, "danger");
        }
    }
    
    function reschedulePatientAppointment(appointmentId) {
        showAlert("Reschedule feature coming soon!", "info");
    }
    
    async function requestAppointment() {
        if (!currentPatientId) {
            showAlert("Please enter Patient ID first", "warning");
            return;
        }
        
        // In a real implementation, this would open a form or modal
        const appointmentData = {
            type: "Follow-up",
            date: new Date().toISOString().split('T')[0],
            time: "10:00 AM",
            notes: "Requested via patient portal"
        };
        
        try {
            const response = await requestAppointment(currentPatientId, appointmentData);
            if (response.success) {
                showAlert("Appointment request submitted successfully!", "success");
                loadAppointments();
            }
        } catch (error) {
            console.error("Error requesting appointment:", error);
            showAlert(`Failed to request appointment: ${error.message}`, "danger");
        }
    }
    
    // Utility Functions
    async function updateNotificationBadge() {
        if (!currentPatientId) return;
        
        try {
            const data = await getPatientInfo(currentPatientId);
            const unreadCount = data.unreadMessages || 0;
            document.getElementById('unreadBadge').textContent = unreadCount;
            document.getElementById('notificationCount').textContent = unreadCount;
            document.getElementById('notificationCount').style.display = unreadCount > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Error updating notification badge:', error);
        }
    }
    
    function extractBlobName(blobUrl) {
        if (!blobUrl) return '';
        const parts = blobUrl.split('/');
        return parts[parts.length - 1];
    }
    
    function formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
        }
    }
    
    function formatStatus(status) {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
    
    function showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 1050; min-width: 300px; max-width: 400px;';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'danger' ? 'bi-exclamation-circle' : 'bi-info-circle'} me-2"></i>
                <div>${message}</div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    function showMessage(message, type = 'info') {
        if (!msg) return;
        
        msg.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'danger' ? 'bi-exclamation-circle' : 'bi-info-circle'} me-2"></i>
                    <div>${message}</div>
                    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const alert = msg.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Global function for switch view from HTML
    window.switchToUploadView = function() {
        if (currentPatientId) {
            switchView('upload');
        } else {
            showAlert('Please enter your Patient ID first', 'warning');
        }
    };
    
    // Initialize
    setupEventListeners();
    console.log('Patient portal initialized');
}