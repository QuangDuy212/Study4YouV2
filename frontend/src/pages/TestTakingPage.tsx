import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flag, AlertCircle, X, ChevronLeft, ChevronRight, Volume2, Bookmark, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getMediaUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import testService from "@/services/testService";
import attemptService from "@/services/attemptService";
import answerService from "@/services/answerService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Internal data structures matching the frontend state
interface Question {
  id: string;
  displayNumber: number;
  question: string;
  options: string[];
  correct: number;
  image?: string | null;
  audio?: boolean;
  passage?: string | null;
}

interface Part {
  id: string;
  title: string;
  section: "listening" | "reading";
  description: string;
  questions: Question[];
}

const TOTAL_TIME = 120 * 60; // 120 minutes in seconds

export default function TestTakingPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [testTitle, setTestTitle] = useState("TOEIC Test");
  const [parts, setParts] = useState<Part[]>([]);
  const [fullAudio, setFullAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPart, setCurrentPart] = useState(0);
  const [currentQuestionInPart, setCurrentQuestionInPart] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  // Timer state
  const storageKey = `toeic_timer_v2_${id}`;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  // Load Test Data
  useEffect(() => {
    const fetchTestData = async () => {
      if (!id) return;
      try {
        const testData = await testService.getTestById(id);
        setTestTitle(testData.title);
        setFullAudio(testData.audioUrl || null);

        if (!testData.parts) throw new Error("Test has no parts");

        // Map backend entities to frontend state
        const mappedParts: Part[] = testData.parts
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((p) => ({
            id: p.id,
            title: p.part.replace("_", " "),
            section: ["PART_1", "PART_2", "PART_3", "PART_4"].includes(p.part) ? "listening" : "reading",
            description: p.part,
            questions: (p.questions || [])
              .map((q, idx) => ({
                id: q.id,
                displayNumber: idx + 1,
                question: q.content,
                options: (q.options || [])
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((o) => o.content),
                correct: (q.correctAnswer?.charCodeAt(0) || 65) - 65,
                image: q.imageUrl,
                audio: !!q.audioUrl,
                passage: q.passage,
              })),
          }));

        setParts(mappedParts);

        // Khởi tạo thời gian mới hoàn toàn mỗi khi vào trang
        setTimeLeft(testData.durationMinutes * 60 || TOTAL_TIME);
      } catch (err) {
        console.error("Failed to load test:", err);
        toast.error("Failed to load test details");
        navigate("/tests");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [id, navigate, storageKey]);

  // Timer Interval
  useEffect(() => {
    if (isLoading || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        if (next === 300 && !showWarning) setShowWarning(true);
        localStorage.setItem(storageKey, JSON.stringify({ time: next, timestamp: Date.now() }));
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitting, showWarning, storageKey]);

  const part = parts[currentPart];
  const question = part?.questions[currentQuestionInPart];

  const getGlobalIndex = useCallback((partIdx: number, qIdx: number): number => {
    let idx = 0;
    for (let i = 0; i < partIdx; i++) idx += parts[i].questions.length;
    return idx + qIdx;
  }, [parts]);

  const getPartAndLocal = useCallback((globalIdx: number): [number, number] => {
    let count = 0;
    for (let i = 0; i < parts.length; i++) {
      if (globalIdx < count + parts[i].questions.length) {
        return [i, globalIdx - count];
      }
      count += parts[i].questions.length;
    }
    return [0, 0];
  }, [parts]);

  const globalQuestionIndex = part ? getGlobalIndex(currentPart, currentQuestionInPart) : 0;
  const totalQuestions = parts.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [globalQuestionIndex]: optionIndex }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(globalQuestionIndex)) next.delete(globalQuestionIndex);
      else next.add(globalQuestionIndex);
      return next;
    });
  };

  const goToQuestion = useCallback((globalIdx: number) => {
    const [p, q] = getPartAndLocal(globalIdx);
    setCurrentPart(p);
    setCurrentQuestionInPart(q);
    questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [getPartAndLocal]);

  const handleNext = () => {
    if (currentQuestionInPart < part.questions.length - 1) {
      setCurrentQuestionInPart(prev => prev + 1);
    } else if (currentPart < parts.length - 1) {
      setCurrentPart(prev => prev + 1);
      setCurrentQuestionInPart(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionInPart > 0) {
      setCurrentQuestionInPart(prev => prev - 1);
    } else if (currentPart > 0) {
      const prevPart = currentPart - 1;
      setCurrentPart(prevPart);
      setCurrentQuestionInPart(parts[prevPart].questions.length - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    localStorage.removeItem(storageKey);

    try {
      if (!profile?.id || !id) throw new Error("Missing user or test information");

      // 1. Calculate scores
      let correct = 0;
      let globalIdx = 0;
      const answerRequests: { questionId: string; selected: string; correct: boolean; isFlagged: boolean }[] = [];

      parts.forEach((p) => {
        p.questions.forEach((q) => {
          const selectedIdx = answers[globalIdx];
          if (selectedIdx !== undefined) {
            const label = String.fromCharCode(65 + selectedIdx);
            const isCorrect = (selectedIdx === q.correct);
            if (isCorrect) correct++;
            const isFlagged = flaggedQuestions.has(globalIdx);
            answerRequests.push({ questionId: q.id, selected: label, correct: isCorrect, isFlagged });
          }
          globalIdx++;
        });
      });

      const rawScore = correct;
      const toeicScore = Math.round((correct / totalQuestions) * 990);

      // 2. Create Attempt
      const attempt = await attemptService.createAttempt({
        userId: profile.id,
        testId: id,
        startedAt: new Date(Date.now() - (TOTAL_TIME - timeLeft) * 1000).toISOString(),
        submittedAt: new Date().toISOString(),
        rawScore,
        toeicScore
      });

      // 3. Save Answers (Sequential as no bulk endpoint)
      await Promise.all(
        answerRequests.map((req) =>
          answerService.createAnswer({
            attemptId: attempt.id,
            questionId: req.questionId,
            selectedOption: req.selected,
            correct: req.correct,
            isFlagged: req.isFlagged
          })
        )
      );

      toast.success(t('testSubmitted'));
      navigate(`/result/${id}`, { state: { score: toeicScore, total: totalQuestions, correct, maxScore: 990, attemptId: attempt.id } });
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error(t('errorSubmitting'));
      setIsSubmitting(false);
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderSidebarContent = () => (
    <>
      <div className="px-6 pb-6 pt-4 space-y-4 bg-muted/20 border-b border-border/50 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('timeRemaining')}</p>
          <div className={cn(
            "flex items-center gap-3 text-3xl font-mono font-black",
            timeLeft <= 300 ? "text-destructive animate-pulse" : "text-foreground"
          )}>
            <Clock className="w-6 h-6" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="w-full gap-2 py-6 text-lg font-bold shadow-lg"
          variant="default"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flag className="w-5 h-5" />}
          {t('submitTest')}
        </Button>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium">{t('progress')}</span>
          <span className="text-foreground font-bold">{answeredCount}/{totalQuestions} {t('answered')}</span>
        </div>

        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
           <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(answeredCount/totalQuestions)*100}%` }} />
        </div>
      </div>

      {/* Question Navigator */}
      <ScrollArea className="flex-1 border-t border-border">
        <div className="p-4 space-y-6">
          {parts.map((p, partIdx) => {
            const partStart = parts.slice(0, partIdx).reduce((s, pp) => s + pp.questions.length, 0);
            return (
              <div key={p.id} className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    p.section === "listening" ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  )} />
                  {p.title}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {p.questions.map((q, qIdx) => {
                    const gIdx = partStart + qIdx;
                    const isAnswered = answers[gIdx] !== undefined;
                    const isFlagged = flaggedQuestions.has(gIdx);
                    const isCurrent = currentPart === partIdx && currentQuestionInPart === qIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => goToQuestion(gIdx)}
                        disabled={isSubmitting}
                        className={cn(
                          "aspect-square rounded-md text-[10px] font-bold transition-all flex items-center justify-center border",
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-110 z-10"
                            : isFlagged
                            ? "bg-amber-50 text-amber-600 border-amber-300 shadow-sm"
                            : isAnswered
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30 hover:bg-muted"
                        )}
                      >
                        {q.displayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-muted/10 shrink-0">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-muted border border-border" /> {t('unanswered')}</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/30" /> {t('answered')}</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" /> {t('flagged')}</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-primary border border-primary" /> {t('current')}</span>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">{t('preparingTestEnv')}</p>
      </div>
    );
  }


  return (
    <div className="w-full bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/tests")} className="gap-1 text-muted-foreground">
              <X className="w-4 h-4" />
              {t('close')}
            </Button>
            <span className="font-display font-semibold text-foreground text-lg hidden md:block">
              {testTitle}
            </span>
          </div>
          {part?.section === "listening" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('audioPlayerDesc')}</span>
            </div>
          )}

        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left / Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Part Tabs */}
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex overflow-x-auto px-2">
              {parts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentPart(idx); setCurrentQuestionInPart(0); }}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    currentPart === idx
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <span className={cn(
                    "inline-block w-2 h-2 rounded-full mr-2",
                    p.section === "listening" ? "bg-purple-500" : "bg-blue-500"
                  )} />
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Part Description */}
          <div className="px-6 py-3 bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded",
                part?.section === "listening" ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
              )}>
                {part?.section === "listening" ? "LISTENING" : "READING"}
              </span>
              <span className="text-sm text-muted-foreground truncate">{part?.description}</span>
            </div>
          </div>

          {/* Full Test Audio (Shared for all listening parts) */}
          {part?.section === "listening" && fullAudio && (
            <div className="bg-card px-6 py-4 border-b border-border flex flex-col items-center shadow-sm">
              <div className="w-full max-w-lg mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3 h-3 text-primary" /> {t('fullTestAudio')}
                </span>
                <Badge variant="outline" className="text-[9px] font-bold h-4">MP3</Badge>
              </div>
              <audio 
                controls 
                src={getMediaUrl(fullAudio)} 
                className="w-full max-w-lg" 
                controlsList="nodownload" 
              />
            </div>
          )}

          {/* Question Content */}
          <div ref={questionRef} className="max-w-3xl mx-auto p-6 space-y-6 pb-32 lg:pb-8">
            {!question ? (
              <div className="py-20 text-center text-muted-foreground">{t('noQuestionsFound')}</div>
            ) : (
              <>
                {/* Passage Grouping Logic */}
                {(() => {
                  const isPart6 = part?.description === "PART_6";
                  const isPart7 = part?.description === "PART_7";
                  
                  const isGrouped = isPart6 || isPart7;
                  
                  if (isGrouped) {
                    let setSize = isPart6 ? 4 : 2; // Baseline for Part 7

                    const setIndex = Math.floor(currentQuestionInPart / setSize);
                    const startIndex = setIndex * setSize;
                    const setQuestions = part.questions.slice(startIndex, startIndex + setSize);
                    const firstQuestion = setQuestions[0];
                    const isListening = part?.section === "listening";

                    return (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Only show passage/transcript for reading parts */}
                        {!isListening && firstQuestion?.passage && (
                          <div className="bg-card rounded-xl border border-border p-6 shadow-sm ring-1 ring-primary/5">
                            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                {t('readingPassage')}
                              </p>
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-primary/5 text-primary border-primary/20">
                                {t('questions')} {getGlobalIndex(currentPart, startIndex) + 1} - {getGlobalIndex(currentPart, startIndex + setQuestions.length)}
                              </Badge>
                            </div>
                            <p className="text-foreground text-base leading-relaxed whitespace-pre-line italic font-serif">
                              {firstQuestion.passage}
                            </p>
                          </div>
                        )}

                        <div className="space-y-8">
                          {setQuestions.map((q, idx) => {
                            const localQIdx = startIndex + idx;
                            const globalQIdx = getGlobalIndex(currentPart, localQIdx);
                            
                            return (
                              <div key={q.id} className="space-y-4 pt-4 border-t border-border/30 first:border-0 first:pt-0">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                                    {t('question')} {getGlobalIndex(currentPart, localQIdx) + 1}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const next = new Set(flaggedQuestions);
                                      if (next.has(globalQIdx)) next.delete(globalQIdx);
                                      else next.add(globalQIdx);
                                      setFlaggedQuestions(next);
                                    }}
                                    className={cn(
                                      "h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                                      flaggedQuestions.has(globalQIdx) ? "text-amber-500 bg-amber-50" : "text-muted-foreground"
                                    )}
                                  >
                                    <Bookmark className={cn("w-3.5 h-3.5", flaggedQuestions.has(globalQIdx) && "fill-current")} />
                                    {flaggedQuestions.has(globalQIdx) ? t('flagged') : t('flag')}
                                  </Button>
                                </div>
                                <p className="text-foreground font-medium text-lg mb-4">{q.question}</p>
                                
                                <div className="grid grid-cols-1 gap-2.5">
                                  {q.options.map((option, optIdx) => (
                                    <button
                                      key={optIdx}
                                      onClick={() => setAnswers((prev) => ({ ...prev, [globalQIdx]: optIdx }))}
                                      className={cn(
                                        "w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 group relative overflow-hidden",
                                        answers[globalQIdx] === optIdx
                                          ? "border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/10"
                                          : "border-border bg-card hover:border-primary/40 text-foreground hover:bg-secondary/30"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 relative z-10">
                                        <span className={cn(
                                          "w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 shrink-0 transition-all",
                                          answers[globalQIdx] === optIdx
                                            ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md"
                                            : "border-muted-foreground/30 text-muted-foreground bg-muted/20"
                                        )}>
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="text-base font-medium">{option}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Default Single Question View
                  return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {part?.section === "reading" && question.passage && (
                         <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                          <p className="text-sm text-muted-foreground font-medium mb-2 border-b pb-1">{t('readingPassage')}</p>
                          <p className="text-foreground whitespace-pre-line leading-relaxed italic">{question.passage}</p>
                        </div>
                      )}

                      {question.image && (
                        <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center shadow-sm overflow-hidden text-center group">
                          <img 
                            src={getMediaUrl(question.image)} 
                            alt="Question Graphic" 
                            className="max-h-80 w-auto object-contain rounded transition-transform duration-500 group-hover:scale-[1.02]" 
                          />
                        </div>
                      )}

                      <div className="bg-card rounded-xl border border-border p-6 shadow-sm ring-1 ring-primary/5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/10">
                            {t('question')} {globalQuestionIndex + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFlag}
                            className={cn(
                              "gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                              flaggedQuestions.has(globalQuestionIndex) ? "text-amber-500 bg-amber-50" : "text-muted-foreground"
                            )}
                          >
                            <Bookmark className={cn("w-4 h-4", flaggedQuestions.has(globalQuestionIndex) && "fill-current")} />
                            {flaggedQuestions.has(globalQuestionIndex) ? t('flagged') : t('flag')}
                          </Button>
                        </div>
                        <p className="text-foreground text-xl font-medium leading-relaxed">{question.question}</p>
                      </div>

                      <div className="space-y-3">
                        {question.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 group relative overflow-hidden",
                              answers[globalQuestionIndex] === index
                                ? "border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/10"
                                : "border-border bg-card hover:border-primary/40 text-foreground hover:bg-secondary/30"
                            )}
                          >
                            <div className="flex items-center gap-4 relative z-10">
                              <span className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 shrink-0 transition-all",
                                answers[globalQuestionIndex] === index
                                  ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md"
                                  : "border-muted-foreground/30 text-muted-foreground bg-muted/20"
                              )}>
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-base font-medium">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-12 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => {
                        const isPart6 = part?.description === "PART_6";
                        const isPart7 = part?.description === "PART_7";
                        if (isPart6 || isPart7) {
                            let setSize = isPart6 ? 4 : 2;
                            const currentSetIdx = Math.floor(currentQuestionInPart / setSize);
                            if (currentSetIdx > 0) {
                                setCurrentQuestionInPart((currentSetIdx - 1) * setSize);
                            } else {
                                handlePrevious();
                            }
                        } else {
                            handlePrevious();
                        }
                    }}
                    disabled={currentPart === 0 && currentQuestionInPart === 0 || isSubmitting}
                    className="gap-2 px-8 h-12 font-bold rounded-xl border-2 hover:bg-secondary/50 group"
                  >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />{t('previous')}
                  </Button>
                  
                  <div className="hidden sm:flex flex-col items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('progress')}</span>
                    <span className="text-sm font-black text-foreground bg-secondary/80 px-4 py-1.5 rounded-full ring-1 ring-border">
                        {globalQuestionIndex + 1} / {totalQuestions}
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                        const isPart6 = part?.description === "PART_6";
                        const isPart7 = part?.description === "PART_7";
                        if (isPart6 || isPart7) {
                            let setSize = isPart6 ? 4 : 2;
                            const nextSetStart = (Math.floor(currentQuestionInPart / setSize) + 1) * setSize;
                            if (nextSetStart < part.questions.length) {
                                setCurrentQuestionInPart(nextSetStart);
                            } else {
                                handleNext();
                            }
                        } else {
                            handleNext();
                        }
                    }}
                    disabled={currentPart === parts.length - 1 && currentQuestionInPart === part.questions.length - 1 || isSubmitting}
                    className="gap-2 px-8 h-12 font-bold rounded-xl border-2 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    {t('next')}<ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar Desktop */}
        <aside className="w-80 bg-card border-l border-border flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] hidden lg:flex shadow-xl z-20 overflow-hidden">
          {renderSidebarContent()}
        </aside>
      </div>

      {/* Mobile Bottom Bar & Navigator Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">{t('timeRemaining')}</span>
          <div className={cn("text-xl font-mono font-black", timeLeft <= 300 ? "text-destructive animate-pulse" : "text-foreground")}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowSubmitDialog(true)} size="sm" className="font-bold gap-1.5" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            <span>{t('submitTest')}</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="font-bold gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col">
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('confirmSubmit')}</DialogTitle>
            <DialogDescription className="pt-2">
              <div className="space-y-4">
                <p>{t('completedQuestionsDesc')?.replace('{answered}', String(answeredCount))?.replace('{total}', String(totalQuestions))}</p>
                
                {(totalQuestions - answeredCount > 0 || flaggedQuestions.size > 0) && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                    {totalQuestions - answeredCount > 0 && (
                      <div className="flex items-center gap-2 text-amber-700 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{t('unansweredQuestionsWarning')?.replace('{count}', String(totalQuestions - answeredCount))}</span>
                      </div>
                    )}
                    {flaggedQuestions.size > 0 && (
                      <div className="flex items-center gap-2 text-amber-700 text-sm">
                        <Bookmark className="w-4 h-4 fill-current" />
                        <span>{t('flaggedQuestionsWarning')?.replace('{count}', String(flaggedQuestions.size))}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">{t('submitFinalWarning')}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="sm:flex-1" disabled={isSubmitting}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="sm:flex-1 gap-2 bg-primary font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {t('confirmSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* 5 Minute Warning */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black text-2xl">
              <AlertCircle className="w-8 h-8" />
              {t('timeRunningOut')}
            </DialogTitle>
            <DialogDescription className="text-lg pt-2">
              {t('fiveMinutesRemaining')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWarning(false)} className="w-full py-6 text-lg font-bold">{t('iUnderstand')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
