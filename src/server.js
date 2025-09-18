import express from "express";
const app = express();
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => { console.log(req.method, req.url); next(); });
}

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

import rateLimit from "express-rate-limit";
const runLimiter = rateLimit({ windowMs: 60_000, max: 30 }); // 30/min per IP


dotenv.config();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Static & parsers
app.use("/run", runLimiter);
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "200kb" }));
app.use((req, res, next) => {
  req.setTimeout(15_000); // 15s
  next();
});


// ── Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// ── Home
app.get("/", (req, res) => {
  res.render("index", { title: "CodeBook - Handwriting Compiler" });
});

app.get("/healthz", (req, res) => res.send("OK"));

/* ===== Judge0 setup ===== */
const JUDGE0_URL =
  process.env.JUDGE0_URL?.trim() || "https://ce.judge0.com";

const JUDGE0_HEADERS = {
  "Content-Type": "application/json",
  ...(process.env.JUDGE0_KEY
    ? { "X-Auth-Token": process.env.JUDGE0_KEY.trim() }
    : {}),
};

// UI language → Judge0 language_id
const LANGUAGE_ID = {
  "C": 50,
  "C#": 51,
  "C++": 54,
  "Go": 60,
  "Java": 62,
  "JavaScript": 63,
  "Kotlin": 78,
  "PHP": 68,
  "Python": 71,
  "Ruby": 72,
  "Rust": 73,
  "Swift": 83,
  "TypeScript": 74,
};

/* ===== Run endpoint ===== */
app.post("/run", async (req, res) => {
  try {
    const { language, source, stdin = "" } = req.body;

    const language_id = LANGUAGE_ID[language];
    if (!language_id) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const payload = {
      source_code: source ?? "",
      language_id,
      stdin,
      // optional limits:
      // cpu_time_limit: 5,
      // memory_limit: 512000,
    };

    const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
    const r = await fetch(url, {
      method: "POST",
      headers: JUDGE0_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("Judge0 error:", r.status, text);
      return res.status(502).json({ error: "Judge0 request failed", status: r.status, body: text });
    }

    const data = await r.json();
    res.json({
      stdout: data.stdout,
      stderr: data.stderr,
      compile_output: data.compile_output,
      time: data.time,
      memory: data.memory,
      status: data.status, // { id, description }
    });
  } catch (e) {
    console.error("Server /run error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ===== Start ===== */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
