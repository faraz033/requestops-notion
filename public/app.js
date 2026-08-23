const form = document.getElementById("requestForm");
const result = document.getElementById("result");
const submitBtn = document.getElementById("submitBtn");


// =====================================================
// SUBMIT REQUEST
// =====================================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

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


        result.className = "result success";

        result.innerHTML = `
            <strong>✓ Request submitted successfully</strong>
            <br><br>

            Request ID:
            <strong>${data.requestId}</strong>

            <br><br>

            Your request has been sent for review.
            <br>
            Use this Request ID to track your request.
        `;


        // Automatically put the new Request ID
        // into the tracking input
        document.getElementById("requestId").value =
            data.requestId;


        form.reset();


    } catch (error) {

        result.className = "result error";

        result.innerHTML = `
            <strong>✕ Request submission failed</strong>
            <br><br>
            ${error.message}
        `;

    }


    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Request";

});


// =====================================================
// TRACK REQUEST
// =====================================================

const trackForm = document.getElementById("trackForm");
const trackResult = document.getElementById("trackResult");
const trackBtn = document.getElementById("trackBtn");


trackForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const requestId =
        document.getElementById("requestId")
        .value
        .trim();


    if (!requestId) {
        return;
    }


    trackBtn.disabled = true;
    trackBtn.textContent = "Checking...";

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


        let statusClass = "pending";

        if (request.status === "Approved") {
            statusClass = "success";
        }

        if (request.status === "Rejected") {
            statusClass = "error";
        }


        trackResult.className =
            `result ${statusClass}`;


        trackResult.innerHTML = `

            <strong>
                Request Status
            </strong>

            <br><br>

            <strong>Request ID:</strong>
            ${request.requestId}

            <br>

            <strong>Student:</strong>
            ${request.studentName}

            <br>

            <strong>Email:</strong>
            ${request.email}

            <br>

            <strong>Event:</strong>
            ${request.eventName}

            <br>

            <strong>Event Date:</strong>
            ${formatDate(request.eventDate)}

            <br>

            <strong>Venue:</strong>
            ${request.venue}

            <br><br>

            <strong>Status:</strong>
            ${request.status}

            ${
                request.decisionReason
                ? `
                    <br><br>
                    <strong>Decision:</strong>
                    ${request.decisionReason}
                  `
                : ""
            }

            ${
                request.processedAt
                ? `
                    <br>
                    <strong>Processed At:</strong>
                    ${formatDateTime(request.processedAt)}
                  `
                : ""
            }

        `;


    } catch (error) {

        trackResult.className =
            "result error";

        trackResult.innerHTML = `
            <strong>✕ Unable to find request</strong>
            <br><br>
            ${error.message}
        `;

    }


    trackBtn.disabled = false;
    trackBtn.textContent = "Track Request";

});


// =====================================================
// DATE FORMATTING
// =====================================================

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