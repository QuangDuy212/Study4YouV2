import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Inbox,
  Info,
  PartyPopper,
  BellOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationService from "@/services/notificationService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const localeMap = { vi, en: enUS, ja, ko, zh: zhCN };

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  SUCCESS: {
    icon: <CheckCircle2 className="w-[18px] h-[18px]" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  WARNING: {
    icon: <AlertTriangle className="w-[18px] h-[18px]" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  ERROR: {
    icon: <AlertCircle className="w-[18px] h-[18px]" />,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  SYSTEM: {
    icon: <Inbox className="w-[18px] h-[18px]" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  INFO: {
    icon: <Info className="w-[18px] h-[18px]" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
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
    onMutate: async (id) => {
      // Optimistic update: immediately mark as read in cache
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<typeof notifications>(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: typeof notifications = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      // Optimistic update: immediately mark all as read in cache
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<typeof notifications>(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: typeof notifications = []) =>
        old.map((n) => ({ ...n, isRead: true }))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
    },
    onSuccess: () => {
      toast.success(t("markAllRead"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: currentLocale });
    } catch {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 shadow-sm"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <Bell className="w-7 h-7" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t("notifications")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} ${t("unreadNotifications")} · ${notifications.length} ${t("total") || "total"}`
                    : t("allCaughtUp")}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary transition-all"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="w-3.5 h-3.5" />
                {t("markAllRead")}
              </Button>
            )}
          </div>

          {/* Stats row */}
          {notifications.length > 0 && (
            <div className="relative mt-5 pt-4 border-t border-border/30 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{unreadCount}</span> {t("unreadNotifications")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{readCount}</span> {t("read") || "read"}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Notification List */}
        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-full rounded-xl bg-muted/30 animate-pulse border border-border/20"
              />
            ))
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-muted/50 border border-border/30 flex items-center justify-center mx-auto">
                  <BellOff className="w-9 h-9 text-muted-foreground/40" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t("noNotifications")}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{t("notificationsEmptyDesc")}</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const cfg = typeConfig[notif.type] ?? typeConfig["INFO"];
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    onClick={() => {
                      if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                    }}
                    className={cn(
                      "group relative flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer",
                      "hover:shadow-md hover:shadow-black/10",
                      notif.isRead
                        ? "bg-card/40 border-border/30 hover:border-border/60 hover:bg-card/60"
                        : "bg-card/70 border-primary/25 hover:border-primary/50 hover:bg-card/90 shadow-sm"
                    )}
                  >
                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-primary rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105",
                        cfg.color,
                        cfg.bg
                      )}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h4
                          className={cn(
                            "text-sm leading-snug",
                            notif.isRead
                              ? "font-medium text-foreground/80"
                              : "font-bold text-foreground"
                          )}
                        >
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                        {notif.content}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md border", cfg.color, cfg.bg)}
                        >
                          {notif.type}
                        </Badge>
                        {!notif.isRead && (
                          <Badge className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                            NEW
                          </Badge>
                        )}
                        {notif.isRead && (
                          <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t("read") || "Read"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* All caught up */}
        {!isLoading && notifications.length > 0 && unreadCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
          >
            <PartyPopper className="w-4 h-4 text-primary" />
            <span>{t("allCaughtUp")}</span>
          </motion.div>
        )}
      </div>
    </>
  );
}
