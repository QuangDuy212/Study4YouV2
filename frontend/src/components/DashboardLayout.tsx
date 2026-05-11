import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  User,
  Bell,
  Menu,
  GraduationCap,
  PlayCircle,
  CreditCard,
  Search
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/courses?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { icon: BookOpen, label: t("toeicTests"), href: "/tests" },
    { icon: GraduationCap, label: t("courses"), href: "/courses" },
    { icon: PlayCircle, label: t("myCourses"), href: "/my-courses" },
    { icon: CreditCard, label: t("billingHistory"), href: "/transactions" },
    { icon: User, label: t("profile"), href: "/profile" },
    { icon: Bell, label: t("notifications"), href: "/notifications" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  const path = location.pathname;
  let pageTitle = t("dashboard");
  let pageDescription = t("dashboardDesc");

  if (path.startsWith("/tests")) {
    pageTitle = t("toeicTests");
    pageDescription = t("toeicTestsDesc");
  } else if (path.startsWith("/courses")) {
    pageTitle = t("exploreCourses");
    pageDescription = t("exploreCoursesDesc");
  } else if (path.startsWith("/my-courses") || path.startsWith("/learn")) {
    pageTitle = t("myCourses");
    pageDescription = t("myCoursesDesc");
  } else if (path.startsWith("/payment")) {
    pageTitle = t("paymentCheckout");
    pageDescription = t("paymentCheckoutDesc");
  } else if (path.startsWith("/profile")) {
    pageTitle = t("profile");
    pageDescription = t("profileDesc");
  } else if (path.startsWith("/settings")) {
    pageTitle = t("settings");
    pageDescription = t("settingsDesc");
  } else if (path.startsWith("/notifications")) {
    pageTitle = t("notifications");
    pageDescription = t("notificationsDesc") || "";
  }

  const sidebarNavContent = (
    <div className="flex flex-col h-full bg-card">
      <div className={cn(
        "h-16 flex items-center border-b border-border flex-shrink-0 px-4",
        (collapsed && !isMobile) ? "justify-center" : "justify-between"
      )}>
        {(collapsed && !isMobile) ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-xl hover:bg-muted/50 text-foreground transition-all duration-200"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground whitespace-nowrap">
                Study4You
              </span>
            </Link>
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                className="w-8 h-8 rounded-lg hover:bg-muted/50 text-foreground transition-all duration-200"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
            )}
          </>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
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
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", (collapsed && !isMobile) && "mx-auto")} />
                  <AnimatePresence>
                    {(!collapsed || isMobile) && (
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

      {isAdmin && (!collapsed || isMobile) && (
        <div className="px-3 mb-2 flex-shrink-0">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">{t("adminPanel")}</span>
          </Link>
        </div>
      )}

    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col"
        >
          {sidebarNavContent}
        </motion.aside>
      )}

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ paddingLeft: isMobile ? 0 : (collapsed ? 80 : 280) }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-h-screen min-w-0"
      >
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 flex-1">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 flex flex-col">
                  {sidebarNavContent}
                </SheetContent>
              </Sheet>
            )}
            <div className="hidden lg:block animate-in fade-in slide-in-from-left-4 duration-500">
              <p className="text-xs font-semibold text-primary tracking-wide mb-0.5">{getGreeting()} 👋</p>
              <h2 className="text-sm font-bold text-foreground">
                {profile?.fullName 
                  ? t("readyToLearn", { name: profile.fullName.split(' ')[0] }) 
                  : t("readyToLearnGeneric")}
              </h2>
            </div>

            <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto">
              <div className="relative w-full max-w-md group hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder={t("searchPlaceholder")} 
                  className="pl-9 bg-muted/40 border-transparent h-10 w-full rounded-2xl focus-visible:ring-primary/20 focus:bg-background focus:border-border transition-all shadow-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-bold text-muted-foreground shadow-sm">
                  <span className="text-[12px]">⌘</span>
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationDropdown />
            <ThemeSwitcher />
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-1 sm:px-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground">{profile?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{profile?.email || ""}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
                <DropdownMenuItem className="gap-2">
                  <User className="w-4 h-4" />
                  {t("profile")}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="w-4 h-4" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full pb-8">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
