import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import userService from "@/services/userService";
import roleService, { type RoleResponse } from "@/services/roleService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function UserEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isCreate = !id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleResponse[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load all available roles first
        const rolesData = await roleService.getRoles(0, 100);
        setAvailableRoles(rolesData.content);

        if (!isCreate && id) {
          const user = await userService.getUserById(id);
          setName(user.fullName);
          setEmail(user.email);
          setStatus(user.status);
          setSelectedRoleIds(user.roles.map(r => r.id));
        }
      } catch (err: any) {
        console.error("Error loading user data:", err);
        toast.error("Failed to load user or roles");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, isCreate]);

  const toggleRole = useCallback((roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { toast.error(t("nameRequired")); return; }
    if (!email.trim()) { toast.error(t("emailRequired")); return; }

    setIsSaving(true);
    try {
      if (isCreate) {
        if (!password) { toast.error(t("passwordRequired")); setIsSaving(false); return; }
        await userService.createUser({
          email,
          password,
          fullName: name,
          status,
          roleIds: selectedRoleIds
        });
        toast.success(t("userCreated") || "User created successfully");
      } else if (id) {
        await userService.updateUser(id, {
          email,
          fullName: name,
          status,
          roleIds: selectedRoleIds
        });

        if (password.trim()) {
          // If a password was entered for an existing user, assume it's a reset attempt
          // Note: In a full implementation, we'd need currentPassword or an admin reset endpoint
          toast.info("Password update not supported in this editor for existing users. Use separate reset flow.");
        }

        toast.success(t("userUpdated"));
      }
      navigate("/admin/users");
    } catch (err: any) {
      const resp = err?.response?.data;
      let errorMsg = resp?.message || err.message;
      
      // If there are validation errors, format them into the description
      let description = "";
      if (resp?.data && typeof resp.data === 'object') {
        description = Object.entries(resp.data)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
      } else {
        description = err?.response?.data?.message || err.message;
      }

      toast.error(t("error"), { description });
    } finally {
      setIsSaving(false);
    }
  }, [name, email, password, status, selectedRoleIds, isCreate, navigate, id, t]);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("backToUsers")}
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-10 rounded-xl px-4 font-bold shadow-md shadow-primary/10">
            <Save className="w-4 h-4" />
            {isSaving ? t("saving") : isCreate ? t("createUser") : t("saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column - Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50 shadow-sm rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-bold text-foreground">{t("basicInformation")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">{t("fullName")} *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("enterFullNamePlaceholder")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">{t("email")} *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("enterEmailPlaceholder")} disabled={!isCreate} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">{isCreate ? `${t("password")} *` : t("resetPassword")}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isCreate ? t("enterPassword") : t("leaveBlankPassword")}
                      className="h-11 rounded-xl pl-3 pr-10"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">{t("status")}</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                      <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                      <SelectItem value="BANNED">{t("banned")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Role Assignment */}
        <div className="lg:col-span-1">
          <Card className="border border-border/50 shadow-sm rounded-2xl h-full">
            <CardHeader><CardTitle className="text-lg font-bold text-foreground">{t("roleAssignment")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{t("assignRolesDesc")}</p>
              {availableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No roles found on server.</p>
              ) : (
                <div className="space-y-2.5">
                  {availableRoles.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedRoleIds.includes(role.id) 
                          ? "border-primary bg-primary/[0.03] shadow-sm shadow-primary/5" 
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/10"
                      }`}
                      onClick={() => toggleRole(role.id)}
                    >
                      <Checkbox checked={selectedRoleIds.includes(role.id)} onCheckedChange={() => toggleRole(role.id)} className="rounded" />
                      <span className="font-semibold text-xs tracking-tight uppercase text-foreground">{role.name.replace("ROLE_", "")}</span>
                      {selectedRoleIds.includes(role.id) && <Badge variant="secondary" className="ml-auto text-[10px] font-bold bg-primary/10 text-primary border-none">{t("assigned")}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
