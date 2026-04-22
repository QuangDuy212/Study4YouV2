import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Database,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  User,
  Sparkles,
  Menu,
  GraduationCap,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationDropdown from "@/components/admin/NotificationDropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, signOut, hasPermission } = useAuth();
  
  // Custom hook for admin breakpoint (1024px is safer for admin)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const navigationItems = [
    { icon: LayoutDashboard, label: t("dashboard"), href: "/admin", permission: "VIEW_ADMIN_DASHBOARD" },
    { icon: FileText, label: t("manageTests"), href: "/admin/tests", permission: "MANAGE_TESTS" },
    { icon: Database, label: t("questionBank"), href: "/admin/questions", permission: "MANAGE_QUESTIONS" },
    { icon: GraduationCap, label: t("manageCourses"), href: "/admin/courses" },
    { icon: CreditCard, label: t("managePayments"), href: "/admin/payments" },
    { icon: Users, label: t("users"), href: "/admin/users", permission: "MANAGE_USERS" },
    { icon: Shield, label: t("roles"), href: "/admin/roles", permission: "MANAGE_USERS" },
    { icon: Sparkles, label: t("aiQuestions"), href: "/admin/questions/ai-generate", permission: "MANAGE_QUESTIONS" },
    { icon: Sparkles, label: t("aiUsers"), href: "/admin/users/ai-generate", permission: "MANAGE_USERS" },
    { icon: Bell, label: t("notifications"), href: "/admin/notifications", permission: "MANAGE_USERS" },
    { icon: BarChart3, label: t("analytics"), href: "/admin/analytics", permission: "VIEW_ANALYTICS" },
  ];

  const path = location.pathname;
  let pageTitle = t("adminDashboard");
  let pageDescription = t("adminDashboardDesc");

  if (path.startsWith("/admin/tests")) {
    pageTitle = t("manageTests");
  } else if (path.startsWith("/admin/questions")) {
    pageTitle = t("questionBank");
  } else if (path.startsWith("/admin/courses")) {
    pageTitle = t("manageCourses");
  } else if (path.startsWith("/admin/payments")) {
    pageTitle = t("paymentManagement");
  } else if (path.startsWith("/admin/users")) {
    pageTitle = t("users");
  } else if (path.startsWith("/admin/roles")) {
    pageTitle = t("roles");
  } else if (path.startsWith("/admin/notifications")) {
    pageTitle = t("notifications");
  } else if (path.startsWith("/admin/analytics")) {
    pageTitle = t("analytics");
  } else if (path.startsWith("/admin/settings")) {
    pageTitle = t("settings");
  } else if (path.startsWith("/admin/profile")) {
    pageTitle = t("profile");
  }

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-card">
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <AnimatePresence>
            {(!collapsed || !isDesktop) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="font-display font-bold text-lg text-foreground whitespace-nowrap">
                  Study4You
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", (collapsed && isDesktop) && "mx-auto")} />
                  <AnimatePresence>
                    {(!collapsed || !isDesktop) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap overflow-hidden text-sm"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 mb-2 flex-shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground bg-secondary/50 hover:bg-secondary transition-all duration-200"
        >
          {(collapsed && isDesktop) ? (
            <LayoutDashboard className="w-5 h-5 mx-auto" />
          ) : (
            <>
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium text-sm">{t("home")}</span>
            </>
          )}
        </Link>
      </div>

      {isDesktop && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span>{t("collapse")}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar - only show on desktop */}
      <div className="hidden lg:block">
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col"
        >
          {sidebarNavContent}
        </motion.aside>
      </div>

      <motion.div
        initial={false}
        animate={{ paddingLeft: !isDesktop ? 0 : (collapsed ? 80 : 280) }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-h-screen min-w-0 flex flex-col"
      >
        <header className="h-14 sm:h-16 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-2 sm:px-6 w-full">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
             <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 flex flex-col h-full border-none">
                  {sidebarNavContent}
                </SheetContent>
              </Sheet>
            </div>
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 truncate">
              <h1 className="font-display text-base sm:text-xl font-bold text-foreground truncate">
                {pageTitle}
              </h1>
              {pageDescription && (
                <p className="text-[10px] text-muted-foreground hidden sm:block truncate">{pageDescription}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-1 sm:px-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                      {profile?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground leading-none mb-1">{profile?.fullName || "Admin"}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">{profile?.email || ""}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/admin/profile")}>
                  <User className="w-4 h-4" />
                  {t("profile")}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/admin/settings")}>
                  <Settings className="w-4 h-4" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={async () => { await signOut(); navigate("/login"); }}
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-2 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
