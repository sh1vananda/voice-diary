class TranscriptionManager {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private transcript = ''
  private currentTranscript = ''

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.transcript += finalTranscript
      }

      // Update current transcript with both final and interim results
      this.currentTranscript = this.transcript + interimTranscript
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        // Continue listening for speech
        if (this.isListening) {
          setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                this.recognition.start()
              } catch (e) {
                // Recognition might already be running
              }
            }
          }, 100)
        }
      }
    }

    this.recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start()
            } catch (e) {
              // Recognition might already be running
            }
          }
        }, 100)
      }
    }
  }

  async startLiveTranscription(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    this.transcript = ''
    this.currentTranscript = ''
    this.isListening = true

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      throw error
    }
  }

  stopLiveTranscription(): string {
    if (this.recognition && this.isListening) {
      this.isListening = false
      this.recognition.stop()
    }
    return this.transcript.trim()
  }

  getCurrentTranscript(): string {
    return this.currentTranscript.trim()
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    // Since Web Speech API can't transcribe recorded audio blobs,
    // we'll return a helpful message encouraging live transcription
    return new Promise((resolve) => {
      resolve("Audio recorded successfully! For automatic transcription, try using the live transcription feature while recording. You can edit this text to add your transcribed thoughts.")
    })
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  }
}

export const transcriptionManager = new TranscriptionManager()