import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, ShieldCheck, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import roleService from "@/services/roleService";
import permissionService, { type PermissionResponse } from "@/services/permissionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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

  // States for creating custom permissions
  const [showCreatePermDialog, setShowCreatePermDialog] = useState(false);
  const [newPermName, setNewPermName] = useState("");
  const [newPermPath, setNewPermPath] = useState("/admin/**");
  const [isCreatingPerm, setIsCreatingPerm] = useState(false);

  // States for editing permissions
  const [editingPerm, setEditingPerm] = useState<PermissionResponse | null>(null);
  const [editPermName, setEditPermName] = useState("");
  const [editPermPath, setEditPermPath] = useState("");
  const [isUpdatingPerm, setIsUpdatingPerm] = useState(false);

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

  const fetchPermissions = useCallback(async () => {
    try {
      const permsData = await permissionService.getPermissions(0, 1000);
      setPermissions(permsData.content);
    } catch (err) {
      console.error("Failed to reload permissions", err);
    }
  }, []);

  const handleCreatePermission = async () => {
    const formattedName = newPermName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!formattedName) {
      toast.error(t("roleNameRequired"));
      return;
    }
    setIsCreatingPerm(true);
    try {
      await permissionService.createPermission({
        name: formattedName,
        pageAllow: newPermPath ? [newPermPath.trim()] : []
      });
      toast.success(t("createSuccess"));
      setNewPermName("");
      setNewPermPath("/admin/**");
      setShowCreatePermDialog(false);
      await fetchPermissions();
    } catch (err: any) {
      toast.error(t("error"), { description: err?.response?.data?.message || err.message });
    } finally {
      setIsCreatingPerm(false);
    }
  };

  const handleDeletePermission = async (permId: string, permName: string) => {
    const systemPerms = ["MANAGE_USERS", "MANAGE_QUESTIONS", "MANAGE_TESTS", "VIEW_ADMIN_DASHBOARD", "VIEW_ANALYTICS", "TAKE_TOEIC_TEST"];
    if (systemPerms.includes(permName)) {
      toast.error(t("cannotRenameSystemPerm"));
      return;
    }
    if (!confirm(`${t("delete")} "${permName}"?`)) return;
    try {
      await permissionService.deletePermission(permId);
      toast.success(t("deleteSuccess"));
      setSelectedPermissions(prev => prev.filter(id => id !== permId));
      await fetchPermissions();
    } catch (err: any) {
      toast.error(t("error"), { description: err?.response?.data?.message || err.message });
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPerm) return;
    const formattedName = editPermName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!formattedName) {
      toast.error(t("roleNameRequired"));
      return;
    }
    setIsUpdatingPerm(true);
    try {
      await permissionService.updatePermission(editingPerm.id, {
        name: formattedName,
        pageAllow: editPermPath ? [editPermPath.trim()] : []
      });
      toast.success(t("updateSuccess"));
      setEditingPerm(null);
      await fetchPermissions();
    } catch (err: any) {
      toast.error(t("error"), { description: err?.response?.data?.message || err.message });
    } finally {
      setIsUpdatingPerm(false);
    }
  };

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
      <>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </>
    );
  }

  return (
    <>
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

        <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40 bg-muted/10">
            <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
              <ShieldCheck className="w-5 h-5 text-primary animate-pulse" />
              {t("permissions")}
              <Badge variant="secondary" className="ml-2 font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border-none">
                {selectedPermissions.length} {t("selected")}
              </Badge>
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreatePermDialog(true)}
              className="gap-1.5 text-xs font-bold h-8.5 rounded-xl border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("createNewPermission")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {Object.entries(grouped).map(([group, perms]) => {
              const groupIds = perms.map((p) => p.id);
              const allSelected = groupIds.every((gid) => selectedPermissions.includes(gid));
              const someSelected = groupIds.some((gid) => selectedPermissions.includes(gid));

              return (
                <div key={group} className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-background/50 backdrop-blur-sm transition-all duration-300">
                  <div
                    className="flex items-center gap-3 p-4 bg-muted/20 cursor-pointer hover:bg-muted/40 border-b border-border/30 transition-all duration-200"
                    onClick={() => toggleGroup(perms)}
                  >
                    <Checkbox checked={allSelected} className={someSelected && !allSelected ? "opacity-60 rounded-md" : "rounded-md"} onCheckedChange={() => toggleGroup(perms)} />
                    <span className="font-bold text-sm text-foreground/90 tracking-wide">{group}</span>
                    <Badge variant="outline" className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border-muted text-muted-foreground bg-muted/10">
                      {groupIds.filter((gid) => selectedPermissions.includes(gid)).length}/{perms.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-muted/5">
                    {perms.map((perm) => {
                      const isSystem = ["MANAGE_USERS", "MANAGE_QUESTIONS", "MANAGE_TESTS", "VIEW_ADMIN_DASHBOARD", "VIEW_ANALYTICS", "TAKE_TOEIC_TEST"].includes(perm.name);
                      const isSelected = selectedPermissions.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                            isSelected 
                              ? "bg-primary/[0.04] border-primary/20 shadow-sm" 
                              : "border-transparent hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1" onClick={() => togglePermission(perm.id)}>
                            <Checkbox checked={isSelected} className="rounded-md" onCheckedChange={() => togglePermission(perm.id)} />
                            <div className="flex flex-col gap-0.5">
                              <code className="text-xs font-mono font-bold text-foreground/95 tracking-wider">{perm.name}</code>
                              {perm.pageAllow && perm.pageAllow.length > 0 && (
                                <div className="mt-0.5">
                                  <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/20">
                                    Pages: {perm.pageAllow.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPerm(perm);
                                setEditPermName(perm.name);
                                setEditPermPath(perm.pageAllow && perm.pageAllow.length > 0 ? perm.pageAllow[0] : "/admin/**");
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {!isSystem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8.5 w-8.5 rounded-xl text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePermission(perm.id, perm.name);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Dialog tạo quyền mới */}
      <Dialog open={showCreatePermDialog} onOpenChange={setShowCreatePermDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-xl border border-border/80">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold tracking-tight">{t("createPermissionTitle")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("createPermissionDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="perm-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("permissionName")} *</Label>
              <Input
                id="perm-name"
                value={newPermName}
                onChange={(e) => setNewPermName(e.target.value)}
                placeholder="Ví dụ: MANAGE_PAYMENTS"
                className="rounded-xl h-10 border-border/60 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-path" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("pagePathAllow")} *</Label>
              <Input
                id="perm-path"
                value={newPermPath}
                onChange={(e) => setNewPermPath(e.target.value)}
                placeholder="/admin/**"
                className="rounded-xl h-10 border-border/60 focus:border-primary/50 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/20 pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowCreatePermDialog(false)} disabled={isCreatingPerm} className="rounded-xl h-10 px-4 font-semibold">
              {t("cancel")}
            </Button>
            <Button onClick={handleCreatePermission} disabled={isCreatingPerm} className="rounded-xl h-10 px-4 font-semibold bg-primary hover:bg-primary/90">
              {isCreatingPerm ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa quyền */}
      <Dialog open={!!editingPerm} onOpenChange={(open) => !open && setEditingPerm(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-xl border border-border/80">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold tracking-tight">{t("editPermissionTitle")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("editPermissionDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-perm-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("permissionName")} *</Label>
              <Input
                id="edit-perm-name"
                value={editPermName}
                onChange={(e) => setEditPermName(e.target.value)}
                placeholder="Ví dụ: MANAGE_PAYMENTS"
                className="rounded-xl h-10 border-border/60 focus:border-primary/50"
                disabled={editingPerm ? ["MANAGE_USERS", "MANAGE_QUESTIONS", "MANAGE_TESTS", "VIEW_ADMIN_DASHBOARD", "VIEW_ANALYTICS", "TAKE_TOEIC_TEST"].includes(editingPerm.name) : false}
              />
              {editingPerm && ["MANAGE_USERS", "MANAGE_QUESTIONS", "MANAGE_TESTS", "VIEW_ADMIN_DASHBOARD", "VIEW_ANALYTICS", "TAKE_TOEIC_TEST"].includes(editingPerm.name) && (
                <p className="text-[10px] text-destructive/80 font-semibold mt-1">{t("cannotRenameSystemPerm")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-perm-path" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("pagePathAllow")} *</Label>
              <Input
                id="edit-perm-path"
                value={editPermPath}
                onChange={(e) => setEditPermPath(e.target.value)}
                placeholder="/admin/**"
                className="rounded-xl h-10 border-border/60 focus:border-primary/50 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/20 pt-4 mt-2">
            <Button variant="outline" onClick={() => setEditingPerm(null)} disabled={isUpdatingPerm} className="rounded-xl h-10 px-4 font-semibold">
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdatePermission} disabled={isUpdatingPerm} className="rounded-xl h-10 px-4 font-semibold bg-primary hover:bg-primary/90">
              {isUpdatingPerm ? t("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
