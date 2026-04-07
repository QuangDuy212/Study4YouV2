import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp?: Date;
}

function renderMarkdown(text: string) {
  // Simple lightweight markdown: bold, code, line breaks
  return text
    .split("\n")
    .map((line, i) => {
      // Bold **text**
      const boldParsed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Inline code `code`
      const codeParsed = boldParsed.replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-[0.85em] font-mono">$1</code>'
      );
      // Bullet list
      if (/^\s*[-*•]\s/.test(line)) {
        const content = codeParsed.replace(/^\s*[-*•]\s/, "");
        return (
          <div key={i} className="flex items-start gap-2 my-0.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: codeParsed }}
          className="leading-relaxed"
        />
      );
    });
}

export function ChatMessage({ message, isBot, timestamp }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-2.5 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isBot ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-0.5",
          isBot
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
            : "bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
        )}
      >
        {isBot ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col max-w-[78%]", isBot ? "items-start" : "items-end")}>
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words overflow-hidden",
            isBot
              ? "bg-muted/70 text-foreground rounded-tl-sm border border-border/40"
              : "bg-primary text-primary-foreground rounded-tr-sm"
          )}
        >
          {isBot ? (
            <div className="space-y-0.5">{renderMarkdown(message)}</div>
          ) : (
            <p className="leading-relaxed">{message}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
