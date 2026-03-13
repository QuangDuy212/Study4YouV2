import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Trash2, Headphones, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TestPart, PartType } from "./types";
import { PART_LABELS, READING_PARTS, LISTENING_PARTS, createEmptyQuestion } from "./types";
import QuestionEditor from "./QuestionEditor";
import ListeningMediaUploader from "./ListeningMediaUploader";

interface PartItemProps {
  part: TestPart;
  onChange: (part: TestPart) => void;
  onDelete: () => void;
  onOpenAIPanel: (partType: PartType) => void;
}

export default function PartItem({ part, onChange, onDelete, onOpenAIPanel }: PartItemProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const info = PART_LABELS[part.type];
  const isReading = READING_PARTS.includes(part.type);
  const isListening = LISTENING_PARTS.includes(part.type);

  const addQuestion = () => {
    const isPart6 = part.type === "PART_6";
    const isPart7 = part.type === "PART_7";
    
    if (isPart6 || isPart7) {
      const setSize = isPart6 ? 4 : 2;
      const newQuestions = Array.from({ length: setSize }, () => createEmptyQuestion(part.type));
      onChange({ ...part, questions: [...part.questions, ...newQuestions] });
    } else {
      onChange({ ...part, questions: [...part.questions, createEmptyQuestion(part.type)] });
    }
    
    if (!expanded) setExpanded(true);
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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Part Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
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
            <p className="font-semibold text-sm text-foreground">{info.label}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {part.questions.length} questions
          </Badge>
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
            <div className="p-4 pt-0 space-y-3 border-t border-border">
              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Question
                </Button>
                {isReading && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => onOpenAIPanel(part.type)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate with AI
                  </Button>
                )}
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove Part
                  </Button>
                </div>
              </div>

              {/* Part Level Audio */}
              {isListening && (
                <div className="pt-2 pb-1 border-b border-border/50">
                  <ListeningMediaUploader
                    hideImage
                    audioUrl={part.audioUrl || null}
                    onAudioChange={(url) => onChange({ ...part, audioUrl: url })}
                  />
                </div>
              )}

              {/* Questions */}
              {part.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t('noQuestionsYet')}
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const isPart6 = part.type === "PART_6";
                    const isPart7 = part.type === "PART_7";
                    
                    if (isPart6 || isPart7) {
                      const setSize = isPart6 ? 4 : 2;
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
                          
                          {/* Shared Passage Editor for the Set */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                              <BookOpen className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">{t('sharedPassage')}</span>
                            </div>
                            <textarea
                              className="w-full min-h-[100px] p-3 rounded-lg border border-primary/20 bg-background text-sm font-serif italic focus:ring-1 focus:ring-primary outline-none"
                              placeholder={t('enterSharedPassage')}
                              value={group[0]?.passage || ""}
                              onChange={(e) => {
                                const newPassage = e.target.value;
                                const startIndex = gIdx * setSize;
                                const updatedQuestions = [...part.questions];
                                for (let i = startIndex; i < startIndex + group.length; i++) {
                                  updatedQuestions[i] = { ...updatedQuestions[i], passage: newPassage };
                                }
                                onChange({ ...part, questions: updatedQuestions });
                              }}
                            />
                          </div>

                          <div className="space-y-3">
                            {group.map((q, qi) => {
                              const absoluteIdx = gIdx * setSize + qi;
                              return (
                                <QuestionEditor
                                  key={q.id}
                                  question={q}
                                  index={absoluteIdx}
                                  partType={part.type}
                                  onChange={(updated) => updateQuestion(absoluteIdx, updated)}
                                  onDelete={() => deleteQuestion(absoluteIdx)}
                                  hidePassageField // Hide the redundant passage field inside QuestionEditor
                                />
                              );
                            })}
                          </div>
                        </div>
                      ));
                    }

                    // Default view for other parts
                    return (
                      <div className="space-y-3">
                        {part.questions.map((q, qi) => (
                          <QuestionEditor
                            key={q.id}
                            question={q}
                            index={qi}
                            partType={part.type}
                            onChange={(updated) => updateQuestion(qi, updated)}
                            onDelete={() => deleteQuestion(qi)}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
