import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Users, User, Info, AlertTriangle, CheckCircle, Megaphone } from "lucide-react";
import { toast } from "sonner";
import notificationService from "@/services/notificationService";
import { motion } from "framer-motion";

const getNotificationTypes = (t: any) => [
  { value: "INFO", label: t("notification.types.info"), icon: Info, color: "text-blue-500" },
  { value: "WARNING", label: t("notification.types.warning"), icon: AlertTriangle, color: "text-amber-500" },
  { value: "SUCCESS", label: t("notification.types.success"), icon: CheckCircle, color: "text-green-500" },
  { value: "SYSTEM", label: t("notification.types.system"), icon: Megaphone, color: "text-purple-500" },
];

export default function NotificationManagementPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<"ALL" | "SINGLE">("ALL");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    userId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error(t("notification.titleRequired"));
    if (!formData.content) return toast.error(t("notification.contentRequired"));
    if (targetType === "SINGLE" && !formData.userId) return toast.error(t("notification.userIdRequired"));

    setLoading(true);
    try {
      await notificationService.createNotification({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        userId: targetType === "ALL" ? undefined : formData.userId,
      });
      toast.success(t("notification.sentSuccess"));
      setFormData({
        title: "",
        content: "",
        type: "INFO",
        userId: "",
      });
    } catch (error) {
      toast.error(t("notification.sentFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout 
      pageTitle={t("notification.management")} 
      pageDescription={t("notification.managementDesc")}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display font-bold">{t("notification.title")}</CardTitle>
                  <CardDescription>{t("notification.managementDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">{t("notification.recipient")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTargetType("ALL")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                          targetType === "ALL" 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                        }`}
                      >
                        <Users className="w-6 h-6" />
                        <span className="text-xs font-bold">{t("notification.sendAll")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetType("SINGLE")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                          targetType === "SINGLE" 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                        }`}
                      >
                        <User className="w-6 h-6" />
                        <span className="text-xs font-bold">{t("notification.sendSpecific")}</span>
                      </button>
                    </div>

                    {targetType === "SINGLE" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 pt-2"
                      >
                        <Label htmlFor="userId">{t("notification.userId")}</Label>
                        <Input 
                          id="userId"
                          placeholder={t("notification.userIdPlaceholder")}
                          value={formData.userId}
                          onChange={(e) => setFormData({...formData, userId: e.target.value})}
                          className="font-mono text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">{t("notification.userIdHint")}</p>
                      </motion.div>
                    )}

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="type">{t("notification.type")}</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(val) => setFormData({...formData, type: val})}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getNotificationTypes(t).map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`w-4 h-4 ${type.color}`} />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">{t("notification.bodyContent")}</Label>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">{t("notification.notificationTitle")}</Label>
                      <Input 
                        id="title"
                        placeholder={t("notification.notificationTitlePlaceholder")}
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">{t("notification.notificationContent")}</Label>
                      <Textarea 
                        id="content"
                        placeholder={t("notification.notificationContentPlaceholder")}
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="min-h-[150px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t("notification.sendButton")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-bold text-blue-500 uppercase text-xs tracking-widest">{t("notification.sendAll")}</h3>
              <p className="text-xs text-muted-foreground">{t("notification.sendToAllDesc")}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Megaphone className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-bold text-purple-500 uppercase text-xs tracking-widest">{t("notification.broadcast")}</h3>
              <p className="text-xs text-muted-foreground">{t("notification.broadcastDesc")}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-bold text-amber-500 uppercase text-xs tracking-widest">{t("notification.caution")}</h3>
              <p className="text-xs text-muted-foreground">{t("notification.cautionDesc")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
