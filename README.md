# Speak Sprout Pronunciation Coach

i need to make an app like elsa english speaking

This project was built with [Lovable](https://lovable.dev).

## Speaking features

- Practice cards and guided prompts can save a temporary voice recording with `MediaRecorder` for side-by-side listening. Recordings stay in memory for the current page session and are not uploaded.
- The five-line pronunciation check saves an estimated level and targets daily phrase selection using the sounds that scored lowest. Progress remains in localStorage.
- Conversation practice includes guided café, hotel and recruiter scenes with native browser text-to-speech and scored learner turns.
- Practice Your Own accepts up to 600 characters and scores speech using the browser transcript matcher. Its IPA-style sound guide is a spelling-based approximation, not a dictionary pronunciation.

Speech recognition and voice playback use the browser's built-in APIs. Scores reflect transcript similarity and should be treated as practice feedback, not a professional fluency assessment.

**Live app**: https://speak-sprout-pronunciation-coach.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1474bedf-6266-481e-91f4-eed92b93ec2e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
