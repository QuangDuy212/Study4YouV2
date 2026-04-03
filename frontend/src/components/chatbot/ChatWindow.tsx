import { useEffect, useRef } from "react";
import { X, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { motion } from "framer-motion";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
  onClear: () => void;
  suggestedQuestions: string[];
  onSuggestedClick: (question: string) => void;
}

export function ChatWindow({
  messages,
  isLoading,
  onSend,
  onClose,
  onClear,
  suggestedQuestions,
  onSuggestedClick,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.93 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-20 right-4 w-[380px] max-w-[calc(100vw-24px)] h-[540px] max-h-[calc(100vh-100px)] bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">Study4You AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              <p className="text-[11px] opacity-80">Online · Powered by Gemini</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-primary-foreground hover:bg-white/20 rounded-lg"
              onClick={onClear}
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-primary-foreground hover:bg-white/20 rounded-lg"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <ChatMessage
              message={"Hi! 👋 I'm your **Study4You AI assistant**, powered by Gemini.\n\nI can help you with:\n- TOEIC tips & strategies\n- Platform navigation\n- Practice questions"}
              isBot={true}
              timestamp={new Date()}
            />
            <div>
              <p className="text-[11px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedClick(question)}
                    className="text-xs bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-95 font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages list */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isBot={message.isBot}
            timestamp={message.timestamp}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5 mb-4 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted/70 border border-border/40 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </motion.div>
  );
}
