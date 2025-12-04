// ===== STATE =====
let currentLanguage = "JavaScript";
let isRunning = false;
let isHandwritingMode = false;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = "pen"; // 'pen' or 'eraser'
let penSize = 2;
let penColor = "#2563eb";
let eraserSize = 10;
let isDarkMode = false;

// ===== DOM refs (assigned after DOMContentLoaded) =====
let languageElements;
let textarea;
let outputArea;
let runBtn;
let clearBtn;
let saveBtn;
let shareBtn;
let copyOutputBtn;
let clearOutputBtn;
let selectedLangSpan;
let statusIndicator;

let typingModeBtn;
let handwritingModeBtn;
let typingContainer;
let handwritingContainer;
let canvas;
let ctx;
let clearCanvasBtn;
let recognizeBtn;
let recognizedText;

let penTool;
let eraserTool;
let penSizeSelect;
let penColorInput;

let modeHint;

// ---------- boilerplates ----------
const BOILERPLATES = {
  JavaScript: `// JavaScript Boilerplate
console.log("Hello from CodeBook");`,

  TypeScript: `// TypeScript Boilerplate
const message: string = "Hello from CodeBook";
console.log(message);`,

  Python: `# Python Boilerplate
print("Hello from CodeBook")`,

  Java: `// Java Boilerplate
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CodeBook");
    }
}`,

  "C++": `// C++ Boilerplate
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from CodeBook" << endl;
    return 0;
}`,

  C: `// C Boilerplate
#include <stdio.h>

int main() {
    printf("Hello from CodeBook");
    return 0;
}`,

  "C#": `// C# Boilerplate
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from CodeBook");
    }
}`,

  Go: `// Go Boilerplate
package main
import "fmt"

func main() {
    fmt.Println("Hello from CodeBook")
}`,

  PHP: `<?php
// PHP Boilerplate
echo "Hello from CodeBook";
?>`,

  Ruby: `# Ruby Boilerplate
puts "Hello from CodeBook"`,

  Kotlin: `// Kotlin Boilerplate
fun main() {
    println("Hello from CodeBook")
}`,

  Swift: `// Swift Boilerplate
import Foundation

print("Hello from CodeBook")`,

  HTML: `<!DOCTYPE html>
<html>
<head>
  <title>CodeBook</title>
</head>
<body>

  <h1>Hello from CodeBook</h1>

</body>
</html>`,

  Rust: `// Rust Boilerplate
  fn main() {
      println!("Hello from CodeBook");
  }`
};


// ----- pseudo-interactive stdin -----
let interactiveEnabled = false;
let interactiveInputs = []; // collected lines for this session

let interactiveToggle; // #interactive-toggle
let askModal;         // #ask-modal
let askTitle;         // #ask-title
let askMsg;           // #ask-message
let askInput;         // #ask-input
let askOk;            // #ask-ok
let askCancel;        // #ask-cancel

// ---------- helpers ----------
function byId(id, { silent = false } = {}) {
  const el = document.getElementById(id);
  if (!el && !silent) console.warn(`[client] ⚠️ element #${id} not found`);
  return el;
}

function loadTheme() {
  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme !== null) {
    isDarkMode = savedTheme === "true";
  } else {
    isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.documentElement.classList.toggle("dark", isDarkMode);
}

window.toggleTheme = function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle("dark", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
  updateStatus("ready", isDarkMode ? "Dark mode enabled" : "Light mode enabled");
  if (ctx) updateCanvasStyle();
};

function insertBoilerplate(lang) {
  if (!textarea) return;

  const currentCode = textarea.value.trim();
  const allBoilerplates = Object.values(BOILERPLATES);

  // 1. If empty → insert boilerplate
  if (currentCode === "") {
    textarea.value = BOILERPLATES[lang] || "";
    updateStatus("ready", `${lang} boilerplate inserted`);
    return;
  }

  // 2. If current code IS one of the boilerplates → replace it
  if (allBoilerplates.includes(currentCode)) {
    textarea.value = BOILERPLATES[lang] || "";
    updateStatus("ready", `${lang} boilerplate replaced`);
    return;
  }

  // 3. Otherwise → user typed something manually → do NOTHING
  return;
}

