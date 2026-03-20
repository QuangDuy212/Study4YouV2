import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, FileText, Sparkles, UserPlus, RefreshCw, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import notificationService, { NotificationResponse } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN } from "date-fns/locale";

const locales: Record<string, any> = { vi, en: enUS, ja, ko, zh: zhCN };

export default function NotificationDropdown() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "WARNING": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "ERROR": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const relativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: locales[lang] || enUS 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border border-border p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground">{t("notifications")}</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} ${t("unreadNotifications")}`
                : t("allCaughtUp")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}>
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[350px]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div key={notif.id}>
                <div
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notif.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                >
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted",
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm text-foreground", !notif.isRead ? "font-semibold" : "font-medium")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 lowercase italic">
                      {relativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-sm text-primary hover:text-primary"
            onClick={() => { setOpen(false); navigate("/admin/notifications"); }}
          >
            {t("viewAllNotifications")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
