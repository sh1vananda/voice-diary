# Voice Diary

A simple voice diary app with AI-powered grammar correction.

## Features

- 🎤 **Voice Recording** - Record your thoughts with one click
- 📝 **Live Transcription** - Real-time speech-to-text
- 🤖 **AI Grammar Correction** - Automatic grammar and spelling fixes
- 🔄 **Text Appending** - Multiple recordings append to create longer entries
- ✏️ **Manual Editing** - Edit transcriptions manually
- 🎵 **Audio Playback** - Play back your recordings
- 💾 **Local Storage** - All data stored locally in your browser

## Setup

### Prerequisites

1. **Ollama** - Install from [ollama.ai](https://ollama.ai)
2. **AI Model** - Pull the model: `ollama pull qwen3:4b-thinking`
3. Optionally set `NEXT_PUBLIC_OLLAMA_URL` to your local Ollama endpoint (defaults to `http://localhost:11434`).

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start Ollama: `ollama serve`
4. Run the app: `npm run dev`

### Deployment (Vercel)

1. Deploy to Vercel normally
2. **Important**: Users need to run Ollama locally for AI features to work.
3. The app calls your local Ollama directly from the browser using `NEXT_PUBLIC_OLLAMA_URL` (default `http://localhost:11434`). If deployed on Vercel, users must have Ollama running locally. If you see "No models available", ensure:
   - Ollama is running: `ollama serve`
   - The model is pulled: `ollama pull qwen3:4b-thinking`
   - The browser can reach `http://localhost:11434` or `http://127.0.0.1:11434`.

### For Users

To use AI features after deployment:

1. Install Ollama on your computer
2. Pull a model: `ollama pull qwen3:4b-thinking`
3. Start Ollama: `ollama serve`
4. The app will automatically connect to your local Ollama instance

## How It Works

1. **Record** - Click the microphone to start recording
2. **Transcribe** - Speech is converted to text automatically
3. **AI Correct** - Grammar and spelling are fixed by AI
4. **Append** - New recordings add to existing text
5. **Edit** - Manual editing available anytime

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Ollama** - Local AI models
- **Web Speech API** - Browser transcription
- **MediaRecorder API** - Audio recording

## Notes

- All data is stored locally in your browser
- AI features require Ollama running locally
- Works best in Chrome/Edge for speech recognition
- No data is sent to external servers (except local Ollama)