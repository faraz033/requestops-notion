const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const REQUESTS_DATABASE_ID = process.env.REQUESTS_DATABASE_ID;
const RUN_LOG_DATABASE_ID = process.env.RUN_LOG_DATABASE_ID;

// Notion's newer API separates a "database" from its underlying "data source."
// We look this up once per call so we always create pages in the right place.
async function getDataSourceId(databaseId) {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    return database.data_sources[0].id;
}

// Creates one "Pending" request page. This is the Trigger step from our
// architecture: a form submission turns directly into a real Notion page.
async function createRequest({ requestId, studentName, email, eventName, eventDate, venue, description }) {
    const dataSourceId = await getDataSourceId(REQUESTS_DATABASE_ID);

    const response = await notion.pages.create({
        parent: { data_source_id: dataSourceId },
        properties: {
            "Request ID": { title: [{ text: { content: requestId } }] },
            "Student Name": { rich_text: [{ text: { content: studentName } }] },
            "Email": { email: email },
            "Event Name": { rich_text: [{ text: { content: eventName } }] },
            "Event Date": { date: { start: eventDate } },
            "Venue": { rich_text: [{ text: { content: venue } }] },
            "Description": { rich_text: [{ text: { content: description } }] },
            "Status": { select: { name: "Pending" } },
        },
    });

    return response;
}
// Finds every request the coordinator has decided on (Approved or Rejected)
// that we haven't handled yet. "Not Pending" catches both decision types
// in one query, instead of writing two separate functions.
async function getDecidedRequests() {
    const dataSourceId = await getDataSourceId(REQUESTS_DATABASE_ID);

    const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
            and: [
                { property: "Status", select: { does_not_equal: "Pending" } },
                { property: "Status", select: { is_not_empty: true } },
            ],
        },
    });

    return response.results;
}
module.exports = { notion, createRequest, getDataSourceId, getDecidedRequests };