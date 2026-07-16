**Live demo:** https://life-debugger-gamma.vercel.app/

# Life Debugger

Debug your daily routine — track habits, trace what's draining your energy, and ask why.

## The idea

Life Debugger treats a tired, overloaded day like a program throwing an exception. Instead of guessing why you feel run down, you log your routine — sleep, work hours, exercise, screen time, caffeine — and the app traces which habit is most likely responsible, in the style of a stack trace, then suggests the smallest patch to fix it.

It's not a diagnostic tool and it doesn't replace a doctor. It's a pattern-finder: it looks at your logged data and surfaces plausible lifestyle contributors to how you're feeling, the same way a debugger points at the line of code most likely causing a bug.

This project was inspired by watching my mom run herself ragged with an overloaded work schedule, and wanting a tool that could actually point at *why* on any given day she felt drained — not just tell her to "get more sleep."

## Features

- **Diary tab** — log sleep, work hours, exercise, screen time, and caffeine for any day (past, present, or future), with an instant "energy score" and a stack-trace-style breakdown of what's likely dragging it down.
- **Calendar view** — navigate your logged history visually, color-coded by day, and edit any previous entry.
- **Ask tab** — a chat assistant that reads your logged history and answers questions like *"why do I have a headache right now?"* by looking for correlations in your data (not diagnosing).
- **Chat history** — multiple saved conversations, switchable, persisted across sessions.
- **Energy trend chart** — visualizes your logged energy score over the last 7 days.

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS v4, Recharts, Lucide icons
- **Backend:** Node.js + Express, proxying requests to the Gemini API
- **Persistence:** browser `localStorage` (no database needed for this prototype)

## Setup

### 1. Frontend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`.

### 2. Backend
```bash
cd server
npm install
```
Create a `server/.env` file:
```
GEMINI_API_KEY=your_key_here
```
Get a key at [aistudio.google.com](https://aistudio.google.com).

Then run:
```bash
node index.js
```
Runs at `http://localhost:3001`.

Both need to be running at the same time for the chat feature to work — the Diary tab works standalone.

## Disclaimer

This is a lifestyle pattern demo, not medical advice. The scoring is an illustrative heuristic, and the assistant looks for correlations in logged routines — it does not diagnose. Persistent, severe, or worsening symptoms are worth mentioning to a doctor.

## Future work

- Multi-user accounts with a real backend (e.g. Supabase/Firebase), so data persists across devices instead of being tied to one browser via localStorage
- Real correlation analysis across weeks of data instead of a hand-tuned heuristic
- Calendar or wearable integration for automatic logging
