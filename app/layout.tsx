import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Voice Diary - Capture Your Thoughts",
  description:
    "A thoughtful space for capturing and reflecting on your daily experiences through voice recordings and transcriptions.",
  keywords: ["voice diary", "journal", "transcription", "personal notes", "daily thoughts"],
  authors: [{ name: "Voice Diary" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f172a",
  robots: "noindex, nofollow", // Privacy-focused app
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23475569'><path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z'/><path d='M19 10v2a7 7 0 0 1-14 0v-2a1 1 0 0 1 2 0v2a5 5 0 0 0 10 0v-2a1 1 0 0 1 2 0Z'/><path d='M12 19a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1Z'/></svg>"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
