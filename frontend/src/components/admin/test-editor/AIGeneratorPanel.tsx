import { useState, useCallback, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2, Hash, BookOpen, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import aiService from "@/services/aiService";
import type { PartType, Difficulty, TestQuestion, TestPart } from "./types";
import { PART_QUESTION_LIMITS, PART_LABELS, PART_START_INDEX } from "./types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIGeneratorPanelProps {
  open: boolean;
  initialPart: PartType;
  currentParts?: TestPart[];
  onClose: () => void;
  onQuestionsGenerated: (partType: PartType, questions: TestQuestion[]) => void;
}

function QuestionCard({ question, index, partType }: { question: TestQuestion; index: number; partType: PartType }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
      <div className="space-y-2">
        <Badge variant="secondary" className="text-[11px] font-mono px-2.5 py-0.5">
          Q{PART_START_INDEX[partType] + index}
        </Badge>
        {question.passage && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed border border-border/50">
            {question.passage}
          </div>
        )}
        <p className="text-sm text-foreground leading-relaxed font-medium">{question.content}</p>
      </div>
      <div className="space-y-2 pt-1">
        {question.options.map((opt) => {
          const isCorrect = opt.label === question.correctAnswer;
          return (
            <div
              key={opt.label}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all",
                isCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-medium" : "bg-muted/30 border-border text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border",
                isCorrect ? "bg-emerald-500 border-emerald-600 text-white" : "bg-background border-border text-muted-foreground"
              )}>
                {opt.label}
              </div>
              {opt.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AIGeneratorPanel({ open, initialPart, currentParts, onClose, onQuestionsGenerated }: AIGeneratorPanelProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"ai" | "quick">("ai");
  const [selectedPart, setSelectedPart] = useState<PartType>(initialPart || "PART_5");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [topic, setTopic] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState<TestQuestion[]>([]);
  const [quickText, setQuickText] = useState("");

  useEffect(() => {
    if (initialPart) setSelectedPart(initialPart);
  }, [initialPart]);

  const info = PART_LABELS[selectedPart];
  const maxLimit = PART_QUESTION_LIMITS[selectedPart] || 0;
  const currentCount = currentParts?.find(p => p.type === selectedPart)?.questions.length || 0;
  const count = Math.max(0, maxLimit - currentCount);

  const handleParseText = useCallback(() => {
    if (!quickText.trim()) return;
    
    try {
      const qRegex = /(?:\d+\.\s*)?([^\n]+)\n\(A\)\s*([^\n]+)\n\(B\)\s*([^\n]+)\n\(C\)\s*([^\n]+)\n\(D\)\s*([^\n]+)/g;
      const questions: TestQuestion[] = [];
      let match;

      while ((match = qRegex.exec(quickText)) !== null) {
        questions.push({
          id: crypto.randomUUID(),
          content: match[1].trim(),
          correctAnswer: "A",
          options: [
            { label: "A", content: match[2].trim() },
            { label: "B", content: match[3].trim() },
            { label: "C", content: match[4].trim() },
            { label: "D", content: match[5].trim() },
          ],
          passage: null,
          audioUrl: null,
          imageUrl: null,
          transcript: null
        });
      }

      if (questions.length > 0) {
        setPreviewQuestions(questions.slice(0, count));
        toast.success(`Parsed ${questions.length} questions successfully!`);
      } else {
        toast.error("Could not find any questions in the text. Please check the format.");
      }
    } catch (err) {
      toast.error("Error parsing text");
    }
  }, [quickText, count]);

  const handleGenerate = async () => {
    if (count <= 0) {
      toast.error(t('partIsFull'));
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setStatusMessage(t('preparingAiRequest'));
    setPreviewQuestions([]);

    const isListeningPart = ["PART_3", "PART_4"].includes(selectedPart);
    const isReadingPart   = ["PART_6", "PART_7"].includes(selectedPart);
    const questionsPerSet = selectedPart === "PART_6" ? 4 : 3;
    const needsPerSetCalls = false; // Luôn gọi 1 lần để tối ưu hóa hiệu năng và tránh lỗi Rate Limit (429)

    // Diverse topics to rotate through for each set to maximize variety
    const diverseTopics = [
      "office meeting about quarterly results",
      "customer service at a hotel front desk",
      "doctor and patient appointment",
      "job interview at a tech company",
      "phone call about a package delivery",
      "restaurant reservation and menu discussion",
      "airport check-in and flight delay",
      "bank loan application",
      "real estate property tour",
      "conference call about a product launch",
      "library book return and renewal",
      "gym membership and fitness classes",
      "travel agency vacation planning",
    ];

    try {
      let allQuestions: TestQuestion[] = [];

      if (needsPerSetCalls) {
        // Removed multi-call logic to prevent rate limits
      } else {
        // Gộp tất cả vào 1 lần gọi duy nhất - Siêu tốc độ và cực kỳ tiết kiệm API
        const rawResponse = await aiService.generateQuestions(selectedPart, difficulty, count, topic);
        console.log("AI Raw Response:", rawResponse);

        let questionArray: any[] = [];
        if (Array.isArray(rawResponse)) {
          questionArray = rawResponse;
        } else if (rawResponse && typeof rawResponse === 'object') {
          const arrayKey = Object.keys(rawResponse).find(k => Array.isArray((rawResponse as any)[k]));
          if (arrayKey) questionArray = (rawResponse as any)[arrayKey];
        }

        let lastSeenText = "";
        allQuestions = questionArray
          .map((q: any, idx: number) => {
            // Tự động xóa bộ nhớ đệm (Reset) sau mỗi Set (ví dụ cứ 3 câu hỏi) để không bị trùng kịch bản
            if (idx % questionsPerSet === 0) {
              lastSeenText = "";
            }

            const content       = (q.content || q.question || q.text || "").toString();
            const correctAnswer = (q.correctAnswer || q.correct_answer || q.answer || q.key || "A")
                                    .toString().trim().toUpperCase();
            const rawOptions    = q.options || q.choices || q.answers || [];
            const options = Array.isArray(rawOptions)
              ? rawOptions.map((o: any, oIdx: number) => ({
                  label:   (o.label || o.key || String.fromCharCode(65 + oIdx)).toString().toUpperCase(),
                  content: (o.content || o.text || (typeof o === 'string' ? o : "")).toString()
                }))
              : [];

            const currentText = q.transcript || q.conversation || q.passage || q.reading_text || q.text || q.dialogue || q.audio_text || "";
            if (currentText && currentText.trim().length > 0) lastSeenText = currentText;

            const passage    = isReadingPart   ? (lastSeenText || "") : "";
            const transcript = isListeningPart ? (lastSeenText || "") : "";

            return {
              id: crypto.randomUUID(),
              content,
              correctAnswer: "ABCD".includes(correctAnswer) ? correctAnswer : "A",
              options,
              passage:    passage    ? passage    : null,
              transcript: transcript ? transcript : null,
            } as TestQuestion;
          })
          .filter((q: TestQuestion) => q.content && q.options.length >= 2)
          .slice(0, count);
      }

      setPreviewQuestions(allQuestions.slice(0, count));
      setProgress(100);
      setStatusMessage(t('generatedCountQuestions', { count: Math.min(allQuestions.length, count) }));
      
      if (allQuestions.length === 0) {
        toast.error("AI returned data but it didn't match the required format.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(t('failedToGenerateQuestions'));
      setStatusMessage("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (previewQuestions.length > 0) {
      onQuestionsGenerated(selectedPart, previewQuestions);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-[500px] bg-background shadow-2xl border-l border-border z-50 flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-base">{t('aiQuestionGenerator')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('generateReadingQuestionsDesc')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-6 border-b border-border bg-muted/20">
        <div className="flex gap-4">
          <button 
            onClick={() => setMode("ai")}
            className={cn(
              "py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all",
              mode === "ai" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t('aiGenerate')}
          </button>
          <button 
            onClick={() => setMode("quick")}
            className={cn(
              "py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all",
              mode === "quick" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t('quickParse')}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {mode === "ai" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('part')}</Label>
                  <Select value={selectedPart} onValueChange={(v) => setSelectedPart(v as PartType)} disabled={isGenerating}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PART_3">{t('part3Desc')} ({PART_QUESTION_LIMITS.PART_3})</SelectItem>
                      <SelectItem value="PART_4">{t('part4Desc')} ({PART_QUESTION_LIMITS.PART_4})</SelectItem>
                      <SelectItem value="PART_5">{t('part5Desc')} ({PART_QUESTION_LIMITS.PART_5})</SelectItem>
                      <SelectItem value="PART_6">{t('part6Desc')} ({PART_QUESTION_LIMITS.PART_6})</SelectItem>
                      <SelectItem value="PART_7">{t('part7Desc')} ({PART_QUESTION_LIMITS.PART_7})</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('difficulty')}</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} disabled={isGenerating}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t('beginner')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('intermediate')}</SelectItem>
                    <SelectItem value="HARD">{t('advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('topicOptional')}</Label>
                <Input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder={t('topicPlaceholder')}
                  disabled={isGenerating}
                  className="h-10"
                />
              </div>


              <div className="rounded-lg bg-muted/40 border border-border/50 p-3.5 text-sm text-muted-foreground">
                {count > 0 
                  ? t('willGenerateCountQuestionsForPart', { count, part: t(info.labelKey) })
                  : "This part already has the maximum number of questions."
                }
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || count <= 0} 
                className="w-full h-11 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? t('generating') : t('generateQuestionsCount', { count })}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Paste Text (Passage + Options)</Label>
                <textarea 
                  value={quickText} 
                  onChange={(e) => setQuickText(e.target.value)} 
                  placeholder={"Format:\nQuestion\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D"}
                  className="w-full h-64 rounded-xl border border-border bg-card p-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
              <Button onClick={handleParseText} className="w-full h-11 rounded-xl font-bold tracking-tight">
                Parse & Preview
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{statusMessage}</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {previewQuestions.length > 0 && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Separator />
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t('previewGeneratedQuestions')}
                </h4>
                <Button size="sm" onClick={handleInsert} className="h-8">
                  {t('add')}
                </Button>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const isGrouped = ["PART_3", "PART_4", "PART_6", "PART_7"].includes(selectedPart);
                  const getSetSize = (type: PartType) => type === "PART_6" ? 4 : (type === "PART_7" ? 2 : 3);
                  
                  if (isGrouped) {
                    const setSize = getSetSize(selectedPart);
                    const groups: TestQuestion[][] = [];
                    for (let i = 0; i < previewQuestions.length; i += setSize) {
                      groups.push(previewQuestions.slice(i, i + setSize));
                    }

                    return groups.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-4 p-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
                         <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-bold px-2 py-0.5">
                              {t('set')} {gIdx + 1}
                            </Badge>
                         </div>
                         
                         {["PART_3", "PART_4", "PART_6", "PART_7"].includes(selectedPart) && (group[0]?.passage || group[0]?.transcript) && (
                           <div className="rounded-xl bg-card p-4 text-[13px] text-foreground leading-relaxed border border-border/50 font-serif italic shadow-sm">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5 opacity-60">
                               {["PART_3", "PART_4"].includes(selectedPart) ? <Headphones className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                               {["PART_3", "PART_4"].includes(selectedPart) ? t('sharedTranscript', { defaultValue: 'Shared Transcript' }) : t('readingPassage', { defaultValue: 'Reading Passage' })}
                             </p>
                             <div className="whitespace-pre-wrap">
                               {group[0].passage || group[0].transcript}
                             </div>
                           </div>
                         )}

                         <div className="space-y-4">
                            {group.map((q, qIdx) => (
                             <QuestionCard key={q.id} question={{ ...q, passage: null, transcript: null }} index={currentCount + gIdx * setSize + qIdx} partType={selectedPart} />
                            ))}
                         </div>
                      </div>
                    ));
                  }

                  return previewQuestions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={currentCount + i} partType={selectedPart} />
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
