import { useState, useEffect } from "react";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import settingsService from "@/services/settingsService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, Sun, Moon, Palette, Globe, Bell, Volume2 } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem("s4u-sound") !== "false"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setNotificationsEnabled(data.notificationsEnabled);
      // Sync local context if needed, but usually these are already set via contexts
      // The requirement says save settings via Call: PUT /api/settings/me
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<{ language: Language; theme: Theme; notificationsEnabled: boolean }>) => {
    const newSettings = {
      language: updates.language || lang,
      theme: updates.theme || theme,
      notificationsEnabled: updates.notificationsEnabled !== undefined ? updates.notificationsEnabled : notificationsEnabled
    };

    try {
      await settingsService.updateSettings(newSettings);
      
      if (updates.language) setLang(updates.language);
      if (updates.theme) setTheme(updates.theme);
      if (updates.notificationsEnabled !== undefined) setNotificationsEnabled(updates.notificationsEnabled);
      
      toast.success(t("settingsUpdated"));
    } catch (err) {
      // Error handled by interceptor
    }
  };

  useEffect(() => {
    localStorage.setItem("s4u-sound", String(soundEnabled));
  }, [soundEnabled]);

  if (loading) {
    return (
      <AdminLayout pageTitle={t("settings")} pageDescription={t("settingsDesc")}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle={t("settings")} pageDescription={t("settingsDesc")}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t("language")}
            </CardTitle>
            <CardDescription>{t("selectLanguage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {languages.map((l) => (
                <button
                  key={l.value}
                  onClick={() => handleUpdateSettings({ language: l.value })}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    lang === l.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <span className="text-2xl">{l.flag}</span>
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

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t("theme")}
            </CardTitle>
            <CardDescription>{t("chooseTheme")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {themes.map((themeItem) => (
                <button
                  key={themeItem.value}
                  onClick={() => handleUpdateSettings({ theme: themeItem.value })}
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

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("notificationSettings")}
            </CardTitle>
            <CardDescription>{t("notificationSettingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t("enableNotifications")}</Label>
                <p className="text-sm text-muted-foreground">{t("enableNotificationsDesc")}</p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={(val) => handleUpdateSettings({ notificationsEnabled: val })} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  {t("soundNotifications")}
                </Label>
                <p className="text-sm text-muted-foreground">{t("soundNotificationsDesc")}</p>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
