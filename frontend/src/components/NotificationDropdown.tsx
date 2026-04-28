import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Inbox,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationService, { NotificationResponse } from "@/services/notificationService";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN } from "date-fns/locale";
import { toast } from "sonner";

const localeMap = { vi, en: enUS, ja, ko, zh: zhCN };

const typeConfig: Record<string, { icon: React.ReactNode; dot: string }> = {
  SUCCESS: { icon: <CheckCircle2 className="w-4 h-4" />, dot: "bg-emerald-500" },
  WARNING: { icon: <AlertTriangle className="w-4 h-4" />, dot: "bg-amber-500" },
  ERROR:   { icon: <AlertCircle className="w-4 h-4" />, dot: "bg-rose-500" },
  SYSTEM:  { icon: <Inbox className="w-4 h-4" />, dot: "bg-purple-500" },
  INFO:    { icon: <Info className="w-4 h-4" />, dot: "bg-blue-500" },
};

const typeTextColor: Record<string, string> = {
  SUCCESS: "text-emerald-500",
  WARNING: "text-amber-500",
  ERROR:   "text-rose-500",
  SYSTEM:  "text-purple-500",
  INFO:    "text-blue-500",
};

export default function NotificationDropdown() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const currentLocale = localeMap[lang as keyof typeof localeMap] || enUS;

  // Unread count — polls every 30s and always active
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // Full list — only fetch when dropdown is open
  const { data: notifications = [], isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    enabled: open,
    staleTime: 0,
  });

  // Mark single as read — optimistic
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<NotificationResponse[]>(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: NotificationResponse[] = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // Decrement unread count immediately
      queryClient.setQueryData(["unread-count"], (old: number = 0) => Math.max(0, old - 1));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Mark all as read — optimistic
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<NotificationResponse[]>(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: NotificationResponse[] = []) =>
        old.map((n) => ({ ...n, isRead: true }))
      );
      queryClient.setQueryData(["unread-count"], 0);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
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

  const localUnread = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[340px] bg-card border border-border/60 p-0 shadow-2xl rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/20 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-none">{t("notifications")}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {localUnread > 0 ? `${localUnread} ${t("unreadNotifications")}` : t("allCaughtUp")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isFetching && (
              <RefreshCw className="w-3 h-3 text-muted-foreground/50 animate-spin" />
            )}
            {localUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 gap-1"
                onClick={(e) => { e.stopPropagation(); markAllAsReadMutation.mutate(); }}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="w-3 h-3" />
                {t("markAllRead")}
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-full bg-muted/50 border border-border/30 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground/70">{t("noNotifications")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("notificationsEmptyDesc")}</p>
            </div>
          ) : (
            notifications.map((notif, index) => {
              const cfg = typeConfig[notif.type] ?? typeConfig["INFO"];
              const colorClass = typeTextColor[notif.type] ?? typeTextColor["INFO"];
              return (
                <div key={notif.id}>
                  <div
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer relative",
                      !notif.isRead && "bg-primary/[0.04]"
                    )}
                    onClick={() => {
                      if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                    }}
                  >
                    {/* Unread stripe */}
                    {!notif.isRead && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", colorClass, "bg-current/10 border-current/20")}>
                      <span className={colorClass}>{cfg.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs text-foreground leading-snug", !notif.isRead ? "font-bold" : "font-medium text-foreground/80")}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.content}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <p className="text-[10px] text-muted-foreground/50 italic">
                          {getTimeAgo(notif.createdAt)}
                        </p>
                        {!notif.isRead ? (
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="opacity-30" />}
                </div>
              );
            })
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 p-2 bg-muted/10">
          <Button
            variant="ghost"
            className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/8 h-9 gap-2"
            onClick={() => { setOpen(false); navigate("/notifications"); }}
          >
            {t("viewAllNotifications")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
