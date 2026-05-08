import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import userService, { UserResponse } from "@/services/userService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Shield, Calendar, Lock, Save, Phone } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ProfilePage() {
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getMe();
      setProfile(data);
      setFullName(data.fullName);
      setPhone(data.phone || "");
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // 1. Update Profile Info
      await userService.updateMe({ fullName, phone });

      // 2. Change Password if provided
      if (newPassword) {
        if (!currentPassword) {
          toast.error(t("currentPasswordRequired"));
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPwd) {
          toast.error(t("passwordMismatch"));
          setSaving(false);
          return;
        }
        await userService.changeMyPassword({ currentPassword, newPassword });
      }

      toast.success(t("profileUpdated"));
      await fetchProfile();
      refreshProfile(); // Sync AuthContext
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPwd("");
    } catch (err: any) {
      // Error is already toasted by apiClient interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{profile?.fullName}</h2>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="w-4 h-4" /> {profile?.email}
                </p>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  {profile?.roles && profile.roles.length > 0 ? (
                    profile.roles.map((r) => (
                      <Badge key={r.id} variant="secondary" className="capitalize">{r.name}</Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{t("student")}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="w-4 h-4" />
                  {t("joined")}: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("basicInformation")}
            </CardTitle>
            <CardDescription>{t("editProfileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("enterFullNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phonePlaceholder")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input value={profile?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">{t("emailReadonly")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t("changePassword")}
            </CardTitle>
            <CardDescription>{t("changePasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("currentPassword")}</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label>{t("newPassword")}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label>{t("confirmNewPassword")}</Label>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </div>
    </>
  );
}
