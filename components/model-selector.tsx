import { useState, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { ollama } from "@/lib/ollama"

interface ModelSelectorProps {
  onModelChange?: (model: string) => void
}

export function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [currentModel, setCurrentModel] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setIsLoading(true)
      const models = await ollama.getAvailableModels()
      setAvailableModels(models)
      
      const current = ollama.getCurrentModel()
      setCurrentModel(current)
      
      // If current model is not in available models, set to first available
      if (models.length > 0 && !models.some(m => m.includes(current))) {
        const firstModel = models[0]
        ollama.setModel(firstModel)
        setCurrentModel(firstModel)
        onModelChange?.(firstModel)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelSelect = (model: string) => {
    ollama.setModel(model)
    setCurrentModel(model)
    setIsOpen(false)
    onModelChange?.(model)
  }

  const getDisplayName = (modelName: string) => {
    // Clean up model names for display
    return modelName.replace(':latest', '').replace(':', ' ')
  }

  if (isLoading) {
    return (
      <div className="text-xs text-gray-400">
        Loading models...
      </div>
    )
  }

  if (availableModels.length === 0) {
    return (
      <div className="text-xs text-red-400">
        No models available
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
      >
        <span>{getDisplayName(currentModel)}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-20 min-w-48">
            <div className="py-1">
              {availableModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-zinc-700 hover:text-white flex items-center justify-between"
                >
                  <span>{getDisplayName(model)}</span>
                  {model === currentModel && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}