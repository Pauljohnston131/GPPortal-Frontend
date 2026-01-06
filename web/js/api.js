// api.js - Real implementation for Azure backend
const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://gpportal-api-hmd0bjameudkarc5.uksouth-01.azurewebsites.net"
  : "http://127.0.0.1:8000";

console.log('API Base URL:', API_BASE);

// Reusable API helpers with proper error handling
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
        console.log(`POST: ${API_BASE}${path}`, body);
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
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
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
        
        // Don't set Content-Type header for FormData - let browser set it
        xhr.timeout = 300000; // 5 minute timeout for large files
        
        xhr.send(formData);
    });
}

// Specific endpoint functions for patient portal
async function getPatientInfo(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiGet(`/api/patient/${patientId}`);
}

async function getPatientRecords(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiGet(`/api/patient/${patientId}/records`);
}

async function uploadMedicalEvidence(formData, onProgress = null) {
    return apiUploadFile('/api/upload', formData, onProgress);
}

async function getMessages(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiGet(`/api/patient/${patientId}/messages`);
}

async function sendMessage(patientId, content, sender = 'patient') {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    if (!content || content.trim() === '') {
        throw new Error('Message content is required');
    }
    return apiPostJSON('/api/messages', {
        patientId,
        content,
        sender
    });
}

async function markMessagesAsRead(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiPut(`/api/patient/${patientId}/messages/read`, {});
}

async function getAppointments(patientId) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiGet(`/api/patient/${patientId}/appointments`);
}

async function cancelAppointment(appointmentId) {
    if (!appointmentId) {
        throw new Error('Appointment ID is required');
    }
    return apiDelete(`/api/appointments/${appointmentId}`);
}

async function requestAppointment(patientId, appointmentData) {
    if (!patientId || patientId.trim() === '') {
        throw new Error('Patient ID is required');
    }
    return apiPostJSON('/api/appointments', {
        patientId,
        ...appointmentData
    });
}

// Expose all functions globally
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.apiPostJSON = apiPostJSON;
window.apiUploadFile = apiUploadFile;
window.uploadMedicalEvidence = uploadMedicalEvidence;
window.getPatientInfo = getPatientInfo;
window.getPatientRecords = getPatientRecords;
window.getMessages = getMessages;
window.sendMessage = sendMessage;
window.markMessagesAsRead = markMessagesAsRead;
window.getAppointments = getAppointments;
window.cancelAppointment = cancelAppointment;
window.requestAppointment = requestAppointment;

console.log('API functions loaded');