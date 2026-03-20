import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, ShieldCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import roleService from "@/services/roleService";
import permissionService, { type PermissionResponse } from "@/services/permissionService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function RoleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isCreate = !id;

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const groupPermissions = useCallback((permissions: PermissionResponse[]): Record<string, PermissionResponse[]> => {
    const groups: Record<string, PermissionResponse[]> = {
      [t("roleUsersAccess")]: [],
      [t("roleToeicManagement")]: [],
      [t("roleDashboardAnalytics")]: [],
      [t("roleStudentFeatures")]: [],
      [t("roleOthers")]: [],
    };

    permissions.forEach((p) => {
      const name = p.name.toUpperCase();
      if (name.includes("USER") || name.includes("ROLE")) {
        groups[t("roleUsersAccess")].push(p);
      } else if (name.includes("TEST") || name.includes("QUESTION")) {
        if (name.includes("TAKE")) {
          groups[t("roleStudentFeatures")].push(p);
        } else {
          groups[t("roleToeicManagement")].push(p);
        }
      } else if (name.includes("DASHBOARD") || name.includes("ANALYTICS")) {
        groups[t("roleDashboardAnalytics")].push(p);
      } else {
        groups[t("roleOthers")].push(p);
      }
    });

    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, perms]) => perms.length > 0));
  }, [t]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch all permissions for the checklist
        const permsData = await permissionService.getPermissions(0, 1000);
        setPermissions(permsData.content);

        if (!isCreate && id) {
          const role = await roleService.getRoleById(id);
          setRoleName(role.name);
          setSelectedPermissions(role.permissions.map(p => p.id));
        }
      } catch (err: any) {
        toast.error("Failed to load permissions or role");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, isCreate]);

  const grouped = groupPermissions(permissions);

  const togglePermission = useCallback((permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }, []);

  const toggleGroup = useCallback((groupPerms: PermissionResponse[]) => {
    const groupIds = groupPerms.map((p) => p.id);
    const allSelected = groupIds.every((gid) => selectedPermissions.includes(gid));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupIds.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupIds])]);
    }
  }, [selectedPermissions]);

  const handleSave = useCallback(async () => {
    if (!roleName.trim()) { toast.error(t("roleNameRequired")); return; }
    if (selectedPermissions.length === 0) { toast.error(t("permissionRequired")); return; }

    setIsSaving(true);
    try {
      if (isCreate) {
        await roleService.createRole({
          name: roleName,
          permissionIds: selectedPermissions
        });
        toast.success(t("roleCreated"));
      } else if (id) {
        await roleService.updateRole(id, {
          name: roleName,
          permissionIds: selectedPermissions
        });
        toast.success(t("roleUpdated"));
      }
      navigate("/admin/roles");
    } catch (err: any) {
      toast.error(t("error"), { description: err?.response?.data?.message || err.message });
    } finally {
      setIsSaving(false);
    }
  }, [roleName, selectedPermissions, isCreate, navigate, id, t]);

  if (isLoading) {
    return (
      <AdminLayout pageTitle={t("loading")} pageDescription="">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle={isCreate ? t("createRole") : t("editRole")}
      pageDescription={isCreate ? t("defineNewRole") : (t("editingRoleText")?.replace("{name}", roleName) || `Editing role: ${roleName}`)}
    >
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/roles")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("backToRoles")}
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? t("saving") : isCreate ? t("createRole") : t("saveChanges")}
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("roleDetails")}</CardTitle></CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <Label>{t("roleName")} *</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., ROLE_USER, ROLE_ADMIN, etc." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {t("permissions")}
              <Badge variant="secondary" className="ml-2">{selectedPermissions.length} {t("selected")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(grouped).map(([group, perms]) => {
              const groupIds = perms.map((p) => p.id);
              const allSelected = groupIds.every((gid) => selectedPermissions.includes(gid));
              const someSelected = groupIds.some((gid) => selectedPermissions.includes(gid));

              return (
                <div key={group} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => toggleGroup(perms)}
                  >
                    <Checkbox checked={allSelected} className={someSelected && !allSelected ? "opacity-60" : ""} onCheckedChange={() => toggleGroup(perms)} />
                    <span className="font-semibold text-sm text-foreground">{group}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {groupIds.filter((gid) => selectedPermissions.includes(gid)).length}/{perms.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-border">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          selectedPermissions.includes(perm.id) ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                        onClick={() => togglePermission(perm.id)}
                      >
                        <Checkbox checked={selectedPermissions.includes(perm.id)} onCheckedChange={() => togglePermission(perm.id)} />
                        <code className="text-xs font-mono text-muted-foreground">{perm.name}</code>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