// ---------- language ----------
function selectLanguage(selectedEl) {
  if (!selectedEl) return;
  const lang = selectedEl.getAttribute("data-lang");
  currentLanguage = lang;

  if (textarea) textarea.placeholder = `Write your ${lang} code here...`;
  if (selectedLangSpan) selectedLangSpan.textContent = `(${lang})`;

  languageElements.forEach((el) => {
    el.classList.remove("selected");
    el.setAttribute("aria-checked", "false");
  });
  selectedEl.classList.add("selected");
  selectedEl.setAttribute("aria-checked", "true");

  updateStatus("ready", `Ready for ${lang}`);
  insertBoilerplate(lang);
}

// ---------- tools / canvas ----------
function selectTool(tool) {
  currentTool = tool;

  if (penTool && eraserTool && canvas) {
    if (tool === "pen") {
      penTool.classList.add("active");
      eraserTool.classList.remove("active");
      canvas.style.cursor = "crosshair";
    } else {
      eraserTool.classList.add("active");
      penTool.classList.remove("active");
      canvas.style.cursor = "grab";
    }
  }

  updateCanvasStyle();
  updateStatus("ready", `${tool === "pen" ? "Pen" : "Eraser"} tool selected`);
}

function updateCanvasStyle() {
  if (!ctx) return;
  if (currentTool === "pen") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
  } else {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = eraserSize;
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function initializeCanvas() {
  if (!canvas || !ctx) return;

  resizeCanvas();
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  canvas.addEventListener("touchstart", handleTouch);
  canvas.addEventListener("touchmove", handleTouch);
  canvas.addEventListener("touchend", stopDrawing);

  if (clearCanvasBtn) clearCanvasBtn.addEventListener("click", clearCanvas);
  if (recognizeBtn) recognizeBtn.addEventListener("click", recognizeHandwriting);

  updateCanvasStyle();
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  updateCanvasStyle();
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function getTouchPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.touches[0].clientX - rect.left,
    y: e.touches[0].clientY - rect.top,
  };
}
function startDrawing(e) {
  isDrawing = true;
  const pos = getMousePos(e);
  lastX = pos.x;
  lastY = pos.y;
}
function draw(e) {
  if (!isDrawing || !ctx) return;
  const pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
}
function stopDrawing() {
  isDrawing = false;
}
function handleTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent(
    e.type === "touchstart" ? "mousedown" : e.type === "touchmove" ? "mousemove" : "mouseup",
    { clientX: touch.clientX, clientY: touch.clientY }
  );
  canvas.dispatchEvent(mouseEvent);
}
function clearCanvas() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (recognizedText) recognizedText.value = "";
  updateStatus("ready", "Canvas cleared");
}

// ---------- OCR (Tesseract) ----------
async function recognizeHandwriting() {
  if (!canvas || !ctx || !recognizedText) return;

  if (typeof Tesseract === "undefined") {
    recognizedText.value = "❌ OCR not available. Did you include Tesseract.js in your HTML?";
    return;
  }

  setRunning(true);
  updateStatus("running", "Recognizing handwriting…");
  recognizedText.value = "🔍 Reading handwriting… this can take a few seconds.";

  try {
    const tempCanvas = document.createElement("canvas");
    const tctx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tctx.drawImage(canvas, 0, 0);

    const { data } = await Tesseract.recognize(tempCanvas, "eng");
    let text = data && data.text ? data.text : "";

    text = text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\t/g, "  ")
      .replace(/\r/g, "")
      .replace(/[ ]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      recognizedText.value = "😕 I couldn’t read anything. Try writing larger, higher contrast, and more neatly.";
      updateStatus("ready", "Nothing recognized");
      setRunning(false);
      return;
    }

    recognizedText.value = text;
    if (textarea) textarea.value = text;
    updateStatus("ready", "Handwriting recognized");
  } catch (err) {
    console.error("Tesseract error:", err);
    recognizedText.value = "❌ OCR error. Open the console for details.";
    updateStatus("ready", "Recognition failed");
  } finally {
    setRunning(false);
  }
}

// ---------- interactive (pseudo-interactive stdin) ----------
function onInteractiveToggleChanged() {
  interactiveEnabled = !!interactiveToggle?.checked;
  interactiveInputs = []; // reset on each toggle change
}

