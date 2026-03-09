import { useState, useCallback } from "react";
import { X, Sparkles, Loader2, CheckCircle2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import aiService from "@/services/aiService";
import type { PartType, Difficulty, TestQuestion } from "./types";
import { AI_QUESTION_COUNTS, PART_LABELS } from "./types";
import { motion } from "framer-motion";

interface AIGeneratorPanelProps {
  open: boolean;
  initialPart: PartType;
  onClose: () => void;
  onQuestionsGenerated: (partType: PartType, questions: TestQuestion[]) => void;
}

function QuestionCard({ question, index }: { question: TestQuestion; index: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
      {/* Question number badge + text */}
      <div className="space-y-2">
        <Badge variant="secondary" className="text-[11px] font-mono px-2.5 py-0.5">
          Q{index + 1}
        </Badge>
        {question.passage && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed border border-border/50">
            {question.passage}
          </div>
        )}
        <p className="text-sm text-foreground leading-relaxed font-medium">{question.content}</p>
      </div>

      {/* Options as vertical list */}
      <div className="space-y-2 pt-1">
        {question.options.map((opt) => {
          const isCorrect = opt.label === question.correctAnswer;
          return (
            <div
              key={opt.label}
              className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isCorrect
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "bg-muted/30 border border-transparent text-muted-foreground"
              }`}
            >
              <span className={`font-mono text-xs mt-0.5 shrink-0 ${isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"}`}>
                {opt.label}.
              </span>
              <span className="leading-relaxed">{opt.content}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AIGeneratorPanel({ open, initialPart, onClose, onQuestionsGenerated }: AIGeneratorPanelProps) {
  const [selectedPart, setSelectedPart] = useState<PartType>(initialPart);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState<TestQuestion[]>([]);

  const count = AI_QUESTION_COUNTS[selectedPart] || 0;
  const info = PART_LABELS[selectedPart];

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setProgress(15);
    setPreviewQuestions([]);
    setStatusMessage(`Generating ${count} questions for ${info.label}...`);

    try {
      setProgress(30);
      const data = await aiService.generateQuestions(selectedPart, difficulty, count);

      setProgress(80);
      setStatusMessage("Processing questions...");

      const questions: TestQuestion[] = (data || [])
        .filter((q: any) => q.content && q.correctAnswer && q.options?.length === 4)
        .map((q: any) => ({
          id: crypto.randomUUID(),
          content: q.content,
          audioUrl: null,
          imageUrl: null,
          passage: q.passage || null,
          correctAnswer: q.correctAnswer,
          options: q.options,
        }));

      setPreviewQuestions(questions);
      setProgress(100);
      setStatusMessage(`Generated ${questions.length} questions`);
      toast.success(`Generated ${questions.length} questions for ${info.label}`);
    } catch (err: any) {
      console.error("Generation error:", err);
      setStatusMessage("");
      setProgress(0);
      toast.error("Generation failed", { 
        description: err?.response?.data?.message || err.message 
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPart, difficulty, count, info.label]);

  const handleInsert = () => {
    onQuestionsGenerated(selectedPart, previewQuestions);
    setPreviewQuestions([]);
    setProgress(0);
    setStatusMessage("");
    toast.success(`Inserted ${previewQuestions.length} questions into ${info.label}`);
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-screen w-full max-w-lg bg-background border-l border-border shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-base">AI Question Generator</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Generate TOEIC Reading questions automatically using AI.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Generator Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Part</Label>
              <Select value={selectedPart} onValueChange={(v) => setSelectedPart(v as PartType)} disabled={isGenerating}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PART_5">Part 5 — Incomplete Sentences (30)</SelectItem>
                  <SelectItem value="PART_6">Part 6 — Text Completion (16)</SelectItem>
                  <SelectItem value="PART_7">Part 7 — Reading Comprehension (54)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} disabled={isGenerating}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/40 border border-border/50 p-3.5 text-sm text-muted-foreground">
              Will generate <span className="font-semibold text-foreground">{count}</span> questions for{" "}
              <span className="font-semibold text-foreground">{info.label}</span>
              <span className="text-xs block mt-1 text-muted-foreground/80">{info.description}</span>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-11" size="lg">
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating questions with AI...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate {count} Questions</>
            )}
          </Button>

          {/* Progress */}
          {(isGenerating || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {progress === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {statusMessage}
              </p>
            </div>
          )}

          {/* Preview Section */}
          {previewQuestions.length > 0 && (
            <>
              <Separator />

              <div className="space-y-4">
                {/* Preview Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-semibold text-foreground">Preview</h4>
                    <Badge variant="secondary" className="text-xs">{previewQuestions.length} questions</Badge>
                  </div>
                  <Button size="sm" onClick={handleInsert} className="h-8">
                    Insert All
                  </Button>
                </div>

                {/* Question Cards */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {previewQuestions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
