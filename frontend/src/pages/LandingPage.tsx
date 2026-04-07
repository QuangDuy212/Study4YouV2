import { BookOpen, Headphones, ArrowRight, CheckCircle, Sparkles, Menu, X, LogOut, LayoutDashboard, Shield, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const { t } = useLanguage();
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dashboardUrl = isAdmin ? "/admin" : "/dashboard";

  const features = [
    {
      icon: BookOpen,
      title: t("readingPractice"),
      description: t("readingPracticeDesc"),
    },
    {
      icon: Headphones,
      title: t("listeningPractice"),
      description: t("listeningPracticeDesc"),
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("chooseYourSkill"),
      description: t("chooseYourSkillDesc"),
    },
    {
      number: "02",
      title: t("practiceAndLearn"),
      description: t("practiceAndLearnDesc"),
    },
    {
      number: "03",
      title: t("getAiFeedback"),
      description: t("getAiFeedbackDesc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">Study4You</span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              {profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 h-auto py-1 px-2 rounded-full hover:bg-muted transition-colors">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={profile.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-semibold text-foreground leading-tight">{profile.fullName}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{isAdmin ? "Administrator" : "Student"}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 p-2">
                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => window.location.href = "/dashboard"}>
                      <LayoutDashboard className="w-4 h-4" />
                      {t("dashboard")}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => window.location.href = "/admin"}>
                        <Shield className="w-4 h-4" />
                        {t("adminPanel")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 rounded-lg text-destructive focus:text-destructive cursor-pointer" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">{t("login")}</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="default">{t("getStartedFree")}</Button>
                  </Link>
                </>
              )}
            </div>
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>
                {profile ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-xl">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={profile.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{profile.fullName}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{isAdmin ? "Administrator" : "Student"}</p>
                      </div>
                    </div>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <LayoutDashboard className="w-4 h-4" />
                        {t("dashboard")}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Shield className="w-4 h-4" />
                          {t("adminPanel")}
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="w-4 h-4" />
                      {t("logout")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">{t("login")}</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full">{t("getStartedFree")}</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t("platformSubtitle")}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              {t("heroTitle")}{" "}
              <span className="gradient-text">{t("heroTitleHighlight")}</span>
              <br />
              {t("heroTitleSuffix")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t("heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {profile ? (
                <Link to={dashboardUrl}>
                  <Button variant="hero" size="xl">
                    {t("dashboard")}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="hero" size="xl">
                      {t("getStartedFree")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="heroOutline" size="xl">
                      {t("loginToDashboard")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl opacity-50" />
            <div className="relative glass-card rounded-2xl p-8 border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[t("reading"), t("listening")].map((skill, index) => (
                  <div
                    key={skill}
                    className="bg-background rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      {index === 0 && <BookOpen className="w-6 h-6 text-primary" />}
                      {index === 1 && <Headphones className="w-6 h-6 text-primary" />}
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">{skill} {t("practice")}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      12 {t("exercisesAvailable")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("everythingYouNeed")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("everythingYouNeedDesc")}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="glass-card glass-card-hover rounded-2xl p-6"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t("howItWorks")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorksDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
                    <span className="font-display text-3xl font-bold text-primary">{step.number}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/register">
              <Button variant="hero" size="lg">
                {t("startLearningNow")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              {t("readyToTransform")}
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {t("readyToTransformDesc")}
            </p>
            <Link to={profile ? dashboardUrl : "/register"}>
              <Button 
                variant="secondary" 
                size="xl"
                className="bg-background text-foreground hover:bg-background/90"
              >
                {profile ? t("dashboard") : t("getStartedFree")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">Study4You</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t("academicProject")}
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Study4You. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