/** Show modal asking for one line of input. Resolves with entered string. */
function showAskModal(message) {
  return new Promise((resolve, reject) => {
    if (!askModal || !askInput || !askOk || !askCancel || !askMsg) {
      return reject(new Error("interactive modal not present"));
    }

    askMsg.textContent = message || "Input required:";
    askInput.value = "";
    askModal.classList.remove("hidden");
    askInput.focus();

    const done = (val, ok = true) => {
      askModal.classList.add("hidden");
      askOk.removeEventListener("click", onOk);
      askCancel.removeEventListener("click", onCancel);
      window.removeEventListener("keydown", onKey);
      ok ? resolve(val) : reject(new Error("cancelled"));
    };

    const onOk = () => done(askInput.value ?? "");
    const onCancel = () => done(null, false);
    const onKey = (e) => {
      if (e.key === "Enter") onOk();
      if (e.key === "Escape") onCancel();
    };

    askOk.addEventListener("click", onOk);
    askCancel.addEventListener("click", onCancel);
    window.addEventListener("keydown", onKey);
  });
}

/** Ask for multiple lines until user cancels; returns newline-joined string. */
async function collectInteractiveInputs(promptText = "Enter next input (Cancel to finish)") {
  const lines = [];
  while (true) {
    try {
      const line = await showAskModal(promptText);
      lines.push(line);
    } catch {
      break; // user cancelled
    }
  }
  return lines.join("\n");
}

