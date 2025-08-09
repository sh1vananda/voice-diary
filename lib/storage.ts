import type { DiaryEntry } from "@/components/voice-diary"

const STORAGE_KEY = "voiceDiaryEntries"
const STORAGE_VERSION = "1.1"
const VERSION_KEY = "voiceDiaryVersion"
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024 // 4.5MB to leave room for other data

interface StoredEntry {
  id: string
  date: string
  audioBlob: string | null
  transcription: string
  audioSize?: number
  audioType?: string
  tags?: string[]
}

interface StorageData {
  version: string
  entries: StoredEntry[]
  timestamp: string
}

export const StorageManager = {
  saveEntries: async (entries: DiaryEntry[]): Promise<void> => {
    try {
      // Convert Blob objects to base64 for storage
      const serializedEntries: StoredEntry[] = await Promise.all(
        entries.map(async (entry) => {
          let audioData = null
          let audioSize = 0
          let audioType = ""

          if (entry.audioBlob) {
            try {
              audioData = await blobToBase64(entry.audioBlob)
              audioSize = entry.audioBlob.size
              audioType = entry.audioBlob.type
            } catch (error) {
              console.warn(`Failed to serialize audio for entry ${entry.id}:`, error)
            }
          }

          return {
            id: entry.id,
            date: entry.date.toISOString(),
            audioBlob: audioData,
            transcription: entry.transcription,
            audioSize,
            audioType,
            tags: entry.tags || [],
          }
        }),
      )

      const dataToStore: StorageData = {
        version: STORAGE_VERSION,
        entries: serializedEntries,
        timestamp: new Date().toISOString(),
      }

      const serialized = JSON.stringify(dataToStore)
      
      // Check storage size
      if (serialized.length > MAX_STORAGE_SIZE) {
        throw new Error("Storage quota exceeded. Consider deleting old entries or audio files.")
      }

      localStorage.setItem(STORAGE_KEY, serialized)
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION)
    } catch (error) {
      console.error("Error saving entries:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to save entries to storage")
    }
  },

  loadEntries: async (): Promise<DiaryEntry[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)

      // Handle different storage formats
      let entries: any[] = []
      if (Array.isArray(parsed)) {
        // Legacy format (direct array)
        entries = parsed
      } else if (parsed.entries && Array.isArray(parsed.entries)) {
        // Current format
        entries = parsed.entries
      } else {
        console.warn("Invalid storage format, starting fresh")
        return []
      }

      // Convert base64 back to Blob objects and validate entries
      const validEntries: DiaryEntry[] = []
      
      for (const entry of entries) {
        try {
          if (!entry || !entry.id || !entry.date) {
            console.warn("Skipping invalid entry:", entry)
            continue
          }

          let audioBlob: Blob | null = null
          if (entry.audioBlob) {
            try {
              audioBlob = await base64ToBlob(entry.audioBlob, entry.audioType)
            } catch (error) {
              console.warn(`Failed to restore audio for entry ${entry.id}:`, error)
            }
          }

          validEntries.push({
            id: entry.id,
            date: new Date(entry.date),
            audioBlob,
            transcription: entry.transcription || "",
            isRecording: false,
            isTranscribing: false,
            tags: entry.tags || [],
          })
        } catch (error) {
          console.warn("Skipping corrupted entry:", entry, error)
        }
      }

      // Sort entries by date (newest first)
      return validEntries.sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
      console.error("Error loading entries:", error)
      // Try to recover by clearing corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY)
        console.warn("Cleared corrupted storage data")
      } catch {
        // Ignore cleanup errors
      }
      return []
    }
  },

  clearEntries: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(VERSION_KEY)
    } catch (error) {
      console.error("Error clearing entries:", error)
    }
  },

  exportEntries: async (entries: DiaryEntry[]): Promise<string> => {
    try {
      const serializedEntries = await Promise.all(
        entries.map(async (entry) => {
          let audioData = null
          if (entry.audioBlob) {
            try {
              audioData = await blobToBase64(entry.audioBlob)
            } catch (error) {
              console.warn(`Failed to export audio for entry ${entry.id}:`, error)
            }
          }

          return {
            id: entry.id,
            date: entry.date.toISOString(),
            audioBlob: audioData,
            transcription: entry.transcription,
            audioSize: entry.audioBlob?.size || 0,
            audioType: entry.audioBlob?.type || "",
            tags: entry.tags || [],
          }
        }),
      )

      return JSON.stringify(
        {
          version: STORAGE_VERSION,
          exportDate: new Date().toISOString(),
          entries: serializedEntries,
        },
        null,
        2,
      )
    } catch (error) {
      console.error("Error exporting entries:", error)
      throw new Error("Failed to export entries")
    }
  },

  getStorageInfo: (): { used: number; available: number; percentage: number; entryCount: number } => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || ""
      const used = new Blob([stored]).size
      const available = MAX_STORAGE_SIZE
      const percentage = (used / available) * 100

      let entryCount = 0
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          entryCount = parsed.length
        } else if (parsed.entries && Array.isArray(parsed.entries)) {
          entryCount = parsed.entries.length
        }
      } catch {
        // Ignore parsing errors for count
      }

      return { used, available, percentage, entryCount }
    } catch (error) {
      console.error("Error getting storage info:", error)
      return { used: 0, available: MAX_STORAGE_SIZE, percentage: 0, entryCount: 0 }
    }
  },

  removeAudioFromEntry: async (entryId: string, entries: DiaryEntry[]): Promise<DiaryEntry[]> => {
    const updatedEntries = entries.map(entry => 
      entry.id === entryId 
        ? { ...entry, audioBlob: null }
        : entry
    )
    await StorageManager.saveEntries(updatedEntries)
    return updatedEntries
  },

  validateStorage: (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return { isValid: true, errors: [] }
      }

      const parsed = JSON.parse(stored)
      
      if (!parsed) {
        errors.push("Storage data is null")
      } else if (Array.isArray(parsed)) {
        // Legacy format is valid
      } else if (!parsed.entries || !Array.isArray(parsed.entries)) {
        errors.push("Invalid storage structure")
      }

      const storageInfo = StorageManager.getStorageInfo()
      if (storageInfo.percentage > 90) {
        errors.push("Storage is nearly full")
      }

    } catch (error) {
      errors.push(`Storage validation failed: ${error}`)
    }

    return { isValid: errors.length === 0, errors }
  }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = () => reject(new Error("Failed to convert blob to base64"))
    reader.readAsDataURL(blob)
  })
}

const base64ToBlob = async (base64: string, mimeType?: string): Promise<Blob> => {
  try {
    const response = await fetch(base64)
    const blob = await response.blob()
    
    // If we have type info, create a new blob with correct type
    if (mimeType && blob.type !== mimeType) {
      return new Blob([blob], { type: mimeType })
    }
    
    return blob
  } catch (error) {
    console.error("Error converting base64 to blob:", error)
    // Return empty blob with correct type if conversion fails
    return new Blob([], { type: mimeType || "audio/webm" })
  }
}
