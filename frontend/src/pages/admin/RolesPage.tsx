import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import roleService, { type RoleResponse } from "@/services/roleService";
import permissionService from "@/services/permissionService";
import { Search, Plus, Pencil, Trash2, Shield, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function RolesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPermissions, setTotalPermissions] = useState(0);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        roleService.getRoles(0, 100),
        permissionService.getPermissions(0, 1)
      ]);
      setRoles(rolesData.content);
      setTotalPermissions(permsData.totalElements);
    } catch (error: any) {
      toast.error(t("error") || "Failed to load roles");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [roles, searchTerm]);

  const handleDelete = (role: RoleResponse) => {
    setRoleToDelete(role);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      try {
        await roleService.deleteRole(roleToDelete.id);
        toast.success(`${t("deleteRole")}: "${roleToDelete.name}"`);
        fetchRoles();
      } catch (error: any) {
        toast.error(t("error") || "Failed to delete role", { 
          description: error?.response?.data?.message || error.message 
        });
      }
      setDeleteOpen(false);
      setRoleToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roles.length}</p>
                <p className="text-sm text-muted-foreground">{t("totalRoles")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPermissions}</p>
                <p className="text-sm text-muted-foreground">{t("availablePermissions")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("searchRoles")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button className="gap-2" onClick={() => navigate("/admin/roles/create")}>
              <Plus className="w-4 h-4" /> {t("createRole")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>{t("roleName")}</TableHead>
                      <TableHead className="w-[140px]">{t("permissions")}</TableHead>
                      <TableHead className="w-[140px]">{t("created")}</TableHead>
                      <TableHead className="w-[120px] text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {t("noRolesFound")}
                        </TableCell>
                      </TableRow>
                    ) : filteredRoles.map((role) => (
                      <TableRow key={role.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">{role.name.replace("ROLE_", "").toLowerCase()}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{role.permissions.length} {t("permissionsCount")}</Badge></TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{new Date(role.createdAt).toLocaleDateString()}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/roles/${role.id}/edit`)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(role)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> {t("deleteRole")}</DialogTitle>
              <DialogDescription>{t("deleteRoleConfirm").replace("{name}", roleToDelete?.name || "")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("cancel")}</Button>
              <Button variant="destructive" onClick={confirmDelete}>{t("deleteRole")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}