// Essential tags for voice diary entries
export const ESSENTIAL_TAGS = [
  'work',
  'personal', 
  'ideas',
  'goals',
  'reflection'
] as const

export type Tag = typeof ESSENTIAL_TAGS[number]

class TaggingManager {
  private baseUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434'
  private model = 'qwen3:4b-thinking'

  async generateTags(text: string): Promise<Tag[]> {
    if (!text.trim()) return ['personal']

    try {
      const prompt = `Analyze this diary entry and select 1-2 most relevant tags from: ${ESSENTIAL_TAGS.join(', ')}.

Rules:
- Only use tags from the list above
- Choose 1-2 tags maximum
- Respond with ONLY tag names separated by comma
- No explanations

Text: ${text.slice(0, 500)}`

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.8,
            max_tokens: 20,
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Tagging API error: ${response.status}`)
      }

      const data = await response.json()
      const rawTags = data.response.trim()

      // Parse and validate tags
      const suggestedTags = rawTags
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => ESSENTIAL_TAGS.includes(tag as Tag))
        .slice(0, 2)

      return suggestedTags.length > 0 ? suggestedTags as Tag[] : this.fallbackTagging(text)
    } catch (error) {
      console.error('Auto-tagging error:', error)
      return this.fallbackTagging(text)
    }
  }

  async generateTag(text: string): Promise<Tag> {
    const tags = await this.generateTags(text)
    return tags[0] || 'personal'
  }

  // Fast fallback tagging based on keywords
  fallbackTagging(text: string): Tag[] {
    const lowerText = text.toLowerCase()
    const fallbackTags: Tag[] = []

    // Simple keyword-based fallback tagging
    if (lowerText.includes('work') || lowerText.includes('job') || lowerText.includes('meeting') || lowerText.includes('project')) {
      fallbackTags.push('work')
    }
    if (lowerText.includes('idea') || lowerText.includes('think') || lowerText.includes('concept')) {
      fallbackTags.push('ideas')
    }
    if (lowerText.includes('goal') || lowerText.includes('plan') || lowerText.includes('achieve')) {
      fallbackTags.push('goals')
    }
    if (lowerText.includes('reflect') || lowerText.includes('learn') || lowerText.includes('insight')) {
      fallbackTags.push('reflection')
    }

    // Default to 'personal' if no specific tags found
    if (fallbackTags.length === 0) {
      fallbackTags.push('personal')
    }

    return fallbackTags.slice(0, 2) // Limit to 2 tags
  }
}

export const taggingManager = new TaggingManager()