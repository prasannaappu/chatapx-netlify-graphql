import React, { useEffect, useRef, useState } from "react";

const SESSION_ID = "demo-session";

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ================= About Modal ================= */
function AboutModal({ open, onClose }) {
  if (!open) return null;
  function stop(e) { e.stopPropagation(); }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={stop}>
        <div className="modal-head">
          <strong>About this project</strong>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="modal-body">
          <p><strong>Chatapx — AI Chatbot</strong></p>

          <div className="modal-kvs" style={{ marginTop: 12 }}>
            <div>Author</div>
            <div>
              Prasanna S R —{" "}
              <a href="mailto:srprasanna602@gmail.com" style={{ color: "var(--accent-2)" }}>
                srprasanna602@gmail.com
              </a>
            </div>

            <div>Frontend</div><div>React + Vite (Netlify static hosting)</div>
            <div>Backend</div><div>Netlify Functions (Node 18)</div>
            <div>AI</div><div>OpenAI API (Responses / Chat Completions)</div>
            <div>Endpoint</div><div><code>/.netlify/functions/chat</code></div>
          </div>

          <p style={{ marginTop: 14 }}><strong>Highlights</strong></p>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Server-side API key via Netlify <em>Environment variables</em>.</li>
            <li>Clean chat UI with timestamps, “Thinking…” indicator, and auto-scroll.</li>
            <li>Serverless backend; easy to scale and maintain.</li>
          </ul>

          <p style={{ marginTop: 14 }}>
            For more details, contact{" "}
            <a href="mailto:srprasanna602@gmail.com" style={{ color: "var(--accent-2)" }}>
              srprasanna602@gmail.com
            </a>.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ================= App ================= */
export default function App() {
  // Fresh chat on load
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m your chatbot. Ask me anything.", ts: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [user, setUser] = useState(null);           // Netlify Identity user
  const [openedOnce, setOpenedOnce] = useState(false); // open widget once when logged out
  const viewportRef = useRef(null);

  /* ---- Netlify Identity wiring ---- */
  useEffect(() => {
    const id = window.netlifyIdentity;
    if (!id) return;
    if (!id._hasInit) id.init();

    function onLogin(u){ setUser(u); id.close(); }
    function onLogout(){ setUser(null); }
    function onInit(u){ if (u) setUser(u); }

    id.on("login", onLogin);
    id.on("logout", onLogout);
    id.on("init", onInit);

    const cu = id.currentUser();
    if (cu) setUser(cu);

    return () => {
      try {
        id.off("login", onLogin);
        id.off("logout", onLogout);
        id.off("init", onInit);
      } catch {}
    };
  }, []);

  // Auto-open auth widget once if logged out
  useEffect(() => {
    const id = window.netlifyIdentity;
    if (!id) return;
    if (!user && !openedOnce) {
      setOpenedOnce(true);
      id.open("signup"); // show Sign up first
    }
  }, [user, openedOnce]);

  // Auto-scroll on new messages/typing
  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function openLogin() {
    const id = window.netlifyIdentity;
    if (!id) return alert("Identity not loaded");
    id.open(user ? "login" : "signup");
  }
  function doLogout() {
    const id = window.netlifyIdentity;
    if (id) id.logout();
  }

  async function sendMessage() {
    if (!user) { openLogin(); return; }

    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    const userMsg = { role: "user", content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-session-id": SESSION_ID,
      };

      // include JWT so function can verify user if you enforced it
      if (typeof user?.jwt === "function") {
        try {
          const token = await user.jwt();
          headers["Authorization"] = "Bearer " + token;
        } catch {}
      }

      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      const replyText = data?.reply || data?.error || "Hmm, no reply received.";
      const botMsg = { role: "assistant", content: replyText, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again.", ts: Date.now() }
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Top-right controls (email removed) */}
      <div style={{ position: "absolute", right: 14, top: 14, display: "flex", gap: 8 }}>
        {user ? (
          <button className="about-btn" onClick={doLogout}>Logout</button>
        ) : (
          <button className="about-btn" onClick={openLogin}>Sign up / Log in</button>
        )}
      </div>

      {/* Chat area */}
      <div
        ref={viewportRef}
        className="history"
        style={{ paddingTop: 8, filter: !user ? "blur(2px)" : "none" }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div className="meta">
              <span>{m.role === "user" ? (user ? "You" : "Guest") : "Assistant"}</span>
              <span>•</span>
              <span>{new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className={`bubble ${m.role === "user" ? "me" : "bot"}`}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div className="meta"><span>Assistant</span> <span>•</span> <span>{nowTime()}</span></div>
            <div className="bubble bot">Thinking…</div>
          </div>
        )}
      </div>

      <div className="row" style={{ opacity: user ? 1 : 0.5, pointerEvents: user ? "auto" : "none" }}>
        <textarea
          className="input"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={ user ? "Type a message and hit Enter" : "Please sign up / log in to chat" }
          disabled={busy || !user}
        />
        <button className="btn" onClick={sendMessage} disabled={busy || !input.trim() || !user}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>

      {/* Floating About button (bottom-right, round FAB style) */}
      <button
        onClick={() => setShowAbout(true)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 60,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 22,
          fontWeight: "bold",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
        title="About this project"
      >
        ℹ
      </button>

      {/* Locked overlay (when logged out) */}
      {!user && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55))",
            zIndex: 40,
          }}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid rgba(255,255,255,.15)",
              padding: 20,
              borderRadius: 16,
              color: "var(--text)",
              width: "min(420px, 90vw)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Welcome to Chatapx</h3>
            <p style={{ margin: "0 0 14px", color: "var(--muted)" }}>
              Please sign up or log in to start chatting.
            </p>
            <button className="btn" onClick={openLogin}>Sign up / Log in</button>
          </div>
        </div>
      )}

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}
