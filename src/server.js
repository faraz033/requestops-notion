require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    createRequest,
    getApprovedRequests,
    markRequestProcessed,
    createRunLog,
    getRequestById
} = require("./notion");const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "RequestOps backend is running"
    });
});


// Create a new event request
app.post("/api/requests", async (req, res) => {

    try {

        const {
            studentName,
            email,
            eventName,
            eventDate,
            venue,
            description
        } = req.body;


        // Basic validation
        if (
            !studentName ||
            !email ||
            !eventName ||
            !eventDate ||
            !venue ||
            !description
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }


        // Generate request ID
        const requestId =
            "REQ-" +
            Date.now();


        // Create request in Notion
        const page = await createRequest({
            requestId,
            studentName,
            email,
            eventName,
            eventDate,
            venue,
            description
        });


        res.status(201).json({

            success: true,

            message: "Request created successfully",

            requestId,

            notionPageId: page.id

        });


    } catch (error) {

        console.error("Create request error:", error);

        res.status(500).json({

            success: false,

            message: "Failed to create request",

            error: error.message

        });

    }

});
// Get request status by Request ID
app.get("/api/requests/:requestId", async (req, res) => {

    try {

        const { requestId } = req.params;

        const request = await getRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {

        console.error(
            "Get request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to get request",
            error: error.message
        });
    }
});
// Process all approved requests
async function processApprovedRequests() {

    const requests = await getApprovedRequests();

    console.log(`Found ${requests.length} approved request(s)`);

    for (const request of requests) {

        const properties = request.properties;

        const requestId =
            properties["Request ID"]?.title?.[0]?.plain_text ||
            "UNKNOWN";

        console.log(`Processing ${requestId}`);

        try {

            // Log that processing has started
            await createRunLog({
                requestId,
                status: "Started",
                outcome: "Processing approved request"
            });


            // This is where the actual business action will happen.
            // For now we are simulating successful processing.
            const outcome =
                `Request ${requestId} processed successfully`;


            // Mark request as processed in Notion
            await markRequestProcessed(
                request.id,
                "Request approved and processed successfully."
            );


            // Log successful processing
            await createRunLog({
                requestId,
                status: "Success",
                outcome
            });


            console.log(`✓ ${requestId} processed successfully`);

        } catch (error) {

            console.error(
                `✗ Error processing ${requestId}:`,
                error
            );


            // Log failed processing
            try {

                await createRunLog({
                    requestId,
                    status: "Failed",
                    outcome: "Request processing failed",
                    error: error.message
                });

            } catch (logError) {

                console.error(
                    "Failed to create error log:",
                    logError
                );

            }

        }
    }

    return requests.length;
}


// Manual endpoint for testing the processor
app.post("/api/process-approved", async (req, res) => {

    try {

        const processedCount =
            await processApprovedRequests();

        res.json({

            success: true,

            message:
                "Approved requests processed",

            processedCount

        });

    } catch (error) {

        console.error(
            "Process approved requests error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to process approved requests",

            error: error.message

        });

    }

});
// Automatically check for approved requests every 10 seconds
setInterval(async () => {
    try {
        const count = await processApprovedRequests();

        if (count > 0) {
            console.log(
                `Automatic processor handled ${count} request(s)`
            );
        }

    } catch (error) {
        console.error(
            "Automatic processor error:",
            error.message
        );
    }
}, 10000);
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `RequestOps backend running on port ${PORT}`
    );

});