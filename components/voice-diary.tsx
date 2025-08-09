import { useState, useRef, useEffect } from "react"
import {
  Mic,
  Play,
  Pause,
  Square,
  Plus,
  ArrowLeft,
  AlertCircle,
  Edit3,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"

import { ollama } from "@/lib/ollama"
import { transcriptionManager } from "@/lib/transcription"

// Simple model selector component
function ModelSelector() {
  const [models, setModels] = useState<string[]>([])
  const [currentModel, setCurrentModel] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadModels = async () => {
      const availableModels = await ollama.getAvailableModels()
      setModels(availableModels)
      setCurrentModel(ollama.getCurrentModel())
    }
    loadModels()
  }, [])

  const handleModelChange = (model: string) => {
    ollama.setModel(model)
    setCurrentModel(model)
    setIsOpen(false)
  }

  if (models.length === 0) return null

  return (
    <div className="relative mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-400 hover:text-white"
      >
        {currentModel.replace(':', ' ') || 'Select Model'}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-20 min-w-32">
            {models.map((model) => (
              <button
                key={model}
                onClick={() => handleModelChange(model)}
                className="block w-full px-3 py-1 text-xs text-left text-gray-300 hover:bg-zinc-700 hover:text-white"
              >
                {model.replace(':', ' ')}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export interface DiaryEntry {
  id: string
  date: Date
  audioBlob: Blob | null
  transcription: string
  isRecording: boolean
  isTranscribing: boolean
}

interface VoiceDiaryProps {
  entry: DiaryEntry
  onEntryUpdate: (entry: DiaryEntry) => void
  onCreateNewEntry: () => void
  onBackToHome: () => void
}

function RecordingOrb({ 
  isRecording, 
  isTranscribing, 
  onStartRecording, 
  onStopRecording,
  recordingTime = 0,
  liveTranscript = ""
}: {
  isRecording: boolean
  isTranscribing: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  recordingTime?: number
  liveTranscript?: string
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-4 max-w-md">
        <button
          onClick={onStopRecording}
          className="recording-orb recording"
        >
          <Square className="w-6 h-6 text-red-400" />
        </button>
        <div className="text-center">
          <div className="text-lg font-mono text-red-400 mb-1">
            {formatTime(recordingTime)}
          </div>
          <div className="claude-text-sm mb-2">Recording...</div>
          <div className="text-sm text-gray-300 bg-zinc-800/50 rounded p-2 min-h-[2rem] max-h-20 overflow-y-auto border border-zinc-700">
            {liveTranscript || "Listening for speech..."}
          </div>
        </div>
      </div>
    )
  }

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="recording-orb processing">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
        <div className="text-center">
          <div className="claude-text-sm">Processing...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onStartRecording}
        className="recording-orb"
      >
        <Mic className="w-6 h-6 text-gray-400" />
      </button>
      <div className="claude-text-sm">Press to record</div>
    </div>
  )
}

export function VoiceDiary({
  entry,
  onEntryUpdate,
  onCreateNewEntry,
  onBackToHome,
}: VoiceDiaryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const transcriptUpdateRef = useRef<NodeJS.Timeout | null>(null)

  const currentEntry = entry

  // Cleanup function
  const cleanup = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (transcriptUpdateRef.current) {
      clearInterval(transcriptUpdateRef.current)
      transcriptUpdateRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null
    }
  }

  useEffect(() => {
    if (currentEntry?.audioBlob) {
      const url = URL.createObjectURL(currentEntry.audioBlob)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setAudioUrl(null)
    }
  }, [currentEntry?.audioBlob])

  useEffect(() => {
    return cleanup
  }, [])

  useEffect(() => {
    setIsEditing(false)
    setEditedText("")
    setIsPlaying(false)
    setRecordingError(null)
    setRecordingTime(0)
    setLiveTranscript("")
  }, [entry.id])

  const startRecording = async () => {
    try {
      setRecordingError(null)
      setRecordingTime(0)
      setLiveTranscript("")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Stop live transcription and get final transcript
        const finalTranscript = transcriptionManager.stopLiveTranscription()
        
        // Use the latest audio blob (replace, don't merge for simplicity)
        const updatedEntry = {
          ...currentEntry,
          audioBlob: audioBlob,
          isRecording: false,
          isTranscribing: true,
        }
        onEntryUpdate(updatedEntry)

        await processTranscription(finalTranscript || liveTranscript, updatedEntry)
        cleanup()
      }

      // Start live transcription
      try {
        if (transcriptionManager.isSupported()) {
          await transcriptionManager.startLiveTranscription()
          
          // Update live transcript periodically
          transcriptUpdateRef.current = setInterval(() => {
            const currentTranscript = transcriptionManager.getCurrentTranscript()
            setLiveTranscript(currentTranscript)
          }, 500)
        }
      } catch (transcriptionError) {
        console.warn("Live transcription not available:", transcriptionError)
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      mediaRecorder.start(1000)
      onEntryUpdate({
        ...currentEntry,
        isRecording: true,
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      setRecordingError("Could not access microphone. Please check permissions and try again.")
      onEntryUpdate({
        ...currentEntry,
        isRecording: false,
      })
      cleanup()
    }
  }

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    if (transcriptUpdateRef.current) {
      clearInterval(transcriptUpdateRef.current)
      transcriptUpdateRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const processTranscription = async (rawTranscription: string, entry: DiaryEntry) => {
    console.log("Processing transcription:", rawTranscription?.substring(0, 50) + "...")
    
    if (!rawTranscription || !rawTranscription.trim()) {
      // No transcription, just update status
      onEntryUpdate({
        ...entry,
        transcription: entry.transcription || "Audio recorded. Click edit to add text.",
        isTranscribing: false,
      })
      return
    }

    try {
      // Step 1: Correct the NEW transcription segment with AI
      console.log("Correcting new segment with AI...")
      const correctedSegment = await ollama.correctGrammar(rawTranscription)
      
      // Step 2: Append corrected segment to existing text
      const existingText = entry.transcription || ""
      const separator = existingText && existingText.trim() ? " " : ""
      const finalText = existingText ? `${existingText}${separator}${correctedSegment}` : correctedSegment
      
      console.log("Original segment:", rawTranscription.substring(0, 50))
      console.log("Corrected segment:", correctedSegment.substring(0, 50))
      console.log("Final combined text:", finalText.substring(0, 100))
      
      // Step 3: Update with final corrected text
      onEntryUpdate({
        ...entry,
        transcription: finalText.trim(),
        isTranscribing: false,
      })
      
    } catch (error) {
      console.error("AI correction failed, using raw transcription:", error)
      
      // Fallback: append raw transcription if AI fails
      const existingText = entry.transcription || ""
      const separator = existingText && existingText.trim() ? " " : ""
      const fallbackText = existingText ? `${existingText}${separator}${rawTranscription}` : rawTranscription
      
      onEntryUpdate({
        ...entry,
        transcription: fallbackText.trim(),
        isTranscribing: false,
      })
    }
  }



  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="claude-container">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="claude-button claude-button-ghost"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-lg font-medium text-white">
                {format(new Date(currentEntry.date), "EEEE, MMM d")}
              </div>
              <ModelSelector />
            </div>

            <button
              onClick={onCreateNewEntry}
              className="claude-button claude-button-secondary"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>



          {/* Recording Controls */}
          <div className="flex justify-center py-8">
            <RecordingOrb
              isRecording={currentEntry.isRecording}
              isTranscribing={currentEntry.isTranscribing}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              recordingTime={recordingTime}
              liveTranscript={liveTranscript}
            />
          </div>

          {/* Recording Error */}
          {recordingError && (
            <div className="claude-alert claude-alert-error">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{recordingError}</span>
              </div>
            </div>
          )}

          {/* Transcription Area */}
          <div className="claude-card">
            {currentEntry.isTranscribing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                  <div className="claude-text-sm">Transcribing your recording...</div>
                </div>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="claude-textarea"
                  placeholder="Edit your thoughts..."
                  autoFocus
                  rows={8}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="claude-button claude-button-secondary"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editedText.trim()) {
                        onEntryUpdate({
                          ...currentEntry,
                          transcription: editedText.trim(),
                        })
                        setIsEditing(false)
                      }
                    }}
                    disabled={!editedText.trim()}
                    className="claude-button claude-button-primary"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentEntry.transcription ? (
                  <div className="space-y-4">
                    <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                      {currentEntry.transcription}
                    </div>
                    
                    <div className="claude-divider" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {audioUrl && (
                          <button
                            onClick={() => {
                              if (audioRef.current && audioUrl) {
                                if (isPlaying) {
                                  audioRef.current.pause()
                                  setIsPlaying(false)
                                } else {
                                  audioRef.current.play()
                                  setIsPlaying(true)
                                }
                              }
                            }}
                            className="claude-button claude-button-ghost"
                            title={isPlaying ? "Pause audio" : "Play audio"}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditedText(currentEntry.transcription)
                            setIsEditing(true)
                          }}
                          className="claude-button claude-button-ghost"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                      

                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mic className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300 mb-1">Press the button above to start recording</p>
                    <p className="claude-text-sm">Your transcription will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>
    </div>
  )
}