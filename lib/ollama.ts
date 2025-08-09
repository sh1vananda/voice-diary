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

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`)
            return response.ok
        } catch {
            return false
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`)
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
            console.log(`Correcting: "${text.substring(0, 50)}..."`)

            const response = await fetch(`${this.baseUrl}/api/generate`, {
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
                        max_tokens: Math.min(text.length + 50, 300),
                    }
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data: OllamaResponse = await response.json()
            let result = data.response.trim()

            console.log(`Raw AI response: "${result.substring(0, 100)}..."`)

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
                console.log('AI correction looks wrong, using original')
                return text
            }

            console.log(`Final corrected: "${result.substring(0, 50)}..."`)
            return result
        } catch (error) {
            console.error('AI correction failed:', error)
            return text
        }
    }


}

export const ollama = new OllamaClient()