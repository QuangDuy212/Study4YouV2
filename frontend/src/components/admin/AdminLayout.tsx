import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageDescription?: string;
}

export default function AdminLayout({ children, pageTitle, pageDescription }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, signOut, hasPermission } = useAuth();
  const { isAdmin } = useAuth();

  const navigationItems = [
    { icon: LayoutDashboard, label: t("dashboard"), href: "/admin", permission: "VIEW_ADMIN_DASHBOARD" },
    { icon: FileText, label: t("manageTests"), href: "/admin/tests", permission: "MANAGE_TESTS" },
    { icon: Database, label: t("questionBank"), href: "/admin/questions", permission: "MANAGE_QUESTIONS" },
    { icon: Users, label: t("users"), href: "/admin/users", permission: "MANAGE_USERS" },
    { icon: Shield, label: t("roles"), href: "/admin/roles", permission: "MANAGE_USERS" },
    { icon: Sparkles, label: t("aiQuestions"), href: "/admin/questions/ai-generate", permission: "MANAGE_QUESTIONS" },
    { icon: Sparkles, label: t("aiUsers"), href: "/admin/users/ai-generate", permission: "MANAGE_USERS" },
    { icon: BarChart3, label: t("analytics"), href: "/admin/analytics", permission: "VIEW_ANALYTICS" },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
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
                  <span className="text-xs text-muted-foreground block whitespace-nowrap">
                    {t("adminPortal")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
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
                    <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
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

        {/* Student View Link */}
        <div className="px-3 mb-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground bg-secondary/50 hover:bg-secondary transition-all duration-200"
          >
            {collapsed ? (
              <LayoutDashboard className="w-5 h-5 mx-auto" />
            ) : (
              <>
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium text-sm">{t("home")}</span>
              </>
            )}
          </Link>
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
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
      </motion.aside>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ paddingLeft: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-h-screen min-w-0"
      >
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground">{profile?.fullName || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
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

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </motion.div>
    </div>
  );
}
