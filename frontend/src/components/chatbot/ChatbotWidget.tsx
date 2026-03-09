import { useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
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
  "How do I start a test?",
  "Where can I practice reading?",
  "How do I view my results?",
  "What is Study4You?",
  "How do I change my password?",
];

// Fallback responses for common questions
const FALLBACK_RESPONSES: Record<string, string> = {
  "start test": "To start a TOEIC test, go to the Tests page from your dashboard and click 'Start Test' on any available test.",
  "practice reading": "For reading practice, go to your Dashboard and click on 'Reading Practice'. You'll find various passages and comprehension questions.",
  "practice listening": "For listening practice, go to your Dashboard and click on 'Listening Practice'. You'll have audio exercises with questions.",
  "view results": "To view your test results, go to your Dashboard. You can see your recent activity and click on any completed test to view detailed results.",
  "test history": "Your test history is available on the Dashboard page. It shows all your completed tests with scores and dates.",
  "study4you": "Study4You is an online TOEIC practice platform where you can take practice tests, improve your reading and listening skills, and track your progress.",
  "password": "To change your password, go to Settings from your Dashboard. You can update your account information there.",
  "toeic": "TOEIC has 7 parts: Part 1 (Photos), Part 2 (Question Response), Part 3 (Conversations), Part 4 (Talks), Part 5 (Incomplete Sentences), Part 6 (Text Completion), and Part 7 (Reading Comprehension).",
};

function getFallbackResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  return null;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        content: data.reply,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Try fallback response
      const fallback = getFallbackResponse(content);
      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: fallback || "I'm sorry, I couldn't process your request right now. Please try again later or check our FAQ section.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      if (!fallback) {
        toast.error("Assistant temporarily unavailable");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSuggestedClick = (question: string) => {
    handleSend(question);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            onClose={() => setIsOpen(false)}
            suggestedQuestions={SUGGESTED_QUESTIONS}
            onSuggestedClick={handleSuggestedClick}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
          title="Need help?"
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
        </Button>
      </motion.div>
    </>
  );
}
