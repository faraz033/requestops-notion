const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

const REQUESTS_DATABASE_ID = process.env.REQUESTS_DATABASE_ID;
const RUN_LOG_DATABASE_ID = process.env.RUN_LOG_DATABASE_ID;

async function getDataSourceId(databaseId) {
    const database = await notion.databases.retrieve({
        database_id: databaseId
    });

    if (!database.data_sources || database.data_sources.length === 0) {
        throw new Error(`No data source found for database ${databaseId}`);
    }

    return database.data_sources[0].id;
}


// Create a request inside the Requests database
async function createRequest({
    requestId,
    studentName,
    email,
    eventName,
    eventDate,
    venue,
    description
}) {

    const dataSourceId = await getDataSourceId(REQUESTS_DATABASE_ID);

    const response = await notion.pages.create({
        parent: {
            data_source_id: dataSourceId
        },

        properties: {
            "Request ID": {
                title: [
                    {
                        text: {
                            content: requestId
                        }
                    }
                ]
            },

            "Student Name": {
                rich_text: [
                    {
                        text: {
                            content: studentName
                        }
                    }
                ]
            },

            "Email": {
                email: email
            },

            "Event Name": {
                rich_text: [
                    {
                        text: {
                            content: eventName
                        }
                    }
                ]
            },

            "Event Date": {
                date: {
                    start: eventDate
                }
            },

            "Venue": {
                rich_text: [
                    {
                        text: {
                            content: venue
                        }
                    }
                ]
            },

            "Description": {
                rich_text: [
                    {
                        text: {
                            content: description
                        }
                    }
                ]
            },

            "Status": {
                select: {
                    name: "Pending"
                }
            },
            "Decision Reason": {
                rich_text: []
            }
        }
    });

    return response;
}

// Get approved requests that have not been processed yet
async function getApprovedRequests() {
    const dataSourceId = await getDataSourceId(REQUESTS_DATABASE_ID);

    const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
            and: [
                {
                    property: "Status",
                    select: {
                        equals: "Approved"
                    }
                },
                {
                    property: "Processed At",
                    date: {
                        is_empty: true
                    }
                }
            ]
        }
    });

    return response.results;
}


// Mark a request as processed
async function markRequestProcessed(pageId, decisionReason) {
    const response = await notion.pages.update({
        page_id: pageId,

        properties: {
            "Processed At": {
                date: {
                    start: new Date().toISOString()
                }
            },

            "Decision Reason": {
                rich_text: [
                    {
                        text: {
                            content: decisionReason
                        }
                    }
                ]
            }
        }
    });

    return response;
}


// Create an entry in the Run Log database
async function createRunLog({
    requestId,
    status,
    outcome,
    error = ""
}) {
    const dataSourceId = await getDataSourceId(RUN_LOG_DATABASE_ID);

    const runId = `RUN-${Date.now()}`;

    const response = await notion.pages.create({
        parent: {
            data_source_id: dataSourceId
        },

        properties: {
            "Run ID": {
                title: [
                    {
                        text: {
                            content: runId
                        }
                    }
                ]
            },

            "Request ID": {
                rich_text: [
                    {
                        text: {
                            content: requestId
                        }
                    }
                ]
            },

            "Status": {
                select: {
                    name: status
                }
            },

            "Timestamp": {
                date: {
                    start: new Date().toISOString()
                }
            },

            "Outcome": {
                rich_text: [
                    {
                        text: {
                            content: outcome
                        }
                    }
                ]
            },

            "Error": {
                rich_text: [
                    {
                        text: {
                            content: error
                        }
                    }
                ]
            }
        }
    });

    return response;
}
// Get a single request by Request ID
async function getRequestById(requestId) {

    const dataSourceId =
        await getDataSourceId(REQUESTS_DATABASE_ID);

    const response = await notion.dataSources.query({
        data_source_id: dataSourceId,

        filter: {
            property: "Request ID",
            title: {
                equals: requestId
            }
        }
    });

    if (response.results.length === 0) {
        return null;
    }

    const page = response.results[0];
    const properties = page.properties;

    return {
        requestId:
            properties["Request ID"]?.title?.[0]?.plain_text || "",

        studentName:
            properties["Student Name"]?.rich_text?.[0]?.plain_text || "",

        email:
            properties["Email"]?.email || "",

        eventName:
            properties["Event Name"]?.rich_text?.[0]?.plain_text || "",

        eventDate:
            properties["Event Date"]?.date?.start || null,

        venue:
            properties["Venue"]?.rich_text?.[0]?.plain_text || "",

        description:
            properties["Description"]?.rich_text?.[0]?.plain_text || "",

        status:
            properties["Status"]?.select?.name || "",

        decisionReason:
            properties["Decision Reason"]?.rich_text?.[0]?.plain_text || "",

        createdAt:
            page.created_time,

        processedAt:
            properties["Processed At"]?.date?.start || null
    };
}
module.exports = {
    notion,
    createRequest,
    getDataSourceId,
    getApprovedRequests,
    markRequestProcessed,
    createRunLog,
    getRequestById
};