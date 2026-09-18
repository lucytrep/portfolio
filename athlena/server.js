const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

loadEnvFile();

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const publicDir = __dirname;
const faqPath = path.join(__dirname, "data", "athlena-faq.json");
const logsDir = path.join(__dirname, "logs");
const metricsPath = path.join(logsDir, "athlena-events.jsonl");
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const faqEntries = JSON.parse(fs.readFileSync(faqPath, "utf8"));

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/chat") {
    return handleChat(req, res);
  }

  if (req.method === "POST" && url.pathname === "/api/track") {
    return handleTrack(req, res);
  }

  if (req.method === "GET" && url.pathname === "/api/metrics") {
    return handleMetrics(res);
  }

  return serveStatic(url.pathname, res);
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try: PORT=3001 node server.js`);
    process.exit(1);
  }
  console.error("Server failed to start:", error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Athlena site running at http://${HOST}:${PORT}`);
});

async function handleChat(req, res) {
  const body = await readJsonBody(req);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const sessionId = sanitizeSessionId(body?.sessionId);

  if (!message) {
    return sendJson(res, 400, { error: "Message is required." });
  }

  if (!anthropicKey) {
    return sendJson(res, 500, {
      error: "ANTHROPIC_API_KEY is missing on the server."
    });
  }

  const matches = rankFaqMatches(message, faqEntries).slice(0, 3);

  try {
    const reply = await generateClaudeReply(message, matches);
    appendMetric({
      event: "response_served",
      sessionId,
      metadata: {
        source: "claude",
        matchIds: matches.map((match) => match.id)
      }
    });

    return sendJson(res, 200, {
      reply,
      source: "claude",
      matches: matches.map((match) => ({
        id: match.id,
        question: match.question,
        escalation: match.escalation
      }))
    });
  } catch (error) {
    console.error("Claude request failed:", error);
    appendMetric({
      event: "fallback_used",
      sessionId,
      metadata: {
        reason: "claude_error"
      }
    });
    return sendJson(res, 502, {
      error: "The chatbot is having trouble responding right now."
    });
  }
}

async function handleTrack(req, res) {
  const body = await readJsonBody(req);
  const event = typeof body?.event === "string" ? body.event.trim() : "";
  const sessionId = sanitizeSessionId(body?.sessionId);
  const metadata = isPlainObject(body?.metadata) ? body.metadata : {};

  if (!event) {
    return sendJson(res, 400, { error: "Event name is required." });
  }

  appendMetric({ event, sessionId, metadata });
  return sendJson(res, 200, { ok: true });
}

function handleMetrics(res) {
  const events = readMetrics();
  const summary = {
    totalEvents: events.length,
    byEvent: {},
    uniqueSessions: new Set(events.map((event) => event.sessionId).filter(Boolean)).size,
    messagesSent: 0,
    opens: 0,
    impressions: 0
  };

  for (const event of events) {
    summary.byEvent[event.event] = (summary.byEvent[event.event] || 0) + 1;
  }

  summary.messagesSent = summary.byEvent.message_sent || 0;
  summary.opens = summary.byEvent.chat_open || 0;
  summary.impressions = summary.byEvent.launcher_impression || 0;

  return sendJson(res, 200, summary);
}

async function generateClaudeReply(message, matches) {
  const contextBlock = matches.length
    ? matches
        .map((match, index) => {
          return `${index + 1}. Q: ${match.question}\nA: ${match.response}\nEscalate: ${match.escalation || "none"}`;
        })
        .join("\n\n")
    : "No FAQ matches found.";

  const payload = {
    model: anthropicModel,
    max_tokens: 320,
    system:
      "You are Athlena, a warm event support chatbot for attendees. Be calm, clear, reassuring, and concise. Use the provided event FAQ context as your source of truth. Do not invent venue-specific details. When uncertain, say the attendee should confirm with staff. Prioritize accessibility, emotional safety, and how to reach a human quickly.",
    messages: [
      {
        role: "user",
        content: `Attendee question: ${message}\n\nApproved FAQ context:\n${contextBlock}`
      }
    ]
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((item) => item.type === "text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n")
        .trim()
    : "";

  if (!text) {
    throw new Error("Anthropic response did not contain text.");
  }

  return text;
}

function rankFaqMatches(message, entries) {
  const normalized = normalize(message);
  const tokens = new Set(normalized.split(" ").filter(Boolean));

  return entries
    .map((entry) => {
      let score = 0;
      const haystack = normalize(
        `${entry.question} ${entry.response} ${(entry.keywords || []).join(" ")}`
      );

      for (const token of tokens) {
        if ((entry.keywords || []).includes(token)) {
          score += 5;
        } else if (haystack.includes(token)) {
          score += 2;
        }
      }

      return {
        ...entry,
        score
      };
    })
    .sort((a, b) => b.score - a.score);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return sendText(res, 403, "Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        return sendText(res, 404, "Not Found");
      }
      return sendText(res, 500, "Server Error");
    }

    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".woff2": "font/woff2"
  };
  return types[extension] || "application/octet-stream";
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });

    req.on("error", () => resolve(null));
  });
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function appendMetric({ event, sessionId, metadata }) {
  const record = {
    timestamp: new Date().toISOString(),
    event,
    sessionId,
    metadata: metadata || {}
  };
  fs.appendFileSync(metricsPath, JSON.stringify(record) + "\n");
}

function readMetrics() {
  if (!fs.existsSync(metricsPath)) {
    return [];
  }

  return fs
    .readFileSync(metricsPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function sanitizeSessionId(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
