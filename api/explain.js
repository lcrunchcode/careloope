// CareLoop AI explanations. Runs ONLY on the server (Vercel Function).
// The Gemini key is read from the GEMINI_API_KEY environment variable.
// It is never written in this file, never sent to the browser, and never committed to GitHub.

const TYPES = new Set(["fee", "rejected", "help", "noowner", "noack", "nobook", "missed", "noconf", "nosign", "lab"]);
const ROLES = new Set(["Lab", "Specialist", "Patient", "Manager"]);
const SEVS = new Set(["high", "med", "low"]);
const URGENCIES = new Set(["Routine", "Soon", "Urgent"]);

let hits = []; // simple per-instance rate limit (best effort)

function clean(body) {
  if (!body || typeof body !== "object") return null;
  const { type, sev, role, urgency, stage } = body;
  const hours = Number(body.hours);
  if (!TYPES.has(type) || !SEVS.has(sev) || !ROLES.has(role) || !URGENCIES.has(urgency)) return null;
  if (typeof stage !== "string" || !/^[A-Za-z0-9 \-]{1,40}$/.test(stage)) return null;
  if (!Number.isFinite(hours) || hours < 0 || hours > 5000) return null;
  return { type, sev, role, urgency, stage, hours: Math.round(hours) };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Use POST" }); }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured" });

  // Only our own site may call this.
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch (e) { ok = false; }
    if (!ok) return res.status(403).json({ error: "Not allowed" });
  }

  const now = Date.now();
  hits = hits.filter((t) => now - t < 60000);
  if (hits.length >= 20) return res.status(429).json({ error: "Too many requests, try again in a minute" });
  hits.push(now);

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const f = clean(body);
  if (!f) return res.status(400).json({ error: "Bad request" });

  const model = /^[a-z0-9.\-]+$/.test(process.env.GEMINI_MODEL || "") ? process.env.GEMINI_MODEL : "gemini-flash-latest";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

  const system =
    "You help care coordinators follow up abnormal screening results. " +
    "Explain in at most 60 words why this alert matters and the one next action. " +
    "Use only the facts given. Never diagnose, never give medical advice, never invent patient details. " +
    "Plain English, no lists, no headings.";
  const prompt =
    "Alert facts (synthetic demo data):\n" +
    "- Alert type: " + f.type + "\n- Severity: " + f.sev + "\n- Who must act: " + f.role + "\n" +
    "- Case urgency: " + f.urgency + "\n- Current stage: " + f.stage + "\n- Hours since last progress: " + f.hours;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 160 },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) { console.error("Gemini status", r.status); return res.status(502).json({ error: "AI service error" }); }
    const j = await r.json();
    const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    const text = (parts || []).map((p) => p.text || "").join("").trim().slice(0, 600);
    if (!text) return res.status(502).json({ error: "Empty AI answer" });
    return res.status(200).json({ text });
  } catch (e) {
    console.error("Gemini call failed", e && e.name);
    return res.status(502).json({ error: "AI service unavailable" });
  }
};
