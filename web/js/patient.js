// Azure Logic App endpoints & storage account
const UPLOAD_ENDPOINT = "https://prod-03.norwayeast.logic.azure.com:443/workflows/067359a2c76f4066a261976d81576232/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=eywTetnzKA-OGZZjsWjZHa9C2jMvlhBMOyQIOEOcczw";
const RETRIEVE_ENDPOINT = "https://prod-28.norwayeast.logic.azure.com:443/workflows/0c9b146dff084c6093ae46a93728b5c4/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=7lOihj3TYYaRmbq8Mza0-gDasbtcgGnf8XWCwuw52cQ";
const BLOB_ACCOUNT = "https://blobstorageweek63.blob.core.windows.net";

// Assuming additional endpoints for new features (replace with actual if available)
const MESSAGE_ENDPOINT = `${API_BASE}/messages`; // Assume backend supports /messages for POST and GET
const APPOINTMENTS_ENDPOINT = `${API_BASE}/appointments`; // Assume backend supports /appointments

const uploadForm = document.getElementById("uploadForm");
const patientId = document.getElementById("patientId");
const fileInput = document.getElementById("fileInput");
const refreshBtn = document.getElementById("refreshBtn");
const recordsList = document.getElementById("recordsList");
const msg = document.getElementById("msg");
const progressBar = document.querySelector(".progress");
const bar = progressBar.querySelector(".progress-bar");
const recordCount = document.getElementById("recordCount");
const messageForm = document.getElementById("messageForm");
const messageMsg = document.getElementById("messageMsg");
const messageList = document.getElementById("messageList");
const appointmentsList = document.getElementById("appointmentsList");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pid = patientId.value.trim();
    if (!pid || !fileInput.files[0]) {
        msg.textContent = "Please enter Patient ID and select a file.";
        msg.style.color = "red";
        return;
    }

    msg.textContent = "Uploading...";
    msg.style.color = "blue";
    progressBar.style.display = "block";
    bar.style.width = "0%";

    const fd = new FormData();
    fd.append("FileName", fileInput.files[0].name);
    fd.append("userID", pid);
    fd.append("userName", "Patient " + pid); // Can add name input if needed
    fd.append("File", fileInput.files[0]);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_ENDPOINT);
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            bar.style.width = `${percent}%`;
        }
    };
    xhr.onload = () => {
        progressBar.style.display = "none";
        if (xhr.status >= 200 && xhr.status < 300) {
            msg.textContent = "Upload successful!";
            msg.style.color = "green";
            fileInput.value = "";
            localStorage.setItem('patientId', pid);
            loadRecords();
        } else {
            msg.textContent = "Upload failed.";
            msg.style.color = "red";
        }
    };
    xhr.send(fd);
});

refreshBtn.addEventListener("click", loadRecords);
patientId.addEventListener("input", () => { 
    const pid = patientId.value.trim();
    if (pid) {
        localStorage.setItem('patientId', pid);
        loadRecords(); 
        loadMessages();
        loadAppointments();
    }
});

