const form = document.getElementById("requestForm");
const result = document.getElementById("result");
const submitBtn = document.getElementById("submitBtn");

const trackForm = document.getElementById("trackForm");
const trackResult = document.getElementById("trackResult");
const trackBtn = document.getElementById("trackBtn");


// =====================================================
// SUBMIT REQUEST
// =====================================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Submitting...`;

    result.className = "result hidden";


    const requestData = {

        studentName:
            document.getElementById("studentName").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        eventName:
            document.getElementById("eventName").value.trim(),

        eventDate:
            document.getElementById("eventDate").value,

        venue:
            document.getElementById("venue").value.trim(),

        description:
            document.getElementById("description").value.trim()

    };


    try {

        const response = await fetch("/api/requests", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(requestData)

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to submit request"
            );

        }


        // Display Success State with Prominent Request ID and Track Button
        result.className = "result success-box";

        result.innerHTML = `
            <div class="submission-success">
                <div class="success-icon-badge">✓</div>

                <div class="success-details">
                    <h3>Request Submitted Successfully</h3>
                    <p>Your event request has been recorded and sent for administrative review.</p>

                    <div class="request-id-container">
                        <span class="id-label">Your Request ID</span>
                        <code class="id-code">${data.requestId}</code>
                    </div>

                    <div class="success-actions">
                        <button type="button" class="btn-track-action" id="trackNowBtn">
                            Track this request →
                        </button>
                    </div>
                </div>
            </div>
        `;


        // Automatically put the new Request ID into the tracking input
        document.getElementById("requestId").value = data.requestId;


        // Add event listener to the "Track this request" button
        const trackNowBtn = document.getElementById("trackNowBtn");

        if (trackNowBtn) {

            trackNowBtn.addEventListener("click", () => {

                const trackSection = document.getElementById("track");

                trackSection.scrollIntoView({ behavior: "smooth" });

                // Trigger track form submission automatically
                trackForm.dispatchEvent(new Event("submit"));

            });

        }


        form.reset();


    } catch (error) {

        result.className = "result error-box";

        result.innerHTML = `
            <div class="submission-error">
                <div class="error-icon-badge">✕</div>
                <div>
                    <strong>Request Submission Failed</strong>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </div>
        `;

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Event Request";

    }

});


// =====================================================
// TRACK REQUEST
// =====================================================

trackForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const requestIdInput = document.getElementById("requestId");
    const requestId = requestIdInput.value.trim();


    if (!requestId) {
        return;
    }


    trackBtn.disabled = true;
    trackBtn.innerHTML = `<span class="spinner"></span> Checking...`;

    trackResult.className = "result hidden";


    try {

        const response = await fetch(
            `/api/requests/${encodeURIComponent(requestId)}`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Request not found"
            );

        }


        const request = data.data;


        // Define status styling and dot badges
        let statusBadgeClass = "badge-pending";
        let statusDotClass = "dot-pending";

        if (request.status === "Approved") {
            statusBadgeClass = "badge-approved";
            statusDotClass = "dot-approved";
        } else if (request.status === "Rejected") {
            statusBadgeClass = "badge-rejected";
            statusDotClass = "dot-rejected";
        }


        trackResult.className = "result tracking-card-wrapper";

        trackResult.innerHTML = `
            <div class="tracking-card">

                <div class="card-status-header">

                    <div class="status-left">
                        <span class="status-badge ${statusBadgeClass}">
                            <span class="badge-dot ${statusDotClass}"></span>
                            ${escapeHtml(request.status || "Pending")}
                        </span>

                        <code class="tracking-id-badge">${escapeHtml(request.requestId)}</code>
                    </div>

                    <div class="submission-meta">
                        Submitted: ${formatDateTime(request.createdAt)}
                    </div>

                </div>


                <div class="tracking-grid">

                    <div class="grid-item">
                        <span class="grid-label">Student Name</span>
                        <span class="grid-value">${escapeHtml(request.studentName)}</span>
                    </div>

                    <div class="grid-item">
                        <span class="grid-label">Email</span>
                        <span class="grid-value">${escapeHtml(request.email)}</span>
                    </div>

                    <div class="grid-item">
                        <span class="grid-label">Event Name</span>
                        <span class="grid-value highlight">${escapeHtml(request.eventName)}</span>
                    </div>

                    <div class="grid-item">
                        <span class="grid-label">Event Date</span>
                        <span class="grid-value">${formatDate(request.eventDate)}</span>
                    </div>

                    <div class="grid-item full">
                        <span class="grid-label">Venue</span>
                        <span class="grid-value">${escapeHtml(request.venue)}</span>
                    </div>

                    <div class="grid-item full">
                        <span class="grid-label">Description</span>
                        <span class="grid-value description-text">${escapeHtml(request.description)}</span>
                    </div>

                </div>


                ${
                    request.decisionReason || request.processedAt
                    ? `
                        <div class="decision-panel ${statusBadgeClass}">
                            <div class="decision-header">
                                <span class="panel-title">Administrative Decision</span>
                                ${
                                    request.processedAt
                                    ? `<span class="processed-meta">Processed: ${formatDateTime(request.processedAt)}</span>`
                                    : ""
                                }
                            </div>
                            ${
                                request.decisionReason
                                ? `<p class="decision-body">${escapeHtml(request.decisionReason)}</p>`
                                : ""
                            }
                        </div>
                      `
                    : request.status === "Pending"
                    ? `
                        <div class="decision-panel badge-pending">
                            <div class="decision-header">
                                <span class="panel-title">Status Note</span>
                            </div>
                            <p class="decision-body">This request is currently under review by administrators in Notion.</p>
                        </div>
                      `
                    : ""
                }

            </div>
        `;


    } catch (error) {

        trackResult.className = "result error-box";

        trackResult.innerHTML = `
            <div class="submission-error">
                <div class="error-icon-badge">✕</div>
                <div>
                    <strong>Unable to find request</strong>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </div>
        `;

    } finally {

        trackBtn.disabled = false;
        trackBtn.textContent = "Track Request";

    }

});


// =====================================================
// UTILITIES
// =====================================================

function escapeHtml(str) {
    if (!str) {
        return "";
    }
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateString) {

    if (!dateString) {
        return "Not available";
    }

    return new Date(dateString).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


function formatDateTime(dateString) {

    if (!dateString) {
        return "Not available";
    }

    return new Date(dateString).toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}