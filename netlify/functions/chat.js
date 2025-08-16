// netlify/functions/chat.js
// Node 18+ (built-in fetch). No imports needed.

function json(res, status = 200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Session-Id",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(res),
  };
}

const conversations = new Map(); // in-memory per instance

function getSession(headers) {
  return headers["x-session-id"] || headers["X-Session-Id"] || "demo-session";
}

async function generateReply(messages) {
  // Safety check so we see clear error text in UI
  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OPENAI_API_KEY on server (Netlify → Environment variables)." };
  }

  // Convert our minimal history into chat messages
  const chatMsgs = [];
  // You can add a system prompt to steer tone
  chatMsgs.push({ role: "system", content: "You are a concise, helpful assistant." });

  for (const m of messages.slice(-8)) {
    if (!m || !m.content) continue;
    if (m.role === "user" || m.role === "assistant") {
      chatMsgs.push({ role: m.role, content: m.content });
    }
  }

  // Call the Chat Completions API (stable + simple)
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: chatMsgs,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("OpenAI API error:", resp.status, errText);
    // Return the error text to UI so you can see what’s wrong (401/429/etc.)
    return { error: `OpenAI error ${resp.status}: ${errText.slice(0, 500)}` };
  }

  const data = await resp.json();
  const text =
    data?.choices?.[0]?.message?.content?.trim?.() ||
    data?.choices?.[0]?.message?.content ||
    "";

  if (!text) {
    return { error: "OpenAI returned an empty message." };
  }

  return { reply: text };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json({});

  try {
    // Toggle to enforce login if you want later
    const REQUIRE_LOGIN = false;
    const user = event.clientContext && event.clientContext.user;
    if (REQUIRE_LOGIN && !user) {
      return json({ error: "Unauthorized. Please log in." }, 401);
    }

    const sessionId = getSession(event.headers);

    if (event.httpMethod === "GET") {
      // health check
      return json({ ok: true, sessionId });
    }

    if (event.httpMethod === "POST") {
      let payload = {};
      try {
        payload = JSON.parse(event.body || "{}");
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      const { message } = payload;
      if (!message || !String(message).trim()) {
        return json({ error: "Message is required" }, 400);
      }

      const history = conversations.get(sessionId) ?? [];
      history.push({ role: "user", content: message, ts: Date.now() });

      const ai = await generateReply(history);

      // Surface errors directly so you see them in the chat bubble
      if (ai.error) {
        history.push({ role: "assistant", content: ai.error, ts: Date.now() });
        conversations.set(sessionId, history);
        return json({ reply: ai.error });
      }

      history.push({ role: "assistant", content: ai.reply, ts: Date.now() });
      conversations.set(sessionId, history);

      return json({ reply: ai.reply });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("Function crash:", e);
    return json({ error: "Server error" }, 500);
  }
};
