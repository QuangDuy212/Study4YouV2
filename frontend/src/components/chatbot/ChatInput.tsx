import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 border-t bg-background/80 backdrop-blur-sm"
    >
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything... (Enter to send)"
        disabled={disabled}
        rows={1}
        className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !input.trim()}
        className="h-10 w-10 rounded-xl shrink-0 bg-primary hover:bg-primary/90 shadow-md disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
