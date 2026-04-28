import { useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { AnimatePresence, motion } from "framer-motion";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "TOEIC Part 5 tips?",
  "How to improve listening score?",
  "Give me a practice question",
  "What is Study4You?",
];

export function ChatbotWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Hide chatbot during tests to avoid UI distraction and overlap with mobile controls
  const isTestTakingPage = /\/tests\/.*\/attempt/.test(location.pathname);

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await aiService.chat(content);

      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: data.reply || "Sorry, I didn't get a response. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Increment unread if window is closed
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (error: any) {
      console.error("Chat error:", error);

      const errMsg =
        error?.response?.status === 503 || error?.response?.status === 429
          ? "The AI is a little overloaded right now. Please try again in a moment! 🙏"
          : "I'm having trouble connecting right now. Please try again later!";

      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: errMsg,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      toast.error("Assistant temporarily unavailable");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (isTestTakingPage) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            onClose={() => setIsOpen(false)}
            onClear={handleClear}
            suggestedQuestions={SUGGESTED_QUESTIONS}
            onSuggestedClick={handleSend}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 22 }}
      >
        <Button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          size="lg"
          className="relative rounded-full w-14 h-14 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 bg-gradient-to-br from-primary to-primary/80"
          title="Chat with AI"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-md"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" />
        )}
      </motion.div>
    </>
  );
}
