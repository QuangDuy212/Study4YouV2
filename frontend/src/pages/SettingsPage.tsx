import { useTheme, Theme } from "@/contexts/ThemeContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, Sun, Moon, Palette } from "lucide-react";
import { useState, useEffect } from "react";

const themes: { value: Theme; labelKey: string; preview: string; icon: React.ReactNode }[] = [
  { value: "light", labelKey: "light", preview: "bg-white border-2 border-border", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", labelKey: "dark", preview: "bg-zinc-900 border-2 border-zinc-700", icon: <Moon className="w-4 h-4" /> },
  { value: "blue", labelKey: "blue", preview: "bg-gradient-to-br from-blue-500 to-blue-600", icon: <Palette className="w-4 h-4" /> },
  { value: "green", labelKey: "green", preview: "bg-gradient-to-br from-emerald-500 to-emerald-600", icon: <Palette className="w-4 h-4" /> },
  { value: "purple", labelKey: "purple", preview: "bg-gradient-to-br from-purple-500 to-purple-600", icon: <Palette className="w-4 h-4" /> },
];

const languages: { value: Language; label: string; native: string; flag: string }[] = [
  { value: "en", label: "English", native: "English", flag: "🇺🇸" },
  { value: "vi", label: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { value: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
  { value: "ko", label: "Korean", native: "한국어", flag: "🇰🇷" },
  { value: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
];

const fontSizes: { value: string; labelKey: string; scale: string }[] = [
  { value: "small", labelKey: "small", scale: "text-sm" },
  { value: "medium", labelKey: "medium", scale: "text-base" },
  { value: "large", labelKey: "large", scale: "text-lg" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem("englishskill-fontsize") || "medium";
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem("englishskill-reducedmotion") === "true";
  });

  useEffect(() => {
    localStorage.setItem("englishskill-fontsize", fontSize);
    document.documentElement.classList.remove("font-small", "font-medium", "font-large");
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("englishskill-reducedmotion", String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reducedMotion]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("settings")}</h1>
          <p className="text-muted-foreground mt-1">{t("customizeExperience")}</p>
        </div>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t("theme")}
            </CardTitle>
            <CardDescription>{t("chooseTheme")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {themes.map((themeItem) => (
                <button
                  key={themeItem.value}
                  onClick={() => setTheme(themeItem.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    theme === themeItem.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn("w-full aspect-video rounded-lg", themeItem.preview)} />
                  <span className="text-sm font-medium">{t(themeItem.labelKey)}</span>
                  {theme === themeItem.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("language")}</CardTitle>
            <CardDescription>{t("selectLanguage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {languages.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    lang === l.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <span className="text-3xl">{l.flag}</span>
                  <span className="text-sm font-medium">{l.native}</span>
                  {lang === l.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Options */}
        <Card>
          <CardHeader>
            <CardTitle>{t("accessibility")}</CardTitle>
            <CardDescription>{t("adjustAccessibility")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t("fontSize")}</Label>
              <div className="flex gap-3">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize(size.value)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg border-2 transition-all",
                      fontSize === size.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <span className={cn("font-medium", size.scale)}>{t(size.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t("reduceMotion")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("reduceMotionDesc")}
                </p>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
