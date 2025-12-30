const uploadForm = document.getElementById("uploadForm");
const patientId = document.getElementById("patientId");
const fileInput = document.getElementById("fileInput");
const refreshBtn = document.getElementById("refreshBtn");
const recordsList = document.getElementById("recordsList");
const recordCount = document.getElementById("recordCount");
const msg = document.getElementById("msg");
const progressBar = document.querySelector(".progress");
const bar = progressBar.querySelector(".progress-bar");
const selectedFileName = document.getElementById("selectedFileName");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!patientId.value.trim() || !fileInput.files[0]) {
        msg.textContent = "Please enter Patient ID and select a file.";
        msg.className = "mt-3 text-center text-danger";
        return;
    }

    msg.textContent = "Uploading...";
    msg.className = "mt-3 text-center text-info";
    progressBar.style.display = "block";
    bar.style.width = "0%";

    const fd = new FormData();
    fd.append("patientId", patientId.value.trim());
    fd.append("file", fileInput.files[0]);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload`);
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            bar.style.width = `${percent}%`;
        }
    };
    xhr.onload = () => {
        progressBar.style.display = "none";
        if (xhr.status >= 200 && xhr.status < 300) {
            msg.textContent = "Upload successful! Your GP will review it soon.";
            msg.className = "mt-3 text-center text-success";
            fileInput.value = "";
            selectedFileName.style.display = "none";
            loadRecords();
        } else {
            msg.textContent = "Upload failed. Please try again.";
            msg.className = "mt-3 text-center text-danger";
        }
    };
    xhr.onerror = () => {
        progressBar.style.display = "none";
        msg.textContent = "Upload error. Check your connection.";
        msg.className = "mt-3 text-center text-danger";
    };
    xhr.send(fd);
});

refreshBtn.addEventListener("click", loadRecords);
patientId.addEventListener("input", () => { 
    if (patientId.value.trim()) loadRecords(); 
});

async function loadRecords() {
    const pid = patientId.value.trim();
    if (!pid) {
        recordsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="bi bi-file-earmark-medical"></i></div><h5>No records found</h5><p class="info-text">Enter your Patient ID and upload files to see them here</p></div>';
        recordCount.textContent = "0 records";
        return;
    }

    try {
        const data = await apiGet(`/records?patientId=${pid}`);
        recordsList.innerHTML = "";

        if (!data || !data.records || data.records.length === 0) {
            recordsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="bi bi-file-earmark-medical"></i></div><h5>No uploads yet</h5><p class="info-text">Upload medical evidence to see it here</p></div>';
            recordCount.textContent = "0 records";
            return;
        }

        recordCount.textContent = `${data.records.length} record${data.records.length > 1 ? 's' : ''}`;

        data.records.forEach(rec => {
            const path = rec.blobName || rec.blobUrl?.split('patient-uploads/').pop() || '';

            const isImage = rec.contentType?.startsWith("image/");
            const preview = isImage
                ? `<img src="${API_BASE}/media/${path}" class="preview-img" onerror="this.src='img/file-icon.png'" alt="preview">`
                : `<img src="img/file-icon.png" class="preview-img" alt="file">`;

            const card = document.createElement("div");
            card.className = "col-12 col-md-6 col-lg-4";
            card.innerHTML = `
                <div class="record-card d-flex">
                    ${preview}
                    <div class="ms-3 flex-grow-1">
                        <div><strong>${rec.originalName || 'Unnamed file'}</strong></div>
                        <div class="small text-muted">Uploaded: ${new Date(rec.createdAt * 1000).toLocaleString()}</div>
                        <div class="small text-muted">Type: ${rec.contentType || 'Unknown'}</div>
                        <div><span class="status-badge status-${rec.status || 'pending'}">${(rec.status || 'pending').replace(/_/g, ' ')}</span></div>
                        <a href="${API_BASE}/media/${path}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">View / Download</a>
                    </div>
                </div>
            `;
            recordsList.appendChild(card);
        });
    } catch (err) {
        recordsList.innerHTML = '<p class="text-danger">Error loading records. Please try again.</p>';
        recordCount.textContent = "? records";
    }
}

if (patientId.value.trim()) loadRecords();