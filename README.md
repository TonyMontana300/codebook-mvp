# CodeBook — Handwriting-powered Web Compiler (Early Access)

CodeBook is a playful web IDE that lets you write code with a stylus or keyboard and run it in the cloud via [Judge0](https://judge0.com/).  
This Early Access build focuses on a clean editor + output panel, stdin box, and language picker.

> ✍️ Handwriting recognition is included (Tesseract.js).  
> 🧪 Interactive “enter input during run” is **not** shipped in this EA build—use the **Program Input (stdin)** box before running.

---

## ✨ Features

- Keyboard **or** handwriting entry (canvas → OCR via Tesseract.js)
- Language strip (C, C++, C#, Go, Java, JS/TS, PHP, Python, Ruby, Rust, Swift…)
- **Program Input (stdin)** textarea
- Judge0 integration (compile/run, show stdout/stderr/compile output)
- Dark/light theme toggle
- Save / Share (copyable URL payload) / Copy output

---

## 🧱 Tech

- Frontend: Vanilla JS + Tailwind styles + EJS templates
- Backend: Node.js + Express
- Runner: Judge0 CE (public or self-hosted)
