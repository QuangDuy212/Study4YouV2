import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  RotateCcw,
  Home,
  Clock,
  Target,
  BookOpen,
  Loader2,
  AlertCircle,
  Minus,
  Flag,
  Volume2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getMediaUrl } from "@/lib/utils";
import attemptService, {
  type TestReviewResponse,
  type ReviewQuestion,
} from "@/services/attemptService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(secs: number | null | undefined): string {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getPartLabel(partName: string): string {
  const map: Record<string, string> = {
    PART_1: "Part 1 – Photographs",
    PART_2: "Part 2 – Q&A",
    PART_3: "Part 3 – Conversations",
    PART_4: "Part 4 – Talks",
    PART_5: "Part 5 – Incomplete Sentences",
    PART_6: "Part 6 – Text Completion",
    PART_7: "Part 7 – Reading Comprehension",
  };
  return map[partName] ?? partName.replace("_", " ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OptionRowProps {
  label: string;
  content: string;
  isUserAnswer: boolean;
  isCorrect: boolean;
  userChose: boolean; // did the user pick this option?
}

function OptionRow({ label, content, isUserAnswer, isCorrect, userChose }: OptionRowProps) {
  const base =
    "flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-sm font-medium";

  let colorClass = "border-border bg-card text-foreground";
  if (isCorrect) colorClass = "border-emerald-400 bg-emerald-50 text-emerald-900";
  if (userChose && !isCorrect) colorClass = "border-red-400 bg-red-50 text-red-900";

  return (
    <div className={cn(base, colorClass)}>
      <span
        className={cn(
          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-black text-xs border-2",
          isCorrect
            ? "border-emerald-500 bg-emerald-500 text-white"
            : userChose
            ? "border-red-500 bg-red-500 text-white"
            : "border-muted-foreground/30 text-muted-foreground bg-muted/20"
        )}
      >
        {label}
      </span>
      <span className="flex-1 leading-relaxed pt-0.5">{content}</span>
      {isCorrect && (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      )}
      {userChose && !isCorrect && (
        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: ReviewQuestion;
  index: number; // 0-based within the list
}

function QuestionCard({ question }: QuestionCardProps) {
  const answered = question.userAnswer !== null;
  const isCorrect = question.correct;

  const statusBadge = !answered ? (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Minus className="w-3 h-3" /> Unanswered
    </Badge>
  ) : isCorrect ? (
    <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      <CheckCircle2 className="w-3 h-3" /> Correct
    </Badge>
  ) : (
    <Badge className="gap-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
      <XCircle className="w-3 h-3" /> Incorrect
    </Badge>
  );

  return (
    <div
      className={cn(
        "rounded-2xl border-2 overflow-hidden shadow-sm transition-all",
        !answered
          ? "border-border"
          : isCorrect
          ? "border-emerald-200"
          : "border-red-200"
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "px-5 py-3 flex items-center justify-between",
          !answered
            ? "bg-muted/30"
            : isCorrect
            ? "bg-emerald-50/70"
            : "bg-red-50/70"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Q{question.questionNumber}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {getPartLabel(question.partName)}
          </span>
          {question.isFlagged && (
            <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-600">
              <Flag className="w-3 h-3 fill-amber-600" /> Flagged
            </Badge>
          )}
        </div>
        {statusBadge}
      </div>

      <div className="p-5 space-y-4 bg-card">
        {/* Passage */}
        {question.passage && (
          <div className="bg-secondary/40 rounded-xl border border-border/60 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Reading Passage
            </p>
            <p className="text-sm text-foreground leading-relaxed italic whitespace-pre-line font-serif">
              {question.passage}
            </p>
          </div>
        )}

        {/* Image */}
        {question.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border bg-muted/10 flex justify-center p-2">
            <img
              src={getMediaUrl(question.imageUrl)}
              alt="Question graphic"
              className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* Audio */}
        {question.audioUrl && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-primary" />
            </div>
            <audio controls className="h-8 flex-1">
              <source src={getMediaUrl(question.audioUrl)} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Question text */}
        <p className="text-base font-semibold text-foreground leading-relaxed">
          {question.content || <span className="italic text-muted-foreground">(Audio / Image question)</span>}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((opt) => {
            const userChose = question.userAnswer === opt.label;
            const isOptCorrect = question.correctAnswer === opt.label;
            return (
              <OptionRow
                key={opt.label}
                label={opt.label}
                content={opt.content}
                isUserAnswer={userChose}
                isCorrect={isOptCorrect}
                userChose={userChose}
              />
            );
          })}
        </div>

        {/* Answer summary line */}
        <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            Your answer:&nbsp;
            <strong className={cn(answered ? (isCorrect ? "text-emerald-600" : "text-red-600") : "text-muted-foreground")}>
              {question.userAnswer ?? "—"}
            </strong>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            Correct answer:&nbsp;
            <strong className="text-emerald-600">{question.correctAnswer}</strong>
          </span>
        </div>

        {/* Transcript */}
        {question.transcript && (
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Transcript
            </p>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{question.transcript}</p>
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Explanation
            </p>
            <p className="text-sm text-blue-900 leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestReviewPage() {
  const { t } = useLanguage();
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<TestReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "all">("single");

  useEffect(() => {
    if (!submissionId) return;
    const load = async () => {
      try {
        const data = await attemptService.getReview(submissionId);
        setReview(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load review. Please try again.");
        navigate("/tests");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [submissionId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground animate-pulse">Loading review…</p>
      </div>
    );
  }

  if (!review) return null;

  const questions = review.questions;
  const accuracy = review.totalQuestions > 0
    ? Math.round((review.rawScore / review.totalQuestions) * 100)
    : 0;

  const currentQ = questions[currentIndex];

  const goTo = (idx: number) =>
    setCurrentIndex(Math.max(0, Math.min(idx, questions.length - 1)));

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tests")}
              className="gap-1.5 text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Tests
            </Button>
            <span className="hidden md:block text-sm font-semibold text-foreground truncate max-w-xs">
              {review.testTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "single" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("single")}
              className="gap-1.5 text-xs font-bold"
            >
              Single
            </Button>
            <Button
              variant={viewMode === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("all")}
              className="gap-1.5 text-xs font-bold"
            >
              <ListOrdered className="w-3.5 h-3.5" /> All
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* ── LEFT: Summary (Stick on left) ────────────────────────────────── */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 sticky top-20">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('yourResult')}
            </h2>

            <div className="text-center">
              <span className="text-4xl font-black text-primary">{review.toeicScore ?? "—"}</span>
              <span className="text-lg text-muted-foreground">/990</span>
            </div>

            <Progress value={accuracy} className="h-1.5" />

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-muted-foreground">{t('correct')}</span>
                <span className="font-bold text-emerald-600">{review.rawScore}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 border border-red-100">
                <span className="text-muted-foreground">{t('wrong')}</span>
                <span className="font-bold text-red-600">{review.wrongCount}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50 border border-border">
                <span className="text-muted-foreground">{t('skipped')}</span>
                <span className="font-bold text-muted-foreground">{review.unansweredCount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('completionTime')}</span>
                <span>{formatDuration(review.completionTimeSeconds)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                className="w-full gap-2 text-xs h-9"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                <Home className="w-3.5 h-3.5" /> Dashboard
              </Button>
              <Button
                className="w-full gap-2 text-xs h-9"
                variant="outline"
                onClick={() => navigate("/tests")}
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t('retakeTest')}
              </Button>
            </div>
          </div>
        </aside>

        {/* ── CENTER: Question content ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Progress bar (Single mode only) */}
          {viewMode === "single" && currentQ && (
            <div className="bg-card border border-border rounded-xl p-3 mb-2 flex items-center gap-4 shadow-sm">
               <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                  {currentIndex + 1} / {questions.length}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <Badge variant="secondary" className="font-black text-primary">{accuracy}%</Badge>
            </div>
          )}

          {/* ── ALL mode: list every question ── */}
          {viewMode === "all" && (
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <QuestionCard key={q.questionId} question={q} index={idx} />
              ))}
            </div>
          )}

          {/* ── SINGLE mode ── */}
          {viewMode === "single" && currentQ && (
            <>
              <QuestionCard question={currentQ} index={currentIndex} />

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="gap-2 px-6 h-11 font-bold rounded-xl border-2 group"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Previous
                </Button>

                <Button
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="gap-2 px-6 h-11 font-bold rounded-xl border-2 group"
                >
                  Next
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Question Navigator (Stick on right) ──────────────────── */}
        <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {viewMode === "single" && (
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5" /> Questions Navigator
                </p>
                
                <ScrollArea className="h-[calc(100vh-320px)] pr-4">
                  <div className="space-y-6 p-2 pb-12">
                    {Object.entries(
                      review.questions.reduce((acc, q) => {
                        if (!acc[q.partName]) acc[q.partName] = [];
                        acc[q.partName].push(q);
                        return acc;
                      }, {} as Record<string, typeof review.questions>)
                    ).map(([partName, partQuestions]) => {
                      const isReading = partName.match(/PART_[567]/);
                      return (
                        <div key={partName} className="space-y-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", isReading ? "bg-blue-500" : "bg-purple-500")} />
                            {getPartLabel(partName)}
                          </p>
                          <div className="grid grid-cols-6 gap-2">
                            {partQuestions.map((q) => {
                              const idx = review.questions.findIndex(rq => rq.questionId === q.questionId);
                              const answered = q.userAnswer !== null;
                              const isCurrent = idx === currentIndex;
                              
                              return (
                                <button
                                  key={q.questionId}
                                  onClick={() => goTo(idx)}
                                  className={cn(
                                    "aspect-square rounded-xl text-[11px] font-bold border-2 transition-all flex items-center justify-center relative",
                                    isCurrent
                                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10"
                                      : "border-transparent",
                                    !isCurrent && !answered
                                      ? "bg-muted/40 text-muted-foreground hover:bg-muted"
                                      : !isCurrent && q.correct
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : !isCurrent && !q.correct && answered
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "",
                                    q.isFlagged && !isCurrent ? "ring-2 ring-amber-400 ring-offset-1" : ""
                                  )}
                                >
                                  {q.questionNumber}
                                  {q.isFlagged && (
                                    <Flag className={cn(
                                      "absolute -top-1 -right-1 w-2.5 h-2.5",
                                      isCurrent ? "text-amber-300 fill-amber-300" : "text-amber-600 fill-amber-600"
                                    )} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200 inline-block" />
                      <span>{t('correct')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-red-100 border border-red-200 inline-block" />
                      <span>{t('wrong')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-muted border border-border inline-block" />
                      <span>{t('skipped')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="w-3 h-3 text-amber-600 fill-amber-600" />
                      <span>{t('flagged')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
