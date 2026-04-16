import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Inbox
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

const localeMap = {
  vi: vi,
  en: enUS,
  ja: ja,
  ko: ko,
  zh: zhCN,
};

export default function NotificationDropdown() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const currentLocale = localeMap[lang as keyof typeof localeMap] || enUS;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    enabled: open, // Only fetch when open
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
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
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "WARNING": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "ERROR": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "SYSTEM": return <Inbox className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border border-border p-0 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h4 className="font-bold text-sm text-foreground leading-none">{t("notifications")}</h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} ${t("unreadNotifications")}`
                : t("allCaughtUp")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] h-7 px-2 font-bold uppercase tracking-wider text-primary hover:text-primary/90 hover:bg-primary/10" 
              onClick={(e) => { e.stopPropagation(); markAllAsReadMutation.mutate(); }}
            >
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[350px]">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("noNotifications")}</p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div key={notif.id}>
                <div
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notif.isRead && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  }}
                >
                  <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs text-foreground", !notif.isRead ? "font-bold" : "font-medium")}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                      {getTimeAgo(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </div>
                {index < notifications.length - 1 && <Separator className="opacity-50" />}
              </div>
            ))
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 h-9"
            onClick={() => { setOpen(false); navigate("/notifications"); }}
          >
            {t("viewAllNotifications")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
