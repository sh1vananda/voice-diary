interface OllamaResponse {
    response: string
    done: boolean
}

interface OllamaModel {
    name: string
    size: number
    digest: string
    modified_at: string
}

interface OllamaModelsResponse {
    models: OllamaModel[]
}

class OllamaClient {
    private baseUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434'
    private model = 'gemma3:4b' // default model

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('voiceDiaryModel')
                if (saved) {
                    this.model = saved
                }
            } catch {}
        }
    }

    private getBaseUrlCandidates(): string[] {
        const candidates: string[] = []
        const configured = this.baseUrl
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('voiceDiaryOllamaUrl')
                if (saved) candidates.push(saved)
            }
        } catch {}
        // Prefer localhost for HTTPS exceptions
        candidates.push('http://localhost:11434')
        if (!candidates.includes(configured)) candidates.push(configured)
        const as127 = configured.replace('localhost', '127.0.0.1')
        const asIPv6 = configured.replace('localhost', '[::1]')
        if (!candidates.includes(as127)) candidates.push(as127)
        if (!candidates.includes('http://127.0.0.1:11434')) candidates.push('http://127.0.0.1:11434')
        if (!candidates.includes(asIPv6)) candidates.push(asIPv6)
        return candidates
    }

    private async tryFetch(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
        const errors: unknown[] = []
        for (const base of this.getBaseUrlCandidates()) {
            try {
                const url = `${base}${path}`
                const res = await this.fetchWithTimeout(url, init, timeoutMs)
                if (res.ok) return res
                // consider non-ok as failure and try next
                errors.push(new Error(`HTTP ${res.status} @ ${url}`))
            } catch (e) {
                errors.push(e)
            }
        }
        throw errors[errors.length - 1] || new Error('All Ollama endpoints failed')
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await this.tryFetch(`/api/tags`, { method: 'GET' }, 3500)
            return response.ok
        } catch {
            return false
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.tryFetch(`/api/tags`, { method: 'GET' }, 4000)
            if (!response.ok) return []

            const data: OllamaModelsResponse = await response.json()
            return data.models?.map(model => model.name) || []
        } catch {
            return []
        }
    }

    async checkModel(): Promise<boolean> {
        try {
            const models = await this.getAvailableModels()
            return models.some(modelName => modelName.includes(this.model))
        } catch {
            return false
        }
    }

    setModel(modelName: string): void {
        this.model = modelName
    }

    getCurrentModel(): string {
        return this.model
    }

    async correctGrammar(text: string): Promise<string> {
        if (!text.trim()) return text

        try {
            const response = await this.tryFetch(`/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `Correct any grammar and spelling errors in this text. Return ONLY the corrected text with no explanations:

"${text.slice(0, 500)}"`,
                    stream: false,
                    options: {
                        temperature: 0.1,
                        max_tokens: Math.min(Math.max(64, Math.ceil(text.length * 1.3)), 240),
                    }
                }),
            }, 8000)

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data: OllamaResponse = await response.json()
            let result = data.response.trim()

            // Aggressive cleaning to extract just the corrected text
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

            // Remove common AI prefixes
            result = result.replace(/^(Here's the corrected text:|Corrected text:|Here is the corrected version:|The corrected text is:|Fixed text:)/i, '').trim()

            // Remove quotes if wrapped
            if (result.startsWith('"') && result.endsWith('"')) {
                result = result.slice(1, -1).trim()
            }

            // If response contains explanations, try to extract just the corrected sentence
            const lines = result.split('\n').filter(line => line.trim())
            if (lines.length > 1) {
                // Look for the line that looks most like the corrected text
                for (const line of lines) {
                    const cleanLine = line.trim()
                    if (cleanLine &&
                        !cleanLine.toLowerCase().includes('grammar') &&
                        !cleanLine.toLowerCase().includes('corrected') &&
                        !cleanLine.toLowerCase().includes('error') &&
                        !cleanLine.startsWith('*') &&
                        !cleanLine.startsWith('-') &&
                        cleanLine.length > 5) {
                        result = cleanLine
                        break
                    }
                }
            }

            // Final validation - if result looks wrong or too different, return original
            if (!result || result.length < 3 || result.length > text.length * 3) {
                return text
            }
            return result
        } catch (error) {
            return text
        }
    }

    private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
            const response = await fetch(input, { ...init, signal: controller.signal })
            return response
        } catch (err) {
            // Try 127.0.0.1 fallback if baseUrl uses localhost
            try {
                const url = typeof input === 'string' ? input : input.toString()
                if (url.includes('localhost')) {
                    const fallbackUrl = url.replace('localhost', '127.0.0.1')
                    return await fetch(fallbackUrl, { ...init })
                }
            } catch {}
            throw err
        } finally {
            clearTimeout(timeout)
        }
    }


}

export const ollama = new OllamaClient()