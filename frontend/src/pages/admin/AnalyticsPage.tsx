import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp, Users, BookOpen, Headphones, CheckCircle, XCircle, Activity, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import activityService, { type AnalyticsResponse } from "@/services/activityService";

const lineChartConfig: ChartConfig = {
  active: { label: "Active Users", color: "hsl(var(--primary))" },
  completed: { label: "Completed Tests", color: "hsl(var(--chart-2))" },
};

const barChartConfig: ChartConfig = {
  avgScore: { label: "Average Score", color: "hsl(var(--primary))" },
  passRate: { label: "Pass Rate", color: "hsl(var(--chart-2))" },
  users: { label: "Users", color: "hsl(var(--primary))" },
};

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const stats = await activityService.getAnalyticsData();
        setData(stats);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('loadingAnalytics') || "Loading analytics data..."}</p>
        </div>
      </>
    );
  }

  const summaryStats = [
    { title: t('testCompletionRate') || "Test Completion Rate", value: data.summary.completionRate, change: data.summary.completionRateChange, trend: data.summary.completionRateChange.startsWith("+") ? "up" : "down", icon: CheckCircle },
    { title: t('avgSessionDuration') || "Avg. Session Duration", value: data.summary.avgSessionDuration, change: data.summary.sessionDurationChange, trend: data.summary.sessionDurationChange.startsWith("+") ? "up" : "down", icon: Activity },
    { title: t('dailyActiveUsers') || "Daily Active Users", value: data.summary.dailyActiveUsers, change: data.summary.dauChange, trend: data.summary.dauChange.startsWith("+") ? "up" : "down", icon: Users },
  ];

  const readingStat = data.skillPerformance.find(s => s.skill.toLowerCase() === "reading") || { avgScore: 0, passRate: 0 };
  const listeningStat = data.skillPerformance.find(s => s.skill.toLowerCase() === "listening") || { avgScore: 0, passRate: 0 };

  return (
    <>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryStats.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10"><stat.icon className="w-5 h-5 text-primary" /></div>
                    <Badge className={stat.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{stat.change}</Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skill Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />{t('skillPerformanceOverview') || "Skill Performance Overview"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800"><BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <h4 className="font-semibold text-foreground">{t('reading')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{readingStat.avgScore}%</p><p className="text-sm text-muted-foreground">{t('avgScore') || "Avg Score"}</p></div>
                    <div><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{readingStat.passRate}%</p><p className="text-sm text-muted-foreground">{t('passRate') || "Pass Rate"}</p></div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800"><Headphones className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                    <h4 className="font-semibold text-foreground">{t('listening')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-green-600 dark:text-green-400">{listeningStat.avgScore}%</p><p className="text-sm text-muted-foreground">{t('avgScore') || "Avg Score"}</p></div>
                    <div><p className="text-2xl font-bold text-green-600 dark:text-green-400">{listeningStat.passRate}%</p><p className="text-sm text-muted-foreground">{t('passRate') || "Pass Rate"}</p></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader><CardTitle>{t('userEngagementDaily') || "User Engagement (Daily)"}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.userEngagement}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="active" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} name={t('activeUsers') || "Active Users"} />
                      <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))" }} name={t('completedTests') || "Completed Tests"} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader><CardTitle>{t('weeklyActiveUsers') || "Weekly Active Users"}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('users') || "Users"} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pass/Fail Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader><CardTitle>{t('passFailRateBySkill') || "Pass/Fail Rate by Skill"}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.skillPerformance.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t(skill.skill.toLowerCase() as any) || skill.skill}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />{skill.passRate}% {t('pass') || "Pass"}</span>
                        <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" />{100 - skill.passRate}% {t('fail') || "Fail"}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${skill.passRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
