import { useState, useCallback } from "react";
import { X, Sparkles, Loader2, CheckCircle2, Hash, BookOpen } from "lucide-react";
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
import type { PartType, Difficulty, TestQuestion } from "./types";
import { AI_QUESTION_COUNTS, PART_LABELS } from "./types";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";


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
  const { t } = useLanguage();
  const [selectedPart, setSelectedPart] = useState<PartType>(initialPart);

  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [topic, setTopic] = useState("");
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
      const data = await aiService.generateQuestions(selectedPart, difficulty, count, topic);

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
              <h3 className="font-display font-semibold text-foreground text-base">{t('aiQuestionGenerator')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('generateReadingQuestionsDesc')}</p>
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
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('part')}</Label>
              <Select value={selectedPart} onValueChange={(v) => setSelectedPart(v as PartType)} disabled={isGenerating}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PART_5">{t('part5Desc')} (30)</SelectItem>
                  <SelectItem value="PART_6">{t('part6Desc')} (16)</SelectItem>
                  <SelectItem value="PART_7">{t('part7Desc')} (54)</SelectItem>
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
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('topicHint')} ({t('optional')})</Label>
              <Input 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                placeholder="e.g. Finance, Green Energy, Travel..."
                disabled={isGenerating}
                className="h-10"
              />
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
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t('aiIsGenerating')}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> {t('generateQuestions')} ({count})</>
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
                    <h4 className="text-sm font-semibold text-foreground">{t('generatedPreview')}</h4>
                    <Badge variant="secondary" className="text-xs">{previewQuestions.length} {t('questions').toLowerCase()}</Badge>
                  </div>
                  <Button size="sm" onClick={handleInsert} className="h-8">
                    {t('add')}
                  </Button>
                </div>


                {/* Question Cards */}
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {(() => {
                    const isPart6 = selectedPart === "PART_6";
                    const isPart7 = selectedPart === "PART_7";
                    
                    if (isPart6 || isPart7) {
                      const setSize = isPart6 ? 4 : 2;
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
                           
                           {group[0]?.passage && (
                             <div className="rounded-xl bg-card p-4 text-[13px] text-foreground leading-relaxed border border-border/50 font-serif italic shadow-sm">
                               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5 opacity-60">
                                 <BookOpen className="w-3 h-3" /> {t('readingPassage')}
                               </p>
                               {group[0].passage}
                             </div>
                           )}

                           <div className="space-y-4">
                              {group.map((q, qIdx) => (
                                <QuestionCard key={q.id} question={{ ...q, passage: null }} index={gIdx * setSize + qIdx} />
                              ))}
                           </div>
                        </div>
                      ));
                    }

                    return previewQuestions.map((q, i) => (
                      <QuestionCard key={q.id} question={q} index={i} />
                    ));
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
