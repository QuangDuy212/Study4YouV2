import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp, Users, BookOpen, Headphones, CheckCircle, XCircle, Activity,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const skillPerformanceData = [
  { skill: "Reading", avgScore: 76, passRate: 82 },
  { skill: "Listening", avgScore: 72, passRate: 78 },
];

const userEngagementData = [
  { day: "Mon", active: 245, completed: 180 },
  { day: "Tue", active: 312, completed: 220 },
  { day: "Wed", active: 289, completed: 195 },
  { day: "Thu", active: 356, completed: 265 },
  { day: "Fri", active: 298, completed: 210 },
  { day: "Sat", active: 178, completed: 120 },
  { day: "Sun", active: 156, completed: 95 },
];

const weeklyActiveUsers = [
  { week: "Week 1", users: 890 },
  { week: "Week 2", users: 1020 },
  { week: "Week 3", users: 945 },
  { week: "Week 4", users: 1150 },
];

const lineChartConfig: ChartConfig = {
  active: { label: "Active Users", color: "hsl(var(--primary))" },
  completed: { label: "Completed Tests", color: "hsl(var(--chart-2))" },
};

const barChartConfig: ChartConfig = {
  avgScore: { label: "Average Score", color: "hsl(var(--primary))" },
  passRate: { label: "Pass Rate", color: "hsl(var(--chart-2))" },
  users: { label: "Users", color: "hsl(var(--primary))" },
};

const summaryStats = [
  { title: "Test Completion Rate", value: "78%", change: "+5%", trend: "up", icon: CheckCircle },
  { title: "Avg. Session Duration", value: "24 min", change: "+3 min", trend: "up", icon: Activity },
  { title: "Daily Active Users", value: "342", change: "+12%", trend: "up", icon: Users },
];

export default function AnalyticsPage() {
  const { t } = useLanguage();

  return (
    <AdminLayout pageTitle={t('analyticsTitle')} pageDescription={t('analyticsDesc')}>
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
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Skill Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                    <h4 className="font-semibold text-foreground">Reading</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-blue-600">76%</p><p className="text-sm text-muted-foreground">Avg Score</p></div>
                    <div><p className="text-2xl font-bold text-blue-600">82%</p><p className="text-sm text-muted-foreground">Pass Rate</p></div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100"><Headphones className="w-5 h-5 text-green-600" /></div>
                    <h4 className="font-semibold text-foreground">Listening</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-green-600">72%</p><p className="text-sm text-muted-foreground">Avg Score</p></div>
                    <div><p className="text-2xl font-bold text-green-600">78%</p><p className="text-sm text-muted-foreground">Pass Rate</p></div>
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
              <CardHeader><CardTitle>User Engagement (Daily)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userEngagementData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="active" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} name="Active Users" />
                      <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))" }} name="Completed Tests" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader><CardTitle>Weekly Active Users</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Users" />
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
            <CardHeader><CardTitle>Pass/Fail Rate by Skill</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillPerformanceData.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{skill.skill}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />{skill.passRate}% Pass</span>
                        <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" />{100 - skill.passRate}% Fail</span>
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
    </AdminLayout>
  );
}
