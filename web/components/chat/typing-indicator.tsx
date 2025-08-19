"use client"

interface TypingIndicatorProps {
  username: string
}

export default function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 max-w-[80%] mr-auto">
      <div className="flex flex-col gap-1 items-start">
        <span className="text-xs text-muted-foreground font-medium">{username}</span>

        <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md px-4 py-2">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
