import { Tag } from "@/lib/tagging"

interface TagDisplayProps {
  tags: Tag[]
  size?: 'sm' | 'md'
}

const TAG_COLORS: Record<Tag, string> = {
  work: 'bg-blue-900/30 text-blue-300 border-blue-700',
  personal: 'bg-green-900/30 text-green-300 border-green-700', 
  ideas: 'bg-purple-900/30 text-purple-300 border-purple-700',
  goals: 'bg-orange-900/30 text-orange-300 border-orange-700',
  reflection: 'bg-gray-700/30 text-gray-300 border-gray-600'
}

export function TagDisplay({ tags, size = 'sm' }: TagDisplayProps) {
  if (!tags || tags.length === 0) return null

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-1' 
    : 'text-sm px-3 py-1'

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, index) => (
        <span
          key={index}
          className={`
            ${TAG_COLORS[tag]} 
            ${sizeClasses}
            rounded-full border font-medium
          `}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}