"use client"

import { useState, useEffect } from "react"
import { VoiceDiary, type DiaryEntry } from "@/components/voice-diary"
import { HomePage } from "@/components/home-page"
import { StorageManager } from "@/lib/storage"
import { Mic, AlertCircle } from "lucide-react"

export default function Home() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDiary, setShowDiary] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoadError(null)
        const loadedEntries = await StorageManager.loadEntries()
        setEntries(loadedEntries)

        if (loadedEntries.length > 0) {
          setCurrentEntryIndex(0)
        }
      } catch (error) {
        console.error("Error loading entries:", error)
        setLoadError("Failed to load diary entries. Starting with a fresh diary.")
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  const saveEntries = async (newEntries: DiaryEntry[]) => {
    try {
      await StorageManager.saveEntries(newEntries)
      setEntries(newEntries)
    } catch (error) {
      console.error("Error saving entries:", error)
      setEntries(newEntries)
    }
  }

  const createNewEntry = () => {
    const newEntry: DiaryEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date: new Date(),
      audioBlob: null,
      transcription: "",
      isRecording: false,
      isTranscribing: false,
    }

    const newEntries = [newEntry, ...entries]
    saveEntries(newEntries)
    setCurrentEntryIndex(0)
    setShowDiary(true)
  }

  const updateEntry = (updatedEntry: DiaryEntry) => {
    const newEntries = entries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    saveEntries(newEntries)
  }

  const deleteEntry = (entryId: string) => {
    const entryIndex = entries.findIndex((entry) => entry.id === entryId)
    const newEntries = entries.filter((entry) => entry.id !== entryId)

    saveEntries(newEntries)

    if (newEntries.length === 0) {
      setShowDiary(false)
      setCurrentEntryIndex(0)
    } else {
      if (entryIndex <= currentEntryIndex) {
        const newIndex = Math.max(0, currentEntryIndex - 1)
        setCurrentEntryIndex(Math.min(newIndex, newEntries.length - 1))
      }
    }
  }

  const selectEntry = (index: number) => {
    if (index >= 0 && index < entries.length) {
      setCurrentEntryIndex(index)
      setShowDiary(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="claude-card text-center">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="claude-text-sm">Loading your diary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {loadError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="claude-alert claude-alert-warning max-w-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{loadError}</span>
            </div>
          </div>
        </div>
      )}

      {!showDiary || entries.length === 0 ? (
        <HomePage
          entries={entries}
          onCreateNewEntry={createNewEntry}
          onSelectEntry={selectEntry}
          onDeleteEntry={deleteEntry}
        />
      ) : (
        <VoiceDiary
          entry={entries[currentEntryIndex]}
          onEntryUpdate={updateEntry}
          onCreateNewEntry={createNewEntry}
          onBackToHome={() => setShowDiary(false)}
        />
      )}
    </div>
  )
}