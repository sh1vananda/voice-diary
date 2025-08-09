import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { ollama } from "@/lib/ollama"
import { ModelSelector } from "@/components/model-selector"

export function AIStatus() {
    const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAIStatus()
    }, [])

    const checkAIStatus = async () => {
        try {
            setStatus('checking')
            setError(null)

            // Check if Ollama service is running
            const isServiceAvailable = await ollama.isAvailable()
            if (!isServiceAvailable) {
                setStatus('unavailable')
                setError('Ollama service not running')
                return
            }

            // Check if model is available
            const isModelAvailable = await ollama.checkModel()
            if (!isModelAvailable) {
                setStatus('unavailable')
                setError('Model not found')
                return
            }

            setStatus('available')
        } catch (error) {
            console.error('AI status check failed:', error)
            setStatus('unavailable')
            setError('Connection failed')
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'checking':
                return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            case 'available':
                return <CheckCircle className="w-4 h-4 text-green-400" />
            case 'unavailable':
                return <XCircle className="w-4 h-4 text-red-400" />
        }
    }

    const getStatusText = () => {
        switch (status) {
            case 'checking':
                return 'Checking AI...'
            case 'available':
                return 'AI Ready'
            case 'unavailable':
                return error || 'AI Unavailable'
        }
    }

    const handleModelChange = (_model: string) => {
        // Recheck status when model changes
        checkAIStatus()
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-sm">
                {getStatusIcon()}
                <span className={`${status === 'available' ? 'text-green-400' : status === 'unavailable' ? 'text-red-400' : 'text-blue-400'}`}>
                    {getStatusText()}
                </span>
                {status === 'unavailable' && (
                    <button
                        onClick={checkAIStatus}
                        className="claude-button claude-button-ghost text-xs ml-2"
                    >
                        Retry
                    </button>
                )}
            </div>
            {status === 'available' && (
                <ModelSelector onModelChange={handleModelChange} />
            )}
        </div>
    )
}