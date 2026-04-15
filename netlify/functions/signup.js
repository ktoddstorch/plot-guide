exports.handler = async function (event) {
  console.log("Function started, method:", event.httpMethod);
  console.log("Body received:", event.body);
  
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, email, phone, interests, level } = data;
  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Name and email required" }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_PERSONAL_OS_URL;
  const SUPABASE_KEY = process.env.SUPABASE_PERSONAL_OS_SERVICE_KEY;
  const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;
  const TODOIST_PROJECT_ID = "6gMhqpmj9RFJwq6c";

  console.log("Todoist token exists:", !!TODOIST_TOKEN);
  console.log("Todoist token length:", TODOIST_TOKEN ? TODOIST_TOKEN.length : 0);

  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ") || "";
  const interestsList = Array.isArray(interests) ? interests.join(", ") : (interests || "");
  const notes = `Source: AI Guide Page | Level: ${level || "not specified"} | Interests: ${interestsList}`;

  // Insert into Supabase Personal OS contacts
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        contact_type: "ai_community",
        beta_status: "to_invite",
        source: "ai_guide_page",
        notes: notes
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase error:", err);
    }
  } catch (e) {
    console.error("Supabase insert failed:", e);
  }

  // Create Todoist task in Work Log project
  try {
    const todoistRes = await fetch("https://api.todoist.com/api/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TODOIST_TOKEN}`
      },
      body: JSON.stringify({
        content: `New AI Guide signup — ${name}`,
        description: `Email: ${email}${phone ? " | Phone: " + phone : ""}\nLevel: ${level || "not specified"}\nInterests: ${interestsList}`,
        project_id: TODOIST_PROJECT_ID
      })
    });
    const todoistBody = await todoistRes.text();
    console.log("Todoist status:", todoistRes.status, "body:", todoistBody);
  } catch (e) {
    console.error("Todoist task failed:", e);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: true })
  };
};
