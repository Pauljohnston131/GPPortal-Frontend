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

    recordsList.innerHTML = "<div class='text-center'><div class='spinner-border'></div></div>";

    try {
        const res = await fetch(RETRIEVE_ENDPOINT);
        let data = await res.json();
        if (!Array.isArray(data)) data = [];

        const filtered = data.filter(rec => (rec.userID || rec.UserID || "") === pid);

        recordCount.textContent = `${filtered.length} records`;

        if (filtered.length === 0) {
            recordsList.innerHTML = "<div class='empty-state'><h5>No uploads yet</h5></div>";
            return;
        }

        recordsList.innerHTML = "";
        filtered.forEach(rec => {
            const fileName = rec.fileName || rec.FileName || "Unknown";
            const path = rec.filePath || rec.FilePath || "";
            const fullUrl = path.startsWith('http') ? path : `${BLOB_ACCOUNT}/${path.replace(/^\/+/, '')}`;
            const contentType = rec.contentType || rec.ContentType || "";
            const isImage = contentType.startsWith("image/");
            const isVideo = contentType.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(fileName);
            const preview = isImage ? `<img src="${fullUrl}" class="preview-img" onerror="this.src='img/file-icon.png'" alt="preview">` :
                            isVideo ? `<video src="${fullUrl}" class="preview-img" controls muted onerror="this.src='img/file-icon.png'"></video>` :
                            `<img src="img/file-icon.png" class="preview-img" alt="file">`;

            const card = document.createElement("div");
            card.className = "col-12 col-md-6 col-lg-4";
            card.innerHTML = `
                <div class="record-card d-flex">
                    ${preview}
                    <div class="ms-3 flex-grow-1">
                        <div><strong>${fileName}</strong></div>
                        <div class="small text-muted">Uploaded: ${new Date().toLocaleString()}</div> <!-- Assume no timestamp, use current -->
                        <div><span class="status-badge status-pending">Pending</span></div> <!-- Mock status -->
                        <a href="${fullUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">Open</a>
                        <button class="btn btn-sm btn-outline-danger mt-2 ms-2 delete-btn" data-path="${path}">Delete</button>
                    </div>
                </div>
            `;
            recordsList.appendChild(card);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const path = btn.dataset.path;
                // Assume delete endpoint; replace with actual if available
                const res = await apiDelete(`/delete?path=${encodeURIComponent(path)}&patientId=${pid}`);
                if (res.success) {
                    loadRecords();
                } else {
                    alert('Delete failed');
                }
            });
        });

    } catch (err) {
        recordsList.innerHTML = "<div class='text-danger'>Error loading records</div>";
    }
};

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