# CodeBook — Handwriting-powered Web Compiler (Early Access)

https://ce.judge0.com✍️ CodeBook – Handwriting Code Compiler

CodeBook is a web-based platform that lets you write code by typing or handwriting, and run it directly in your browser using the Judge0 API.
It supports multiple programming languages and provides real-time execution results.

🌍 Live Demo: https://your-app.onrender.com

This Early Access build focuses on a clean editor + output panel, stdin box, and language picker.

> ✍️ Handwriting recognition is included (Tesseract.js).  
> 🧪 Interactive “enter input during run” is **not** shipped in this EA build—use the **Program Input (stdin)** box before running.

---

## ✨ Features

🖊️ Handwriting mode (draw code on canvas, OCR with Tesseract)

⌨️ Typing mode with syntax-highlighted editor

🌙 Dark/Light theme toggle

⚡ Run code in multiple languages (JavaScript, Python, C++, Java, etc.)

📤 Save, share, and copy your code or output

🚀 Hosted on Render, auto-deploys from GitLab

---

## 🛠️ Tech Stack

Frontend: HTML, CSS (Tailwind), JavaScript

Backend: Node.js + Express

Compiler API: Judge0

OCR: Tesseract.js

Deployment: Render + GitLab CI/CD

## 🚀 Deployment

This project is deployed on Render.
Every push to the main branch in GitLab triggers an auto-deploy.
URL https://codebook-5glo.onrender.com

## 📌 Roadmap

 Improve handwriting recognition accuracy

 Add interactive input for running programs

 Add user authentication & save sessions

## 📄 License

MIT License © 2025 [Ayush Barman]