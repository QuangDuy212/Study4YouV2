import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Trash2, Headphones, BookOpen, Sparkles, GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TestPart, PartType } from "./types";
import { PART_LABELS, READING_PARTS, LISTENING_PARTS, createEmptyQuestion, PART_QUESTION_LIMITS } from "./types";
import { toast } from "sonner";
import aiService from "@/services/aiService";
import QuestionEditor from "./QuestionEditor";
import ListeningMediaUploader from "./ListeningMediaUploader";

interface PartItemProps {
  part: TestPart;
  onChange: (part: TestPart) => void;
  onDelete: () => void;
  onOpenAIPanel: (partType: PartType) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function PartItem({ part, onChange, onDelete, onOpenAIPanel, expanded, onToggle }: PartItemProps) {
  const { t } = useLanguage();
  const info = PART_LABELS[part.type];
  const isReading = READING_PARTS.includes(part.type);
  const isListening = LISTENING_PARTS.includes(part.type);
  const limit = PART_QUESTION_LIMITS[part.type];
  const isLimitReached = part.questions.length >= limit;

  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);

  const renderQuestionItem = (q: typeof part.questions[0], absoluteIdx: number, isGrouped = false) => {
    const isExpanded = expandedQuestionIndex === absoluteIdx;

    if (isExpanded) {
      return (
        <div key={q.id} className="border border-border/80 rounded-xl bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
              Editing Q{absoluteIdx + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpandedQuestionIndex(null)}
            >
              Collapse
            </Button>
          </div>
          <QuestionEditor
            question={q}
            index={absoluteIdx}
            partType={part.type}
            onChange={(updated) => updateQuestion(absoluteIdx, updated)}
            onDelete={() => {
              deleteQuestion(absoluteIdx);
              setExpandedQuestionIndex(null);
            }}
            hidePassageField={isGrouped}
          />
        </div>
      );
    }

    return (
      <div
        key={q.id}
        onClick={() => setExpandedQuestionIndex(absoluteIdx)}
        className="p-4 rounded-xl border border-border/80 flex items-center justify-between bg-card hover:bg-muted/30 cursor-pointer shadow-sm transition-all duration-200 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <GripVertical className="w-4 h-4 text-muted-foreground/60 mr-1 flex-shrink-0" />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
            Q{absoluteIdx + 1}
          </span>
          <span className="text-sm text-foreground/80 font-medium truncate pr-4">
            {q.content || "Mark your answer on your answer sheet."}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-200/60 font-semibold gap-1 text-xs px-2.5 py-1">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {q.correctAnswer || "A"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              deleteQuestion(absoluteIdx);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const addQuestion = () => {
    if (isLimitReached) return;
    const isGrouped = ["PART_3", "PART_4", "PART_6", "PART_7"].includes(part.type);
    const getSetSize = (type: PartType) => type === "PART_6" ? 4 : (type === "PART_7" ? 2 : 3);
    
    if (isGrouped) {
      const setSize = getSetSize(part.type);
      const newQuestions = Array.from({ length: setSize }, () => createEmptyQuestion(part.type));
      onChange({ ...part, questions: [...part.questions, ...newQuestions] });
    } else {
      onChange({ ...part, questions: [...part.questions, createEmptyQuestion(part.type)] });
    }
    
    if (!expanded) onToggle();
  };

  const autoFillMissing = () => {
    if (isLimitReached) return;
    const remaining = limit - part.questions.length;
    let newQuestions: typeof part.questions = [];
    
    const isGrouped = ["PART_3", "PART_4", "PART_6", "PART_7"].includes(part.type);
    const getSetSize = (type: PartType) => type === "PART_6" ? 4 : (type === "PART_7" ? 2 : 3);

    if (isGrouped) {
      const setSize = getSetSize(part.type);
      const setsToGenerate = Math.floor(remaining / setSize);
      newQuestions = Array.from({ length: setsToGenerate * setSize }, () => createEmptyQuestion(part.type));
    } else {
      newQuestions = Array.from({ length: remaining }, () => createEmptyQuestion(part.type));
    }
    onChange({ ...part, questions: [...part.questions, ...newQuestions] });
    if (!expanded) onToggle();
  };

  const updateQuestion = (index: number, q: typeof part.questions[0]) => {
    const updated = [...part.questions];
    updated[index] = q;
    onChange({ ...part, questions: updated });
  };

  const deleteQuestion = (index: number) => {
    onChange({ ...part, questions: part.questions.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Part Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors sticky top-14 sm:top-16 z-20 bg-card rounded-t-xl",
          expanded && "border-b border-border/80 shadow-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            isListening ? "bg-purple-500/10" : "bg-blue-500/10"
          )}>
            {isListening ? (
              <Headphones className="w-4 h-4 text-purple-600" />
            ) : (
              <BookOpen className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">{t(info.labelKey)}</p>
            <p className="text-xs text-muted-foreground">{t(info.descriptionKey)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isLimitReached ? "default" : "secondary"} 
            className={cn("text-xs", isLimitReached && "bg-emerald-500 hover:bg-emerald-600")}
          >
            {part.questions.length} / {limit} {t("questions")}
          </Badge>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded px-2 py-1 transition-colors font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("removePart")}
          </button>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Part Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-6 space-y-4 border-t border-border">


              {/* Questions */}
              {part.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t('noQuestionsFound')}
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const isGrouped = ["PART_3", "PART_4", "PART_6", "PART_7"].includes(part.type);
                    const getSetSize = (type: PartType) => type === "PART_6" ? 4 : (type === "PART_7" ? 2 : 3);
                    
                    if (isGrouped) {
                      const setSize = getSetSize(part.type);
                      const groups: typeof part.questions[] = [];
                      for (let i = 0; i < part.questions.length; i += setSize) {
                        groups.push(part.questions.slice(i, i + setSize));
                      }

                      return groups.map((group, gIdx) => (
                        <div key={gIdx} className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-4">
                          <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                                {t('set')} {gIdx + 1} ({group.length} {t('questions')})
                             </Badge>
                             <div className="flex items-center gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-7 text-[10px] text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                                 onClick={async () => {
                                   const passageText = isListening ? group[0]?.transcript : group[0]?.passage;
                                   const toastId = toast.loading(
                                     passageText 
                                       ? "AI is generating questions based on your transcript..." 
                                       : "AI is creating a new transcript/passage and questions for this set..."
                                   );
                                   
                                   try {
                                     // Gọi API tạo đề, truyền passageText hiện tại (nếu có, nếu không để trống để AI tự sinh mới)
                                     const data = await aiService.generateQuestions(part.type, "MEDIUM", group.length, "", passageText || "");
                                     const startIndex = gIdx * setSize;
                                     const updatedQuestions = [...part.questions];
                                     
                                     // Trích xuất Transcript/Passage tự sinh từ AI phản hồi
                                     let generatedText = "";
                                     if (Array.isArray(data) && data.length > 0) {
                                       const firstQ = data[0];
                                       generatedText = firstQ.transcript || firstQ.conversation || firstQ.passage || firstQ.reading_text || firstQ.text || firstQ.dialogue || firstQ.audio_text || "";
                                     }
                                     const finalContextText = passageText || generatedText;

                                     (data || []).slice(0, group.length).forEach((newQ: any, i: number) => {
                                       if (updatedQuestions[startIndex + i]) {
                                         updatedQuestions[startIndex + i] = {
                                           ...updatedQuestions[startIndex + i],
                                           content: newQ.content,
                                           correctAnswer: newQ.correctAnswer,
                                           options: newQ.options.map((o: any) => ({ label: o.label, content: o.content })),
                                           transcript: isListening ? finalContextText : null,
                                           passage: !isListening ? finalContextText : null,
                                         };
                                       }
                                     });
                                     onChange({ ...part, questions: updatedQuestions });
                                     toast.success("Set generated successfully!", { id: toastId });
                                   } catch (err) {
                                     toast.error("Failed to generate questions", { id: toastId });
                                   }
                                 }}
                               >
                                 <Sparkles className="w-3 h-3 mr-1" /> {t('aiGenerate') || "AI Generate"}
                               </Button>
                               <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const startIndex = gIdx * setSize;
                                  onChange({ ...part, questions: part.questions.filter((_, i) => i < startIndex || i >= startIndex + setSize) });
                                }}
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> {t('removeSet')}
                              </Button>
                             </div>
                          </div>
                          
                          {/* Shared Passage/Transcript Editor for the Set */}
                          {["PART_3", "PART_4", "PART_6", "PART_7"].includes(part.type) && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-primary">
                                {isListening ? <Headphones className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                <span className="text-xs font-bold uppercase tracking-wider">
                                  {isListening ? t('sharedTranscript') : t('sharedPassage')}
                                </span>
                              </div>
                              <textarea
                                className={cn(
                                  "w-full min-h-[120px] p-4 rounded-xl border border-primary/20 bg-background text-sm leading-relaxed shadow-inner outline-none focus:ring-1 focus:ring-primary transition-all",
                                  isListening ? "font-sans" : "font-serif italic"
                                )}
                                placeholder={isListening ? t('enterSharedTranscript') : t('enterSharedPassage')}
                                value={
                                  isListening 
                                    ? (group.find(q => q.transcript)?.transcript || group[0]?.transcript || "") 
                                    : (group.find(q => q.passage)?.passage || group[0]?.passage || "")
                                }
                                onChange={(e) => {
                                  const newText = e.target.value;
                                  const startIndex = gIdx * setSize;
                                  const updatedQuestions = [...part.questions];
                                  for (let i = startIndex; i < startIndex + group.length; i++) {
                                    if (isListening) {
                                      updatedQuestions[i] = { ...updatedQuestions[i], transcript: newText };
                                    } else {
                                      updatedQuestions[i] = { ...updatedQuestions[i], passage: newText };
                                    }
                                  }
                                  onChange({ ...part, questions: updatedQuestions });
                                }}
                              />
                            </div>
                          )}

                          <div className="space-y-3">
                            {group.map((q, qi) => {
                              const absoluteIdx = gIdx * setSize + qi;
                              return renderQuestionItem(q, absoluteIdx, true);
                            })}
                          </div>
                        </div>
                      ));
                    }

                    // Default view for other parts
                    return (
                      <div className="space-y-3 mt-4">
                        {part.questions.map((q, qi) => renderQuestionItem(q, qi, false))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Bottom Action buttons */}
              <div className="flex flex-col gap-3 pt-4 pb-2 border-t border-border/50 mt-4">
                {isLimitReached && (
                  <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs py-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('maxQuestionsReached', { count: limit })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-between w-full border-t border-border/50 pt-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addQuestion}
                        disabled={isLimitReached}
                        className="bg-primary/5 border-primary/20 hover:bg-primary/10 hover:text-primary text-primary disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> {t("addQuestion")}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={autoFillMissing}
                        disabled={isLimitReached}
                        className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {t('quickFill', { count: limit - part.questions.length })}
                      </Button>
                      {!["PART_1", "PART_2"].includes(part.type) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLimitReached}
                          className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors"
                          onClick={() => onOpenAIPanel(part.type)}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> {t("generateWithAI")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
