import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, HelpCircle, TrendingUp, Clock, Loader2, Sparkles, ArrowRight, ChevronLeft, ChevronRight, BookOpen, GraduationCap, CreditCard, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
  const { t, lang } = useLanguage();
  const { user } = useAuth();
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
    testsOverTime: Array<{ date: string; tests: number }>;
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
            date: item.date,
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
    <>
      <div className="space-y-3 sm:space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          {/* Full-Width Dynamic Theme Adaptive Welcome Banner - Moved to TOP */}
          <Card className="relative overflow-hidden bg-card border border-border shadow-sm min-h-[260px] flex flex-col justify-center group">
            {/* Themed dynamic adaptive decorative backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-70 pointer-events-none" />
            <div className="absolute top-[-20%] right-[-5%] w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />
            <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Dynamic theme grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <CardContent className="relative z-10 p-8 md:p-10 h-full flex flex-col md:flex-row items-center justify-between gap-10">
              
              {/* Left Side: Thematic Typography */}
              <div className="flex-1 space-y-5 w-full">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border shadow-none">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                    {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                    {t('welcomeBack')}, <br />
                    <span className="text-primary drop-shadow-sm">
                      {user?.fullName || (lang === 'vi' ? "Quản trị viên" : "Administrator")}
                    </span>! 👋
                  </h2>
                  <p className="text-muted-foreground text-base md:text-lg font-medium max-w-md leading-relaxed">
                    {t('adminWelcomeSubtitle')}
                  </p>
                </div>
              </div>

              {/* Right Side: Modular dynamic theme shortcuts */}
              <div className="w-full md:w-[440px] shrink-0 grid grid-cols-2 gap-4 relative">
                <div className="absolute inset-[-20px] bg-secondary/50 rounded-3xl blur-xl -z-10" />
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/courses")}
                  className="h-auto bg-card hover:bg-card border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 text-foreground flex flex-col items-start justify-between p-5 rounded-2xl transition-all hover:-translate-y-1 group/btn overflow-hidden relative shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-all duration-300 mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="block font-bold text-sm text-foreground">{t('courses')}</span>
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider group-hover/btn:text-primary transition-colors">{t('shortcutManageCourses')}</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/tests")}
                  className="h-auto bg-card hover:bg-card border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 text-foreground flex flex-col items-start justify-between p-5 rounded-2xl transition-all hover:-translate-y-1 group/btn overflow-hidden relative shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-all duration-300 mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="block font-bold text-sm text-foreground">{t('tests')}</span>
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider group-hover/btn:text-primary transition-colors">{t('shortcutToeicBank')}</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/payments")}
                  className="h-auto bg-card hover:bg-card border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 text-foreground flex flex-col items-start justify-between p-5 rounded-2xl transition-all hover:-translate-y-1 group/btn overflow-hidden relative shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-all duration-300 mb-4">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="block font-bold text-sm text-foreground">{t('payments')}</span>
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider group-hover/btn:text-primary transition-colors">{t('shortcutTransactionHistory')}</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/users")}
                  className="h-auto bg-card hover:bg-card border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 text-foreground flex flex-col items-start justify-between p-5 rounded-2xl transition-all hover:-translate-y-1 group/btn overflow-hidden relative shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-all duration-300 mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="block font-bold text-sm text-foreground">{t('users')}</span>
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider group-hover/btn:text-primary transition-colors">{t('shortcutSystemAccounts')}</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats - Moved Below Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (index * 0.1) }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ Thống kê */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-semibold tracking-tight text-foreground">{t('testsTakenOverTime')}</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardStats.testsOverTime}>
                      <defs>
                        <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" className="stroke-muted/30" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={10} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="tests" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }} activeDot={{ r: 6, strokeWidth: 0 }} fillOpacity={1} fill="url(#colorTests)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Biểu đồ Phân bổ Kỹ năng quay trở lại */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-border shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">{t('skillDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardStats.skillDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                      <YAxis dataKey="skill" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} width={80} />
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
    </>
  );
}
