const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://gpportal-api-hmd0bjameudkarc5.uksouth-01.azurewebsites.net"
  : "http://127.0.0.1:8000";

// Reusable API helpers
async function apiGet(path) {
    const r = await fetch(`${API_BASE}${path}`);
    return r.json();
}

async function apiPost(path, body) {
    const r = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        body
    });
    return r.json();
}

async function apiPut(path, json) {
    const r = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
    });
    return r.json();
}

async function apiDelete(path) {
    const r = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
    return r.json();
}

// New API functions for communication features
async function apiPostJSON(path, jsonData) {
    const r = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData)
    });
    return r.json();
}

async function apiUploadFile(path, formData, onProgress = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        if (onProgress) {
            xhr.upload.onprogress = onProgress;
        }
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || `Upload failed: ${xhr.statusText}`));
                } catch (e) {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.open('POST', `${API_BASE}${path}`);
        xhr.send(formData);
    });
}

// Specific endpoint functions for easier use
async function getPatientInfo(patientId) {
    return apiGet(`/patient/${patientId}`);
}

async function getPatientRecords(patientId) {
    return apiGet(`/records?patientId=${patientId}`);
}

async function uploadMedicalEvidence(formData) {
    return apiUploadFile('/upload', formData);
}

async function getMessages(patientId) {
    return apiGet(`/messages/${patientId}`);
}

async function sendMessage(patientId, content, sender = 'patient') {
    return apiPostJSON('/messages', {
        patientId,
        content,
        sender
    });
}

async function markMessagesAsRead(patientId) {
    return apiPut(`/messages/${patientId}/read`, {});
}

async function getAppointments(patientId) {
    return apiGet(`/appointments/${patientId}`);
}

async function cancelAppointment(appointmentId) {
    return apiDelete(`/appointments/${appointmentId}`);
}

async function requestAppointment(patientId, appointmentData) {
    return apiPostJSON('/appointments', {
        patientId,
        ...appointmentData
    });
}

// Development mock API functions for when backend endpoints don't exist yet
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Override specific functions with mock data for development
    const originalApiGet = window.apiGet;
    const originalApiPostJSON = window.apiPostJSON;
    const originalApiPut = window.apiPut;
    
    // Mock patient data
    const mockPatients = {
        'P001': {
            name: 'John Smith',
            gpName: 'Dr. Sarah Johnson',
            unreadMessages: 2,
            lastAppointment: '2024-01-15'
        },
        'P002': {
            name: 'Jane Doe',
            gpName: 'Dr. Michael Brown',
            unreadMessages: 0,
            lastAppointment: '2024-01-10'
        },
        'P004': {
            name: 'Test Patient',
            gpName: 'Dr. Emily Wilson',
            unreadMessages: 1,
            lastAppointment: '2024-01-20'
        }
    };
    
    // Mock messages
    const mockMessages = {
        'P001': [
            {
                id: 1,
                content: 'Hello John, I\'ve reviewed your recent uploads. The rash appears to be improving. Please continue with the prescribed cream.',
                sender: 'gp',
                timestamp: '2024-01-20T14:30:00Z',
                unread: false
            },
            {
                id: 2,
                content: 'Thank you, doctor. The itching has reduced significantly.',
                sender: 'patient',
                timestamp: '2024-01-20T15:45:00Z',
                unread: false
            },
            {
                id: 3,
                content: 'Please upload another photo in 2 days so I can check the progress.',
                sender: 'gp',
                timestamp: '2024-01-20T16:00:00Z',
                unread: true
            }
        ],
        'P004': [
            {
                id: 1,
                content: 'Welcome to the portal. Please upload your medical evidence for review.',
                sender: 'gp',
                timestamp: '2024-01-19T10:00:00Z',
                unread: true
            }
        ]
    };
    
    // Mock appointments
    const mockAppointments = {
        'P001': [
            {
                id: 1,
                type: 'Follow-up',
                date: '2024-02-01',
                time: '10:30 AM',
                status: 'confirmed',
                notes: 'Review of skin condition',
                videoLink: 'https://meet.nhs.uk/abc123'
            }
        ],
        'P004': [
            {
                id: 2,
                type: 'Initial Consultation',
                date: '2024-01-25',
                time: '14:00 PM',
                status: 'scheduled',
                notes: 'Please bring your medical records',
                videoLink: null
            }
        ]
    };
    
    // Override getPatientInfo for development
    window.getPatientInfo = async function(patientId) {
        console.log(`[MOCK] Getting patient info for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (mockPatients[patientId]) {
            return mockPatients[patientId];
        }
        
        return {
            name: 'Unknown Patient',
            gpName: 'Dr. Unknown',
            unreadMessages: 0,
            lastAppointment: null
        };
    };
    
    // Override getMessages for development
    window.getMessages = async function(patientId) {
        console.log(`[MOCK] Getting messages for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            messages: mockMessages[patientId] || []
        };
    };
    
    // Override sendMessage for development
    window.sendMessage = async function(patientId, content, sender = 'patient') {
        console.log(`[MOCK] Sending message for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!mockMessages[patientId]) {
            mockMessages[patientId] = [];
        }
        
        const newMessage = {
            id: mockMessages[patientId].length + 1,
            content,
            sender,
            timestamp: new Date().toISOString(),
            unread: false
        };
        
        mockMessages[patientId].push(newMessage);
        
        return {
            success: true,
            messageId: newMessage.id
        };
    };
    
    // Override markMessagesAsRead for development
    window.markMessagesAsRead = async function(patientId) {
        console.log(`[MOCK] Marking messages as read for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (mockMessages[patientId]) {
            mockMessages[patientId].forEach(msg => msg.unread = false);
        }
        
        // Update unread count in patient data
        if (mockPatients[patientId]) {
            mockPatients[patientId].unreadMessages = 0;
        }
        
        return { success: true };
    };
    
    // Override getAppointments for development
    window.getAppointments = async function(patientId) {
        console.log(`[MOCK] Getting appointments for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            appointments: mockAppointments[patientId] || []
        };
    };
    
    // Override cancelAppointment for development
    window.cancelAppointment = async function(appointmentId) {
        console.log(`[MOCK] Cancelling appointment ${appointmentId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove appointment from all patients
        Object.keys(mockAppointments).forEach(patientId => {
            mockAppointments[patientId] = mockAppointments[patientId].filter(
                appt => appt.id != appointmentId
            );
        });
        
        return { success: true };
    };
    
    // Override requestAppointment for development
    window.requestAppointment = async function(patientId, appointmentData) {
        console.log(`[MOCK] Requesting appointment for ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!mockAppointments[patientId]) {
            mockAppointments[patientId] = [];
        }
        
        const newAppointment = {
            id: Date.now(),
            ...appointmentData,
            status: 'pending'
        };
        
        mockAppointments[patientId].push(newAppointment);
        
        return {
            success: true,
            appointmentId: newAppointment.id
        };
    };
    
} else {
    // Use real API functions in production
    window.getPatientInfo = getPatientInfo;
    window.getMessages = getMessages;
    window.sendMessage = sendMessage;
    window.markMessagesAsRead = markMessagesAsRead;
    window.getAppointments = getAppointments;
    window.cancelAppointment = cancelAppointment;
    window.requestAppointment = requestAppointment;
}

// Expose all functions globally
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.apiPostJSON = apiPostJSON;
window.apiUploadFile = apiUploadFile;
window.uploadMedicalEvidence = uploadMedicalEvidence;
window.getPatientRecords = getPatientRecords;