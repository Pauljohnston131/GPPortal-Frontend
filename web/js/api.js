// api.js - Match your actual Flask backend endpoints
const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://gpportal-api-hmd0bjameudkarc5.uksouth-01.azurewebsites.net"
  : "http://127.0.0.1:8000";

console.log('API Base URL:', API_BASE);

// Reusable API helpers
async function apiGet(path) {
    try {
        console.log(`GET: ${API_BASE}${path}`);
        const response = await fetch(`${API_BASE}${path}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API GET Error:', error);
        throw error;
    }
}

async function apiPost(path, body) {
    try {
        console.log(`POST: ${API_BASE}${path}`);
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            body
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API POST Error:', error);
        throw error;
    }
}

async function apiPostJSON(path, jsonData) {
    try {
        console.log(`POST JSON: ${API_BASE}${path}`, jsonData);
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(jsonData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API POST JSON Error:', error);
        throw error;
    }
}

async function apiPut(path, json) {
    try {
        console.log(`PUT: ${API_BASE}${path}`, json);
        const response = await fetch(`${API_BASE}${path}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(json)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API PUT Error:', error);
        throw error;
    }
}

async function apiDelete(path) {
    try {
        console.log(`DELETE: ${API_BASE}${path}`);
        const response = await fetch(`${API_BASE}${path}`, { 
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API DELETE Error:', error);
        throw error;
    }
}

// File upload with progress tracking
async function apiUploadFile(path, formData, onProgress = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        if (onProgress && typeof onProgress === 'function') {
            xhr.upload.onprogress = onProgress;
        }
        
        xhr.onload = () => {
            console.log(`Upload response: ${xhr.status}`, xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    console.error('Error parsing upload response:', e);
                    reject(new Error('Invalid response from server'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || `Upload failed: ${xhr.statusText}`));
                } catch (e) {
                    reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                }
            }
        };
        
        xhr.onerror = () => {
            reject(new Error('Network error during upload'));
        };
        
        xhr.ontimeout = () => {
            reject(new Error('Upload timeout'));
        };
        
        xhr.open('POST', `${API_BASE}${path}`);
        xhr.timeout = 300000; // 5 minute timeout
        xhr.send(formData);
    });
}

// SPECIFIC ENDPOINTS - MATCHING YOUR FLASK APP.PY
// ----------------------------------------------------------
// 1. Check if patient exists - use /records endpoint
async function getPatientInfo(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    
    try {
        // Use the /records endpoint to check if patient exists
        const response = await apiGet(`/records?patientId=${patientId}`);
        
        // If successful, patient exists (even if no records yet)
        return {
            name: `Patient ${patientId}`,
            gpName: 'Your GP',
            unreadMessages: 0,
            recordsCount: response.count || 0
        };
    } catch (error) {
        // If 404, patient doesn't exist or no records
        throw new Error('Patient not found or no records exist');
    }
}

// 2. Get patient records - EXACTLY MATCHES YOUR FLASK ENDPOINT
async function getPatientRecords(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiGet(`/records?patientId=${patientId}`);
}

// 3. Upload medical evidence - EXACTLY MATCHES YOUR FLASK ENDPOINT
async function uploadMedicalEvidence(formData, onProgress = null) {
    return apiUploadFile('/upload', formData, onProgress);
}

// 4. Get single record - MATCHES YOUR FLASK ENDPOINT
async function getRecord(recordId) {
    return apiGet(`/record/${recordId}`);
}

// 5. Update record (GP notes, status) - MATCHES YOUR FLASK ENDPOINT
async function updateRecord(recordId, updates) {
    return apiPut(`/record/${recordId}`, updates);
}

// 6. Delete record - MATCHES YOUR FLASK ENDPOINT
async function deleteRecord(recordId) {
    return apiDelete(`/record/${recordId}`);
}

// 7. Search patients - MATCHES YOUR FLASK ENDPOINT
async function searchPatients(query) {
    return apiGet(`/search/patients?query=${query}`);
}

// 8. Health check - MATCHES YOUR FLASK ENDPOINT
async function checkHealth() {
    return apiGet('/health');
}

// 9. Media URL - MATCHES YOUR FLASK ENDPOINT
function getMediaUrl(blobPath) {
    return `${API_BASE}/media/${blobPath}`;
}

// TEMPORARY MOCK FUNCTIONS - Remove these when you implement these features
// Your Flask app doesn't have these endpoints yet
async function getMessages(patientId) {
    console.log(`[MOCK] Getting messages for ${patientId}`);
    // Mock until you implement messages in backend
    return {
        messages: []
    };
}

async function sendMessage(patientId, content, sender = 'patient') {
    console.log(`[MOCK] Sending message for ${patientId}`);
    // Mock until you implement messages in backend
    return { success: true };
}

async function getAppointments(patientId) {
    console.log(`[MOCK] Getting appointments for ${patientId}`);
    // Mock until you implement appointments in backend
    return {
        appointments: []
    };
}

async function cancelAppointment(appointmentId) {
    console.log(`[MOCK] Cancelling appointment ${appointmentId}`);
    // Mock until you implement appointments in backend
    return { success: true };
}

async function requestAppointment(patientId, appointmentData) {
    console.log(`[MOCK] Requesting appointment for ${patientId}`);
    // Mock until you implement appointments in backend
    return { success: true };
}

// Expose all functions globally
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.apiPostJSON = apiPostJSON;
window.apiUploadFile = apiUploadFile;

// Core functions that match your Flask endpoints
window.getPatientInfo = getPatientInfo;
window.getPatientRecords = getPatientRecords;
window.uploadMedicalEvidence = uploadMedicalEvidence;
window.getRecord = getRecord;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.searchPatients = searchPatients;
window.checkHealth = checkHealth;
window.getMediaUrl = getMediaUrl;

// Mock functions (temporary - remove when backend implements these)
window.getMessages = getMessages;
window.sendMessage = sendMessage;
window.getAppointments = getAppointments;
window.cancelAppointment = cancelAppointment;
window.requestAppointment = requestAppointment;

console.log('API functions loaded - Matched to Flask endpoints');