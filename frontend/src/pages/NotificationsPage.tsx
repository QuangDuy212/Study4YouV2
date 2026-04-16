import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Inbox
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationService from "@/services/notificationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const localeMap = {
  vi: vi,
  en: enUS,
  ja: ja,
  ko: ko,
  zh: zhCN,
};

export default function NotificationsPage() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const currentLocale = localeMap[lang as keyof typeof localeMap] || enUS;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "ERROR": return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "SYSTEM": return <Inbox className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: currentLocale 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout 
      pageTitle={t("notifications")} 
      pageDescription={t("notificationsEmptyDesc")}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">{t("notifications")}</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 
                  ? `${unreadCount} ${t("unreadNotifications")}` 
                  : t("allCaughtUp")
                }
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto gap-2"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <Check className="w-4 h-4" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-xl" />
            ))
          ) : notifications.length === 0 ? (
            <Card className="border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold">{t("noNotifications")}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {t("notificationsEmptyDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-border/50 hover:border-primary/50 hover:shadow-md",
                    !notif.isRead && "bg-primary/5 border-primary/20"
                  )}
                  onClick={() => {
                    if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-background border border-border shadow-sm">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={cn(
                            "text-sm sm:text-base text-foreground",
                            !notif.isRead ? "font-bold" : "font-semibold"
                          )}>
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notif.content}
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                            {notif.type}
                          </Badge>
                          {!notif.isRead && (
                            <Badge className="text-[10px] uppercase tracking-wider font-bold">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
