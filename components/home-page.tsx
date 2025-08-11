import { useState } from "react"
import { Plus, Search, Mic, Play, Trash2 } from "lucide-react"
import { format, isToday, isYesterday, isThisWeek } from "date-fns"
import { ConfirmModal } from "@/components/ui/modal"
import type { DiaryEntry } from "@/types/diary"

interface HomePageProps {
  entries: DiaryEntry[]
  onCreateNewEntry: () => void
  onSelectEntry: (index: number) => void
  onDeleteEntry: (entryId: string) => void
}

export function HomePage({
  entries,
  onCreateNewEntry,
  onSelectEntry,
  onDeleteEntry,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null
  })

  const filteredEntries = entries.filter((entry) => {
    return entry.transcription.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    if (isThisWeek(date)) return format(date, "EEEE")
    return format(date, "MMM d, yyyy")
  }

  const handleDeleteEntry = (entryId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setDeleteModal({ isOpen: true, entryId })
  }

  const confirmDelete = () => {
    if (deleteModal.entryId) {
      onDeleteEntry(deleteModal.entryId)
    }
    setDeleteModal({ isOpen: false, entryId: null })
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="claude-container">
        {entries.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <div className="claude-card max-w-md">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">Voice Diary</h1>
                <p className="claude-text-sm">
                  Record your thoughts and have them automatically transcribed.
                </p>
              </div>
              <button
                onClick={onCreateNewEntry}
                className="claude-button claude-button-primary w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create first entry
              </button>
            </div>
          </div>
        ) : (
          /* Entries View */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">Voice Diary</h1>
                <p className="claude-text-sm">{entries.length} entries</p>
              </div>
              <button
                onClick={onCreateNewEntry}
                className="claude-button claude-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New entry
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
              <input
                type="text"
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="claude-input text-center"
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
              />
            </div>



            {/* Entries List */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="claude-card cursor-pointer hover:bg-zinc-800/50 transition-colors group"
                  onClick={() => onSelectEntry(entries.findIndex((e) => e.id === entry.id))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">
                          {getDateLabel(new Date(entry.date))}
                        </span>
                        <span className="claude-text-xs">
                          {format(new Date(entry.date), "h:mm a")}
                        </span>
                        {entry.audioBlob && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Play className="w-3 h-3" />
                            <span className="text-xs">Audio</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                        {entry.transcription || "No transcription available"}
                      </p>

                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="claude-button claude-button-ghost opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results State */}
            {filteredEntries.length === 0 && searchQuery && (
              <div className="claude-card text-center py-8">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">No entries found</h3>
                <p className="claude-text-sm mb-4">
                  No entries match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="claude-button claude-button-secondary"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, entryId: null })}
        onConfirm={confirmDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this diary entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}