async function loadRecords() {
    const pid = patientId.value.trim();
    if (!pid) {
        recordsList.innerHTML = "<div class='empty-state'><h5>No Patient ID entered</h5></div>";
        recordCount.textContent = "0 records";
        return;
    }

    recordsList.innerHTML = "<div class='text-center py-5'><div class='spinner-border text-primary'></div><p>Loading records...</p></div>";

    try {
        const res = await fetch(RETRIEVE_ENDPOINT);
        
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("Expected JSON, got:", text.substring(0, 500));
            throw new Error("Invalid response: not JSON (likely 404 or server error)");
        }

        let data = await res.json();
        if (!Array.isArray(data)) data = [];

        const filtered = data.filter(rec => 
            String(rec.userID || rec.UserID || "").trim() === pid
        );

        recordCount.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            recordsList.innerHTML = `
                <div class='empty-state'>
                    <div class='empty-state-icon'><i class='bi bi-inbox'></i></div>
                    <h5>No uploads yet for ${pid}</h5>
                    <p class='info-text'>Your uploaded evidence will appear here once submitted.</p>
                </div>`;
            return;
        }

        recordsList.innerHTML = "";
        filtered.forEach(rec => {
            let fileName = rec.fileName || rec.FileName || "Unnamed file";
            let path = rec.filePath || rec.FilePath || "";
            let fullUrl = path.startsWith('http') ? path : `${BLOB_ACCOUNT}/${path.replace(/^\/+/, '')}`;
            let contentType = rec.contentType || rec.ContentType || "";
            let isImage = contentType.startsWith("image/");
            let isVideo = contentType.startsWith("video/") || /\.(mp4|webm|mov|avi)$/i.test(fileName);

            let preview = isImage 
                ? `<img src="${fullUrl}" class="preview-img" onerror="this.src='img/file-icon.png'; this.alt='Broken image'" alt="${fileName}">`
                : isVideo
                ? `<div class="preview-img bg-dark d-flex align-items-center justify-content-center text-white"><i class="bi bi-play-fill fs-4"></i></div>`
                : `<img src="img/file-icon.png" class="preview-img" alt="Document">`;

            const card = document.createElement("div");
            card.className = "col-12 col-md-6 col-lg-4";
            card.innerHTML = `
                <div class="record-card d-flex">
                    ${preview}
                    <div class="ms-3 flex-grow-1">
                        <div><strong>${fileName}</strong></div>
                        <div class="small text-muted">Uploaded by: Patient ${pid}</div>
                        <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                            ${isVideo ? 'Play Video' : 'Open Full'}
                        </a>
                    </div>
                </div>
            `;
            recordsList.appendChild(card);
        });

    } catch (err) {
        console.error("Load records failed:", err);
        recordsList.innerHTML = `
            <div class="alert alert-warning">
                <strong>Unable to load records</strong><br>
                <small>The server is currently unavailable or returned an error.<br>
                Check your Logic App status in Azure Portal.</small>
            </div>`;
        recordCount.textContent = "? records";
    }
}

// New: Secure Messaging
messageForm.addEventListener('submit', async e => {
    e.preventDefault();
    const pid = patientId.value.trim();
    const subject = document.getElementById('messageSubject').value.trim();
    const body = document.getElementById('messageBody').value.trim();
    if (!pid || !subject || !body) {
        messageMsg.textContent = 'Please fill all fields.';
        messageMsg.style.color = 'red';
        return;
    }

    messageMsg.textContent = 'Sending...';
    messageMsg.style.color = 'blue';

    const res = await apiPost('/messages', { patientId: pid, subject, body });
    if (res.success) {
        messageMsg.textContent = 'Message sent!';
        messageMsg.style.color = 'green';
        document.getElementById('messageSubject').value = '';
        document.getElementById('messageBody').value = '';
        loadMessages();
    } else {
        messageMsg.textContent = 'Send failed.';
        messageMsg.style.color = 'red';
    }
});

async function loadMessages() {
    const pid = patientId.value.trim();
    if (!pid) return;

    const data = await apiGet(`/messages?patientId=${pid}`);
    messageList.innerHTML = data?.messages?.map(msg => `
        <div class="border-bottom py-2">
            <strong>${msg.subject}</strong><br>
            <small>${msg.body}</small><br>
            <small class="text-muted">Sent: ${new Date(msg.createdAt).toLocaleString()} - Status: ${msg.status || 'Sent'}</small>
        </div>
    `).join('') || '<p>No messages yet.</p>';
}

// New: Appointments (mock or fetch)
async function loadAppointments() {
    const pid = patientId.value.trim();
    if (!pid) return;

    // Assume fetch; for now, mock data
    const mockAppointments = [
        { date: '2026-01-15', time: '10:00 AM', type: 'GP Consultation', status: 'Confirmed' },
        { date: '2026-02-01', time: '2:30 PM', type: 'Follow-up', status: 'Pending' }
    ];

    // Or real: const data = await apiGet(`/appointments?patientId=${pid}`);

    appointmentsList.innerHTML = mockAppointments.map(appt => `
        <div class="border-bottom py-2">
            <strong>${appt.type}</strong><br>
            <small>Date: ${appt.date} at ${appt.time}</small><br>
            <small class="text-muted">Status: ${appt.status}</small>
        </div>
    `).join('') || '<p>No upcoming appointments.</p>';
}

// Auto-load on page open if patientId is pre-filled
if (patientId.value.trim()) loadRecords();