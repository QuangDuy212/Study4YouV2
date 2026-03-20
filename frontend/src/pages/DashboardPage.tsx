import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Target, Trophy, ArrowRight, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import attemptService, { type ToeicAttemptResponse } from "@/services/attemptService";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<ToeicAttemptResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const data = await attemptService.getAttempts(profile.id, 0, 5, "createdAt", "DESC");
        setAttempts(data.content);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [profile?.id]);

  const submittedAttempts = attempts.filter(a => a.submittedAt);
  const totalTests = submittedAttempts.length;
  const avgScore = totalTests > 0 
    ? Math.round(submittedAttempts.reduce((acc, curr) => acc + (curr.toeicScore || 0), 0) / totalTests)
    : 0;
  const bestAttempt = submittedAttempts.length > 0
    ? [...submittedAttempts].sort((a, b) => (b.toeicScore || 0) - (a.toeicScore || 0))[0]
    : null;

  const stats = [
    { 
      icon: Target, 
      label: t('testsCompleted'), 
      value: totalTests.toString(), 
      trend: `${submittedAttempts.length > 0 ? "+" + submittedAttempts.length : "0"} ${t('total')}` 
    },
    { 
      icon: TrendingUp, 
      label: t('averageScore'), 
      value: avgScore.toString(), 
      trend: t('overallAverageLabel')
    },
    { 
      icon: Trophy, 
      label: t('bestScore'), 
      value: bestAttempt ? `${bestAttempt.toeicScore}/990` : "0/990", 
      trend: bestAttempt?.testTitle || t('noTestsYet')
    },
  ];

  const dateLocale = lang === 'vi' ? vi : enUS;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {t('welcomeBackStudent')} {profile?.fullName || ''}
          </h1>
          <p className="text-muted-foreground">
            {t('continueYourJourney')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="font-display text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.trend}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Start */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            {t('practiceToeic')}
          </h2>
          <Link to="/tests">
            <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                    {t('toeicFullTestPart17')}
                  </h3>
                  <p className="text-muted-foreground text-sm">{t('toeicFullTestDetail')}</p>
                </div>
                <Button className="gap-2">
                  {t('start')} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            {t('recentActivity')}
          </h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('noRecentActivityHistory')}
              </div>
            ) : (
              attempts.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.testTitle || t('untitledTest')}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-semibold text-lg ${
                      (activity.toeicScore || 0) >= 800 ? "text-success" : 
                      (activity.toeicScore || 0) >= 600 ? "text-warning" : "text-destructive"
                    }`}>
                      {activity.toeicScore || 0}/990
                    </p>
                    <p className="text-xs text-muted-foreground">{t('score')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
