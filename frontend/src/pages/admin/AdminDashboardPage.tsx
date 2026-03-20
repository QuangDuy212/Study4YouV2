import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, HelpCircle, TrendingUp, Clock, Loader2, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import userService from "@/services/userService";
import testService from "@/services/testService";
import questionService from "@/services/questionService";
import activityService, { type UserActivityDTO } from "@/services/activityService";
import { formatDistanceToNow } from "date-fns";

// Remove static testsOverTimeData



const getActivityBadge = (type: string, t: any) => {
  switch (type.toLowerCase()) {
    case "test":
    case "toeic_test":
    case "toeic_attempt":
      return <Badge variant="secondary">{t('test')}</Badge>;
    case "create":
    case "update":
    case "auth":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t('system')}</Badge>;
    default:
      return <Badge variant="outline">{t('activity')}</Badge>;
  }
};


export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: "...",
    tests: "...",
    questions: "..."
  });
  const [activities, setActivities] = useState<UserActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const lineChartConfig: ChartConfig = { tests: { label: t('testsTaken'), color: "hsl(var(--primary))" } };
  const barChartConfig: ChartConfig = {
    count: { label: t('count') },
    reading: { label: t('reading'), color: "hsl(var(--chart-1))" },
    listening: { label: t('listening'), color: "hsl(var(--chart-2))" },
  };

  const [dashboardStats, setDashboardStats] = useState<{
    testsOverTime: Array<{ month: string; tests: number }>;
    skillDistribution: Array<{ skill: string; count: number; fill: string }>;
  }>({
    testsOverTime: [],
    skillDistribution: [],
  });


  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const statsData = await activityService.getDashboardStats();

        setStats({
          users: statsData.totalUsers.toLocaleString(),
          tests: statsData.totalTests.toLocaleString(),
          questions: statsData.totalQuestions.toLocaleString()
        });
        
        // Map skill keys to translated labels
        const mappedSkillDist = statsData.skillDistribution.map((item) => {
          const isReading = item.skill === "READING";
          return {
            skill: t(item.skill.toLowerCase() as any),
            count: item.count,
            fill: isReading ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"
          };
        });

        setDashboardStats({
          testsOverTime: statsData.testsOverTime.map(item => ({
            month: item.month,
            tests: item.count
          })),
          skillDistribution: mappedSkillDist
        });
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [t]);

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        const pageData = await activityService.getRecentActivities(activityPage, 10);
        setActivities(pageData.content);
        setTotalActivities(pageData.totalElements);
      } catch (err) {
        console.error("Failed to load activity logs:", err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [activityPage]);

  const summaryCards = [
    { title: t('totalUsers'), value: stats.users, description: t('fromLastMonth'), icon: Users, trend: "up" },
    { title: t('totalTestsAdmin'), value: stats.tests, description: t('acrossAllSkills'), icon: FileText, trend: "neutral" },
    { title: t('totalQuestions'), value: stats.questions, description: t('inQuestionBank'), icon: HelpCircle, trend: "neutral" },
  ];

  return (
    <AdminLayout pageTitle={t('adminDashboard')} pageDescription={t('adminDashboardDesc')}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <card.icon className="w-4 h-4 text-primary" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {card.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
 
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
           <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20">
             <CardHeader className="flex flex-row items-center gap-4 py-4">
               <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-primary animate-pulse" />
               </div>
                <div>
                  <CardTitle className="text-lg">{t('aiMagic')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('aiMagicDesc')}</p>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 px-6 justify-between hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                  onClick={() => navigate("/admin/questions/ai-generate")}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">{t('generateReadingQuestionsShort')}</span>
                    <span className="text-xs text-muted-foreground">{t('generateReadingQuestionsShortDesc')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 px-6 justify-between hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                  onClick={() => navigate("/admin/users/ai-generate")}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">{t('bulkGenerateUsersShort')}</span>
                    <span className="text-xs text-muted-foreground">{t('bulkGenerateUsersShortDesc')}</span>
                  </div>
                 <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
               </Button>
             </CardContent>
           </Card>
         </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg font-semibold">{t('testsTakenOverTime')}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardStats.testsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="tests" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg font-semibold">{t('skillDistribution')}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardStats.skillDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis dataKey="skill" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {dashboardStats.skillDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader><CardTitle className="text-lg font-semibold">{t('recentActivity')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>{t('loadingActivityLogs')}</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">{t('noRecentActivity')}</div>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      {activities.map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {activity.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{activity.userName}</p>
                              <p className="text-sm text-muted-foreground">{activity.description || activity.actionType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getActivityBadge(activity.targetType || activity.actionType, t)}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[120px] justify-end">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        {t('showing')} <span className="font-medium text-foreground">{activityPage * 10 + 1}</span> - <span className="font-medium text-foreground">{Math.min((activityPage + 1) * 10, totalActivities)}</span> {t('of')} <span className="font-medium text-foreground">{totalActivities}</span> {t('activities')}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPage(prev => Math.max(0, prev - 1))}
                          disabled={activityPage === 0 || activitiesLoading}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.ceil(totalActivities / 10)) }, (_, i) => {
                            const pageNum = i;
                            return (
                              <Button
                                key={pageNum}
                                variant={activityPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActivityPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                                disabled={activitiesLoading}
                              >
                                {pageNum + 1}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPage(prev => prev + 1)}
                          disabled={(activityPage + 1) * 10 >= totalActivities || activitiesLoading}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
