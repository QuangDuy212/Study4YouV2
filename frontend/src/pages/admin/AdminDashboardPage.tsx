import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, HelpCircle, TrendingUp, Clock, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import userService from "@/services/userService";
import testService from "@/services/testService";
import questionService from "@/services/questionService";
import activityService, { type UserActivityDTO } from "@/services/activityService";
import { formatDistanceToNow } from "date-fns";

const testsOverTimeData = [
  { month: "Jan", tests: 120 }, { month: "Feb", tests: 145 }, { month: "Mar", tests: 180 },
  { month: "Apr", tests: 210 }, { month: "May", tests: 195 }, { month: "Jun", tests: 250 }, { month: "Jul", tests: 280 },
];

const skillDistributionData = [
  { skill: "Reading", count: 450, fill: "hsl(var(--chart-1))" },
  { skill: "Listening", count: 380, fill: "hsl(var(--chart-2))" },
];

const lineChartConfig: ChartConfig = { tests: { label: "Tests Taken", color: "hsl(var(--primary))" } };
const barChartConfig: ChartConfig = {
  count: { label: "Count" },
  reading: { label: "Reading", color: "hsl(var(--chart-1))" },
  listening: { label: "Listening", color: "hsl(var(--chart-2))" },
};

const getActivityBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "test":
    case "toeic_test":
    case "toeic_attempt":
      return <Badge variant="secondary">Test</Badge>;
    case "create":
    case "update":
    case "auth":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">System</Badge>;
    default:
      return <Badge variant="outline">Activity</Badge>;
  }
};

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    users: "...",
    tests: "...",
    questions: "..."
  });
  const [activities, setActivities] = useState<UserActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersData, testsData, questionsData, recentActs] = await Promise.all([
          userService.getUsers(0, 1),
          testService.getTests(0, 1),
          questionService.getQuestions(0, 1),
          activityService.getRecentActivities()
        ]);

        setStats({
          users: usersData.totalElements.toLocaleString(),
          tests: testsData.totalElements.toLocaleString(),
          questions: questionsData.totalElements.toLocaleString()
        });
        setActivities(recentActs);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg font-semibold">{t('testsTakenOverTime')}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testsOverTimeData}>
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
                    <BarChart data={skillDistributionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis dataKey="skill" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
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
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>Loading activity logs...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">No recent activity.</div>
                ) : (
                  activities.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
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
                        {getActivityBadge(activity.targetType || activity.actionType)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[100px] justify-end">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
