import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Clock, ArrowRight, Headphones, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import testService, { type ToeicTestResponse } from "@/services/testService";
import attemptService from "@/services/attemptService";
import { toast } from "sonner";

export default function TestsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tests, setTests] = useState<ToeicTestResponse[]>([]);
  const [stats, setStats] = useState({ completed: 0, bestScore: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsData, attemptsData] = await Promise.all([
          testService.getTests(0, 20),
          user ? attemptService.getAttempts(user.id, 0, 1, "toeicScore", "DESC") : Promise.resolve(null)
        ]);
        
        // Only show active tests for public listing
        setTests(testsData.content.filter(test => test.active));
        
        if (attemptsData) {
          setStats({
            completed: attemptsData.totalElements,
            bestScore: attemptsData.content[0]?.toeicScore ?? 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error(t('failedToLoadTests'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t, user]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('toeicFullTests')}</h1>
          </div>
          <p className="text-muted-foreground">{t('toeicFullTestsDesc')}</p>
        </motion.div>


        {/* Stats */}
        {!isLoading && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{t('totalTests')}</p>
              <p className="font-display text-2xl font-bold text-foreground">{tests.length}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{t('completed')}</p>
              <p className="font-display text-2xl font-bold text-foreground">{stats.completed}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{t('bestScore')}</p>
              <p className="font-display text-2xl font-bold text-success">{stats.bestScore}</p>
            </div>
          </motion.div>
        )}

        {/* Test List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>{t('loadingTests')}</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed rounded-2xl">
              {t('noActiveTests')}
            </div>
          ) : (

            tests.map((test, index) => (
              <motion.div
                key={test.id}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">{t('test')}</Badge>
                </div>

                <h3 className="font-display font-semibold text-lg text-foreground mb-3">{test.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-purple-500" />{t('listeningPart14')}</div>
                  <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" />{t('readingPart57')}</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" />200 {t('questions').toLowerCase()}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{test.durationMinutes} {t('minutes')}</div>
                </div>


                <Link to={`/tests/${test.id}/attempt`}>
                  <Button className="w-full gap-2">
                    {t('startTest')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
