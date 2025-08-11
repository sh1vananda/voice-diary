# Voice Diary Setup Guide

## Prerequisites

### 1. Install Ollama

**Windows:**

1. Download Ollama from [https://ollama.ai/download](https://ollama.ai/download)
2. Run the installer
3. Open Command Prompt or PowerShell

**macOS:**

```bash
brew install ollama
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Install the AI Model

After installing Ollama, run:

```bash
ollama pull qwen3:4b-thinking
```

This downloads the Qwen3 4B Thinking model (about 2.4GB) which is used for text correction.

### 3. Start Ollama Service

```bash
ollama serve
```

Keep this running in the background while using the Voice Diary app.

## Usage

1. **Start the app:**

   ```bash
   npm run dev
   ```

2. **Check AI Status:**
   - The app will show an AI status indicator
   - Green checkmark = AI text correction is working
   - Red X = Ollama is not running or model is missing

3. **Record your thoughts:**
   - Click the microphone button to start recording
   - Speak clearly into your microphone
   - Click the stop button when finished
   - The app will transcribe your speech and clean it up with AI

## Features

- **Speech-to-Text:** Uses browser's built-in speech recognition
- **AI Text Correction:** Ollama Qwen3 improves grammar and clarity
- **Audio Storage:** Your original recordings are saved
- **Clean Interface:** Simple, HTML-like styling
- **Local Storage:** All data stays on your device

## Troubleshooting

### "Ollama service not running"

- Make sure you ran `ollama serve` in a terminal
- Check if Ollama is installed correctly

### "Model not found"

- Run `ollama pull qwen3:4b-thinking` to download the model
- Wait for the download to complete (2.4GB)

### "Microphone access denied"

- Allow microphone permissions in your browser
- Check your system's microphone settings

### Transcription not working

- Make sure you're using Chrome, Edge, or Safari
- Check that your microphone is working
- Speak clearly and avoid background noise

## Performance Tips

- The Qwen3 4B Thinking model is optimized for speed and quality
- First AI correction may take a few seconds as the model loads
- Subsequent corrections will be faster
- Keep Ollama running for best performance

## Privacy

- All processing happens locally on your machine
- No data is sent to external servers
- Your recordings and transcriptions stay private
- Ollama runs completely offline
