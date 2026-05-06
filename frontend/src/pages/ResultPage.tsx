import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trophy, CheckCircle, XCircle, Home, RotateCcw, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import attemptService, { type ToeicAttemptResponse } from "@/services/attemptService";

export default function ResultPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // This might be testId or attemptId depending on routing
  
  // Try to get data from state first (passed from TestTakingPage)
  const stateData = location.state as { 
    score?: number; 
    total?: number; 
    correct?: number; 
    maxScore?: number;
    attemptId?: string;
  } | null;

  const [attempt, setAttempt] = useState<ToeicAttemptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!stateData);

  useEffect(() => {
    const loadAttempt = async () => {
      // If we have an attemptId in state, or if we need to fetch by URL param
      const attemptId = stateData?.attemptId || id;
      if (!stateData && attemptId) {
        try {
          const data = await attemptService.getAttemptById(attemptId);
          setAttempt(data);
        } catch (err) {
          console.error("Failed to load result", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadAttempt();
  }, [id, stateData]);

  const score = stateData?.score ?? attempt?.toeicScore ?? 0;
  const maxScore = stateData?.maxScore ?? 990;
  const correct = stateData?.correct ?? attempt?.rawScore ?? 0; // Assuming rawScore is correct count for now
  const total = stateData?.total ?? 200; // Standard TOEIC
  const percentage = Math.round((score / maxScore) * 100);

  const getScoreColor = () => {
    if (score >= 800) return "text-success";
    if (score >= 600) return "text-warning";
    return "text-destructive";
  };

  const getScoreMessage = () => {
    if (score >= 800) return t('excellentWork');
    if (score >= 600) return t('goodEffort');
    return t('keepPracticing');
  };

  const getScoreBg = () => {
    if (score >= 800) return "from-success/20 to-success/5";
    if (score >= 600) return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div className="w-full max-w-lg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="bg-card rounded-3xl p-8 border border-border shadow-lg text-center">
          <motion.div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreBg()} flex items-center justify-center mx-auto mb-6`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
            <Trophy className={`w-12 h-12 ${getScoreColor()}`} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">{t('testComplete')}</h1>
            <p className={`text-lg font-medium ${getScoreColor()} mb-6`}>{getScoreMessage()}</p>

            <div className="mb-8">
              <span className={`font-display text-6xl font-bold ${getScoreColor()}`}>{score}</span>
              <span className="text-2xl text-muted-foreground font-medium">/{maxScore}</span>
              <p className="text-muted-foreground mt-2">{t('toeicScore')}</p>
            </div>


            <div className="mb-8">
              <Progress value={percentage} className="h-3 mb-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-foreground font-medium">{correct} {t('correct')}</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span className="text-foreground font-medium">{Math.max(0, total - correct)} {t('incorrect')}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 mb-8">
              <h3 className="font-semibold text-foreground mb-3">{t('performanceSummary')}</h3>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('questionsAnswered')}</span>
                  <span className="text-foreground font-medium">{total}/{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('listeningPart14')}</span>
                  <span className="text-foreground font-medium">~{Math.round(score * 0.5)}/495</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('readingPart57')}</span>
                  <span className="text-foreground font-medium">~{Math.max(0, score - Math.round(score * 0.5))}/495</span>
                </div>
              </div>
            </div>


            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/dashboard")} className="w-full gap-2"><Home className="w-4 h-4" />{t('backToDashboard')}</Button>
              {stateData?.attemptId && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/tests/${stateData.attemptId}/review`)}
                  className="w-full gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Review Answers
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(`/tests`)} className="w-full gap-2"><RotateCcw className="w-4 h-4" />{t('takeAnotherTest')}</Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