// ---------- run / io ----------
// Replace your existing runCode() with this version
async function runCode() {
  if (isRunning) return;

  const code =
    isHandwritingMode && recognizedText?.value.trim()
      ? recognizedText.value.trim()
      : textarea?.value.trim() || "";

  if (!code) {
    showOutput("❌ Error: Please write some code first!", "error");
    return;
  }

  // 1) Gather stdin from the textarea
  const stdinBox = (byId("program-input")?.value ?? "").toString();
  let stdin = stdinBox;

  // 2) If pseudo-interactive is enabled, collect extra lines via the modal
  if (interactiveEnabled) {
    try {
      // Optional: set a nicer title for the modal if present
      if (askTitle) askTitle.textContent = "Program is asking:";
      const extra = await collectInteractiveInputs("Enter input line (Cancel to finish):");

      // Append to the pre-filled stdin (if any)
      if (extra && extra.length) {
        stdin = stdinBox ? `${stdinBox}\n${extra}` : extra;
      }
    } catch {
      // user cancelled immediately — we’ll just use whatever was already in the stdin box
    }
  }

  setRunning(true);
  updateStatus("running", "Submitting to compiler...");

  // 3) JS/TS prompt() shim (unchanged)
  let sourceToSend = code;
  if (currentLanguage === "JavaScript" || currentLanguage === "TypeScript") {
    const JS_PROMPT_SHIM =
      `const fs=require('fs');` +
      `const __in=fs.readFileSync(0,'utf8').split(/\\r?\\n/);` +
      `let __i=0;` +
      `global.prompt=(m='')=>(__i<__in.length?__in[__i++]:'' );`;
    sourceToSend = `${JS_PROMPT_SHIM}\n${code}`;
  }

  // 4) Submit to backend/Judge0
  try {
    const resp = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: currentLanguage,
        source: sourceToSend,
        stdin, // 👈 now includes modal-entered lines when enabled
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(text || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const {
      stdout = "",
      stderr = "",
      compile_output = "",
      time,
      memory,
      status,
    } = data || {};

    const parts = [];
    const statusText = status?.description || "";
    if (statusText) parts.push(`📌 Status: ${statusText}`);
    if (stdout) parts.push(`✅ Output:\n${stdout}`);
    if (stderr) parts.push(`⚠️ Error (stderr):\n${stderr}`);
    if (compile_output) parts.push(`🛠️ Compile error:\n${compile_output}`);
    parts.push(`\n⏱ time=${time ?? "?"}s • 🧠 mem=${memory ?? "?"} KB`);

    if (/time limit/i.test(statusText)) {
      parts.push(
        "\n💡 Hint: Your program may be waiting for input. Type it in the “Program Input (stdin)” box or use Pseudo-interactive mode and run again."
      );
    }

    showOutput(parts.join("\n\n") || "No output.");
    updateStatus("ready", "Execution finished");
  } catch (err) {
    showOutput(`❌ Request failed:\n${err.message}`);
    updateStatus("ready", "Execution error");
  } finally {
    setRunning(false);
  }
}

function clearCode() {
  if (!textarea) return;
  textarea.value = "";
  textarea.focus();
  updateStatus("ready", "Code cleared");
}
function saveCode() {
  if (!textarea) return;
  const code = textarea.value.trim();
  if (!code) return alert("No code to save!");

  const selectedLang = document.querySelector(".lang.selected");
  const ext = selectedLang?.getAttribute("data-ext") || ".txt";
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `codebook-${currentLanguage.toLowerCase()}${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus("ready", "Code saved successfully");
}
function shareCode() {
  if (!textarea) return;
  const code = textarea.value.trim();
  if (!code) return alert("No code to share!");
  const encoded = btoa(encodeURIComponent(JSON.stringify({ language: currentLanguage, code })));
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      alert("Share link copied to clipboard! 🔗");
      updateStatus("ready", "Share link copied");
    })
    .catch(() => {
      prompt("Copy this link to share your code:", shareUrl);
    });
}
function copyOutput() {
  if (!outputArea) return;
  const output = outputArea.textContent || "";
  navigator.clipboard.writeText(output).then(() => alert("Output copied to clipboard! 📋"));
}
function clearOutput() {
  if (outputArea) outputArea.textContent = "Output cleared. Ready for next execution... 🚀";
}
function showOutput(text) {
  if (!outputArea) return;
  outputArea.textContent = text;
  outputArea.scrollTop = 0;
}
function setRunning(running) {
  isRunning = running;
  if (!runBtn) return;
  runBtn.disabled = running;
  runBtn.innerHTML = running
    ? '<div class="loading-spinner"></div> <span>Running...</span>'
    : "<span>▶️ Run Code</span>";
}
function updateStatus(status, message) {
  if (!statusIndicator) return;
  statusIndicator.className = `status-indicator ${status}`;
  statusIndicator.title = message || "";
}

// ---------- mode switching ----------
function switchToTypingMode() {
  isHandwritingMode = false;
  typingContainer?.classList.remove("hidden");
  handwritingContainer?.classList.add("hidden");

  typingModeBtn?.classList.add("bg-green-600", "text-white");
  typingModeBtn?.classList.remove("bg-gray-200", "text-gray-700");
  handwritingModeBtn?.classList.add("bg-gray-200", "text-gray-700");
  handwritingModeBtn?.classList.remove("bg-green-600", "text-white");

  if (modeHint) modeHint.textContent = "(typing source)";
  updateStatus("ready", "Typing mode active");
}
function switchToHandwritingMode() {
  isHandwritingMode = true;
  typingContainer?.classList.add("hidden");
  handwritingContainer?.classList.remove("hidden");

  handwritingModeBtn?.classList.add("bg-green-600", "text-white");
  handwritingModeBtn?.classList.remove("bg-gray-200", "text-gray-700");
  typingModeBtn?.classList.add("bg-gray-200", "text-gray-700");
  typingModeBtn?.classList.remove("bg-green-600", "text-white");

  if (modeHint) modeHint.textContent = "(handwriting source)";
  updateStatus("ready", "Handwriting mode active");
  resizeCanvas();
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", () => {
  // look up elements AFTER DOM is ready
  languageElements     = document.querySelectorAll(".language-logos .lang");
  textarea             = byId("code-editor");

  // ---------- Auto Pair for Code Editor ----------
  const pairs = {
    "(": ")",
    "{": "}",
    "[": "]",
    '"': '"',
    "'": "'",
    "`": "`"
  };

  if (textarea) {
    textarea.addEventListener("keydown", (e) => {
      const open = e.key;
      const close = pairs[open];

      if (!close) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);

      e.preventDefault();

      textarea.value = before + open + close + after;
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    });
  }


  outputArea           = byId("output-area");
  runBtn               = byId("run-btn");
  clearBtn             = byId("clear-btn");
  saveBtn              = byId("save-btn");
  shareBtn             = byId("share-btn");
  copyOutputBtn        = byId("copy-output-btn");
  clearOutputBtn       = byId("clear-output-btn");
  selectedLangSpan     = byId("selected-lang");
  statusIndicator      = document.querySelector(".status-indicator");

  typingModeBtn        = byId("typing-mode-btn", { silent: true });
  handwritingModeBtn   = byId("handwriting-mode-btn", { silent: true });
  typingContainer      = byId("typing-container", { silent: true });
  handwritingContainer = byId("handwriting-container", { silent: true });
  canvas               = byId("handwriting-canvas", { silent: true });
  ctx                  = canvas ? canvas.getContext("2d") : null;
  clearCanvasBtn       = byId("clear-canvas-btn", { silent: true });
  recognizeBtn         = byId("recognize-btn", { silent: true });
  recognizedText       = byId("recognized-text", { silent: true });
  penTool              = byId("pen-tool", { silent: true });
  eraserTool           = byId("eraser-tool", { silent: true });
  penSizeSelect        = byId("pen-size", { silent: true });
  penColorInput        = byId("pen-color", { silent: true });
  modeHint             = byId("mode-hint", { silent: true });

  // interactive UI
  interactiveToggle = byId("interactive-toggle", { silent: true });
  askModal          = byId("ask-modal",        { silent: true });
  askTitle          = byId("ask-title",        { silent: true });
  askMsg            = byId("ask-message",      { silent: true });
  askInput          = byId("ask-input",        { silent: true });
  askOk             = byId("ask-ok",           { silent: true });
  askCancel         = byId("ask-cancel",       { silent: true });

  if (interactiveToggle) {
    interactiveToggle.addEventListener("change", onInteractiveToggleChanged);
    onInteractiveToggleChanged();
  }

  const hasHandwriting = !!handwritingContainer;

  // Bind base buttons
  if (runBtn)         runBtn.addEventListener("click", () => runCode().catch(console.error));
  if (clearBtn)       clearBtn.addEventListener("click", clearCode);
  if (saveBtn)        saveBtn.addEventListener("click", saveCode);
  if (shareBtn)       shareBtn.addEventListener("click", shareCode);
  if (copyOutputBtn)  copyOutputBtn.addEventListener("click", copyOutput);
  if (clearOutputBtn) clearOutputBtn.addEventListener("click", clearOutput);

  // Handwriting UI
  if (hasHandwriting) {
    if (typingModeBtn)      typingModeBtn.addEventListener("click", switchToTypingMode);
    if (handwritingModeBtn) handwritingModeBtn.addEventListener("click", switchToHandwritingMode);

    if (penTool)       penTool.addEventListener("click", () => selectTool("pen"));
    if (eraserTool)    eraserTool.addEventListener("click", () => selectTool("eraser"));
    if (penSizeSelect) penSizeSelect.addEventListener("change", (e) => { penSize = parseInt(e.target.value, 10); updateCanvasStyle(); });
    if (penColorInput) penColorInput.addEventListener("change", (e) => { penColor = e.target.value; updateCanvasStyle(); });

    initializeCanvas();
    if (modeHint) modeHint.textContent = "(typing source)";
  } else {
    isHandwritingMode = false;
  }

  // Language tiles
  languageElements.forEach((el) => {
    el.addEventListener("click", () => selectLanguage(el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectLanguage(el);
      }
    });
  });

  // Theme first
  loadTheme();

  // Load shared if present
  const params  = new URLSearchParams(window.location.search);
  const shared  = params.get("share");
  if (shared && textarea) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(shared)));
      textarea.value = decoded.code || "";
      const langEl = Array.from(languageElements).find(
        (el) => el.getAttribute("data-lang") === decoded.language
      );
      if (langEl) selectLanguage(langEl);
      updateStatus("ready", "Shared code loaded");
    } catch (e) {
      console.error("Failed to load shared code:", e);
    }
  }

  // Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        runCode();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCode();
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        clearCode();
      }
    }
  });

  if (textarea) {
    textarea.addEventListener("input", () => updateStatus("ready", "Code modified"));
  }

  // System theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (localStorage.getItem("darkMode") === null) {
      isDarkMode = e.matches;
      document.documentElement.classList.toggle("dark", isDarkMode);
    }
  });

  // Initial UI
  if (modeHint) modeHint.textContent = "(typing source)";
  updateStatus("ready", "Ready to code");

  // Insert default (already selected) language boilerplate on load
  const defaultLang = document.querySelector(".lang.selected");
  if (defaultLang) {
    selectLanguage(defaultLang);
  }


  console.log("[client] ✅ listeners attached");
});
