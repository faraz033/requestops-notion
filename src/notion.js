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
            "Event Date": eventDate ? { date: { start: eventDate } } : { date: null },           
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
        { property: "Processed At", date: { is_empty: true } },
      ],
    },
  });

  return response.results;
}// Writes one Run Log row, attributed to the integration with a real
// timestamp -- this is the "code-written proof" the track requires.
async function createRunLog({ requestId, status, outcome }) {
  const dataSourceId = await getDataSourceId(RUN_LOG_DATABASE_ID);

  await notion.pages.create({
    parent: { data_source_id: dataSourceId },
    properties: {
      "Run ID": { title: [{ text: { content: `RUN-${Date.now()}` } }] },
      "Request ID": { rich_text: [{ text: { content: requestId } }] },
      "Status": { select: { name: status } },
      "Timestamp": { date: { start: new Date().toISOString() } },
      "Outcome": { rich_text: [{ text: { content: outcome } }] },
    },
  });
}

// Locks a request so we don't process it twice. Only sets one field --
// it never touches "Decision Reason," since that belongs to the coordinator.
async function markProcessed(pageId) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Processed At": { date: { start: new Date().toISOString() } },
    },
  });
}

// Small helper to read a plain string out of a Notion property, so we don't
// repeat this unwrapping logic every time we need one.
function getText(page, propertyName) {
  const prop = page.properties?.[propertyName];
  if (!prop) return "";
  if (prop.rich_text) return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.title) return prop.title.map((t) => t.plain_text).join("");
  if (prop.select) return prop.select?.name || "";
  if (prop.email) return prop.email || "";
  if (prop.date) return prop.date?.start || "";
  return "";
}
// Finds one request by its Request ID (the title field), for the
// student-facing status page. Returns null if nothing matches.
async function getRequestByRequestId(requestId) {
  const dataSourceId = await getDataSourceId(REQUESTS_DATABASE_ID);

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Request ID",
      title: { equals: requestId },
    },
  });

  return response.results[0] || null;
}
module.exports = { notion, createRequest, getDataSourceId, getDecidedRequests, createRunLog, markProcessed, getText, getRequestByRequestId };