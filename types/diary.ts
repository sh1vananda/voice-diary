import type { Tag } from "@/lib/tagging"

export interface DiaryEntry {
  id: string
  date: Date
  audioBlob: Blob | null
  transcription: string
  isRecording: boolean
  isTranscribing: boolean
  tags?: Tag[]
}
