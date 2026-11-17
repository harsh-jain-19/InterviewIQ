InterviewIQ - AI Interview Preparation Platform (MERN + LLM)
Practise mock interviews for any role. Answer by typing or speaking, get a 0-100 score, strengths, improvements and a model answer for every question, then track progress and compete on a leaderboard.

Features
Auth: register/login with JWT and bcrypt-hashed passwords
AI question generation: LLM creates role-specific questions (technical / behavioral / mixed, 3 difficulty levels); generated questions are saved to the question bank
AI answer evaluation: score, strengths, improvements, model answer, plus an end-of-session coaching summary
Speech-to-text: answer by voice using the browser Web Speech API (Chrome/Edge), no extra cost
Question bank: search, filter, paginate, add and delete questions
Progress tracking: score-over-time line chart, average by role, interview history with full reports
Leaderboard: XP-based ranking, with harder difficulty earning more XP
Demo mode: works without an API key (seeded questions + keyword-based scoring)
Tech stack
Layer	Tools
Frontend	React 18, Vite, React Router, Recharts, Web Speech API
Backend	Node.js, Express, JWT, Helmet, rate limiting
Database	MongoDB + Mongoose
AI	Anthropic API (@anthropic-ai/sdk), swappable in server/services/llm.js
Run locally
Prerequisites: Node 18+ and MongoDB (local or Atlas).

# 1. Install
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#   set MONGO_URI and JWT_SECRET
#   optional: set ANTHROPIC_API_KEY for real AI (leave empty for demo mode)

# 3. Load starter questions
npm run seed

# 4. Start (two terminals)
npm run server     # http://localhost:5000
npm run client     # http://localhost:5173
API overview
Method	Endpoint	Purpose
POST	/api/auth/register, /api/auth/login	Authentication
GET	/api/auth/me	Current user
GET/POST/DELETE	/api/questions	Question bank
POST	/api/interviews/start	Generate questions, create session
POST	/api/interviews/:id/answer	Evaluate one answer
POST	/api/interviews/:id/finish	Final score, summary, XP
GET	/api/interviews, /api/interviews/:id	History and report
GET	/api/progress, /api/leaderboard	Stats
Architecture
React (Vite)  --/api-->  Express  -->  MongoDB (users, questions, sessions)
                            |
                            +--> services/llm.js --> Anthropic API (fallback: heuristic scoring)
Browser mic --> Web Speech API --> transcript --> same answer endpoint
Design decisions worth explaining in interviews
Answers are scored server-side only, and model answers are hidden until a question is answered, so users cannot read them in the network tab ahead of time.
LLM failures degrade gracefully to the question bank and heuristic scoring instead of breaking the session.
LLM output is requested as JSON, then validated and clamped (score 0-100, capped array sizes) before saving.
XP and stats use $inc atomic updates to avoid race conditions.
Voice is transcribed on the client, so no audio is uploaded or stored.
Deploy
Database: MongoDB Atlas
API: Render/Railway (set env vars from server/.env.example, CLIENT_URL = your frontend URL)
Frontend: Vercel/Netlify, build npm run build in client, set VITE_API_URL=https://your-api/api
Ideas to extend
Resume upload that tailors questions to the candidate
Timed answers and a webcam/eye-contact practice mode
Admin panel to moderate the question bank
Whisper or Deepgram for higher-accuracy transcription
Unit tests (Jest + Supertest) for the routes
