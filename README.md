# Speak Sprout — English Speaking Coach

Speak Sprout is a browser-based English speaking practice app. It combines guided pronunciation drills, a level-aware phrase curriculum, dictionary audio, and AI roleplay conversations.

**Live app:** [speak-sprout-pronunciation-coach.vercel.app](https://speak-sprout-pronunciation-coach.vercel.app)  
**GitHub:** [voidsanskar-crypto/speak-sprout-pronunciation-coach](https://github.com/voidsanskar-crypto/speak-sprout-pronunciation-coach)

## Features

- **Adaptive curriculum:** 173 phrases across Beginner, Intermediate, and Advanced levels. The five-line assessment, recent practice scores, weak sounds, and selected learning goals guide daily practice.
- **Speaking practice:** Browser speech recognition scores how closely recognized words match the prompt. Feedback marks exact and close matches, flags extra words, and offers suggestions for replay and review. The score reflects the transcript and leaves individual sounds unscored.
- **Voice replay:** Where browser recording is available, phrase practice pairs the temporary recording with normal and slow examples. Clips are not uploaded or saved as permanent recordings.
- **AI roleplay:** Practice café, hotel, recruiter, or custom scenarios with a Groq-powered conversation partner. Learners can speak through browser speech recognition or type; recognized speech is editable before sending. Roleplay review gives transcript-based language and task feedback, plus an estimated speaking rate for recorded replies.
- **Pronunciation dictionary:** Look up arbitrary English words for dictionary-provided phonetic spellings and audio where available, then practice saying the word. Some entries may have multiple variants or missing audio.
- **Practice your own text:** Rehearse pasted sentences and short scripts with browser recognition and an approximate spelling-based guide.
- **Progress and profile:** Scores, selected goals, profile details, and progress are stored in browser local storage. They do not sync between devices; the profile page is not secure authentication.

## Tech stack

- React 19, TypeScript, TanStack Start and TanStack Router
- Vite, Tailwind CSS 4, shadcn/ui and Radix UI
- Browser `SpeechRecognition`, `MediaRecorder`, and `SpeechSynthesis` APIs
- Groq Chat Completions API for roleplay and conversation review; the key is read only on the server
- Free Dictionary API for word phonetics and pronunciation audio
- Vercel deployment (Nitro Vercel preset); GitHub Pages base path remains supported
- Local storage for learner progress and preferences; no app database or account sync

## Run locally

Requires Node.js and npm.

```sh
git clone https://github.com/voidsanskar-crypto/speak-sprout-pronunciation-coach.git
cd speak-sprout-pronunciation-coach
npm install
```

For AI roleplay locally, copy `.env.example` to `.env.local` and set a Groq key:

```env
GROQ_API_KEY=your_groq_api_key
```

Keep API keys out of source control. On Vercel, add `GROQ_API_KEY` in the project’s Environment Variables settings and redeploy.

```sh
npm run dev
```

Vercel sets its deployment environment automatically and runs the production build.

## Project structure

```text
src/
  assets/       Mascot art and bundled visual assets
  components/   Shared UI and Speak Sprout-specific components
  hooks/        Speech capture, progress, translation, and browser hooks
  lib/          Curriculum, scoring, local state, speech, and AI functions
  routes/       Home, practice, assessment, roleplay, dictionary, profile, progress
  test/         Test setup and route coverage
public/         Static files
```

## Notes and limitations

- Browser speech recognition availability and accuracy vary by browser, device, accent, and network.
- Transcript-match percentages do not measure individual phoneme quality, intonation, or accent.
- The roleplay coach provides grammar, vocabulary, strengths, and task-progress guidance from the recognized text. It does not claim to judge pronunciation from text.
- Dictionary audio and phonetic spelling depend on the external entry’s coverage.
- Learner data remains in the current browser until a future authentication and cloud-sync service is added.
