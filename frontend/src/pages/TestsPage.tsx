import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Clock, ArrowRight, Headphones, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import testService, { type ToeicTestResponse } from "@/services/testService";
import { toast } from "sonner";

export default function TestsPage() {
  const { t } = useLanguage();
  const [tests, setTests] = useState<ToeicTestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await testService.getTests(0, 20);
        // Only show active tests for public listing
        setTests(data.content.filter(test => test.active));
      } catch (error) {
        console.error("Failed to fetch tests:", error);
        toast.error("Failed to load tests");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">TOEIC Full Tests</h1>
          </div>
          <p className="text-muted-foreground">Luyện thi TOEIC đầy đủ 7 phần – Listening & Reading (200 câu, 120 phút)</p>
        </motion.div>

        {/* Stats */}
        {!isLoading && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{t('totalTests')}</p>
              <p className="font-display text-2xl font-bold text-foreground">{tests.length}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border opacity-50 cursor-not-allowed">
              <p className="text-sm text-muted-foreground mb-1">{t('completed')}</p>
              <p className="font-display text-2xl font-bold text-foreground">-</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border opacity-50 cursor-not-allowed">
              <p className="text-sm text-muted-foreground mb-1">{t('bestScore')}</p>
              <p className="font-display text-2xl font-bold text-success">-</p>
            </div>
          </motion.div>
        )}

        {/* Test List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>Loading available tests...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed rounded-2xl">
              No active tests available yet.
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
                  <Badge variant="outline" className="text-xs">Full Test</Badge>
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-3">{test.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-purple-500" />Part 1–4</div>
                  <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" />Part 5–7</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" />200 câu</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{test.durationMinutes} min</div>
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
