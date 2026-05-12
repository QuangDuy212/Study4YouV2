import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import roleService, { type RoleResponse } from "@/services/roleService";
import permissionService from "@/services/permissionService";
import { Search, Plus, Pencil, Trash2, Shield, ShieldCheck, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export default function RolesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [totalPermissions, setTotalPermissions] = useState(0);
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkRestoreLoading, setBulkRestoreLoading] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      // Translate tab to backend param
      const isActiveParam = activeTab === "ALL" ? undefined : activeTab === "ACTIVE" ? true : false;
      
      const [rolesData, permsData] = await Promise.all([
        roleService.getRoles(page, pageSize, "createdAt", "DESC", isActiveParam),
        permissionService.getPermissions(0, 1)
      ]);
      setRoles(rolesData.content);
      setTotalPages(rolesData.totalPages);
      setTotalElements(rolesData.totalElements);
      setTotalPermissions(permsData.totalElements);
    } catch (error: any) {
      toast.error(t("error") || "Failed to load roles");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    fetchRoles();
    setSelectedIds(new Set());
  }, [activeTab, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Visual search only for list performance
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [roles, searchTerm]);

  const handleDeleteClick = (role: RoleResponse) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    try {
      await roleService.deleteRole(roleToDelete.id);
      toast.success(`${t("deleteRole")}: "${roleToDelete.name}"`);
      fetchRoles();
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role");
    } finally {
      setIsDeletingRole(false);
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      await roleService.restoreRole(id);
      toast.success(t("restoreSuccess").replace("{name}", name));
      fetchRoles();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("bulkRestoreFailed"));
    }
  };

  const toggleSelectAll = () => {
    if (filteredRoles.length === 0) return;
    const allSelected = filteredRoles.every(r => selectedIds.has(r.id));
    const next = new Set(selectedIds);
    if (allSelected) {
      filteredRoles.forEach(r => next.delete(r.id));
    } else {
      filteredRoles.forEach(r => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => roleService.deleteRole(id)));
      toast.success(t("bulkDeleteSuccess"));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchRoles();
    } catch (e: any) {
      toast.error(t("bulkDeleteFailed"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    setBulkRestoreLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => roleService.restoreRole(id)));
      toast.success(t("bulkRestoreSuccess"));
      setSelectedIds(new Set());
      fetchRoles();
    } catch (e: any) {
      toast.error(t("bulkRestoreFailed"));
    } finally {
      setBulkRestoreLoading(false);
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
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={t("searchRoles")} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-9 h-11 rounded-xl" 
                  />
                </div>
                <Button type="submit" variant="secondary" className="h-11 rounded-xl px-5 font-bold">{t("search")}</Button>
              </form>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                  {(["ALL", "ACTIVE", "DELETED"] as const).map((tab) => (
                    <Button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedIds(new Set());
                      }}
                      variant={activeTab === tab ? "default" : "ghost"}
                      className={`h-9 rounded-lg px-4 text-xs font-bold transition-all ${
                        activeTab === tab ? "shadow-sm bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {tab === "ALL" ? t("all") : tab === "ACTIVE" ? t("activeTestsTab") : t("deletedTestsTab")}
                    </Button>
                  ))}
                </div>
                <Button className="gap-2 shrink-0 shadow-lg shadow-primary/20" onClick={() => navigate("/admin/roles/create")}>
                  <Plus className="w-4 h-4" /> {t("createRole")}
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && activeTab !== "ALL" && (
              <div className="flex items-center justify-between p-4 mb-6 bg-primary/[0.03] border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-bold text-primary">{t("selectedItems").replace("{count}", selectedIds.size.toString())}</span>
                </div>
                <div className="flex gap-2">
                  {activeTab === "ACTIVE" && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setBulkDeleteOpen(true)}
                      className="rounded-lg font-bold shadow-sm h-9 px-4"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" /> {t("deleteSelected")}
                    </Button>
                  )}
                  {activeTab === "DELETED" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBulkRestore}
                      disabled={bulkRestoreLoading}
                      className="rounded-lg font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all shadow-sm h-9 px-4"
                    >
                      {bulkRestoreLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                      {t("restoreSelected")}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
              <>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        {activeTab !== "ALL" && (
                          <TableHead className="w-12">
                            <input 
                              type="checkbox" 
                              checked={filteredRoles.length > 0 && filteredRoles.every(r => selectedIds.has(r.id))}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </TableHead>
                        )}
                        <TableHead className="font-bold">{t("roleName")}</TableHead>
                        <TableHead className="w-[140px] font-bold">{t("permissions")}</TableHead>
                        <TableHead className="w-[120px] font-bold">{t("status")}</TableHead>
                        <TableHead className="w-[140px] font-bold">{t("created")}</TableHead>
                        <TableHead className="w-[120px] text-right font-bold">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={activeTab === "ALL" ? 5 : 6} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Shield className="w-8 h-8 opacity-20" />
                              <p>{t("noRolesFound")}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredRoles.map((role) => (
                        <TableRow key={role.id} className={`${selectedIds.has(role.id) ? "bg-primary/[0.02]" : ""} hover:bg-muted/30 transition-colors border-b`}>
                          {activeTab !== "ALL" && (
                            <TableCell className="w-12">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.has(role.id)}
                                onChange={() => toggleSelectOne(role.id)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role.active !== false ? "bg-primary/10" : "bg-muted"}`}>
                                <Shield className={`w-4 h-4 ${role.active !== false ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <span className={`font-bold ${role.active !== false ? "text-foreground" : "text-muted-foreground line-through"}`}>
                                  {role.name.replace("ROLE_", "").toLowerCase()}
                                </span>
                                {role.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{role.description}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground font-bold">{role.permissions?.length || 0} {t("permissionsCount")}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={role.active !== false ? "outline" : "destructive"} className={role.active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                              {role.active !== false ? t("active") || "Active" : t("deletedTestsTab") || "Deleted"}
                            </Badge>
                          </TableCell>
                          <TableCell><span className="text-sm text-muted-foreground font-medium">{new Date(role.createdAt).toLocaleDateString()}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {role.active === false ? (
                                <Button variant="ghost" size="icon" onClick={() => handleRestore(role.id, role.name)} title="Restore role">
                                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                                </Button>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/admin/roles/${role.id}/edit`)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(role)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 0 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {t("showing")} {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} {t("of")} {totalElements}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                        onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={page === i ? "default" : "ghost"}
                            size="sm"
                            className={`w-9 h-9 rounded-lg p-0 font-bold transition-all ${
                              page === i 
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                : "hover:bg-primary/10 hover:text-primary border border-border/50"
                            }`}
                            onClick={() => setPage(i)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                        onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Single Delete Confirmation */}
        <ConfirmDeleteModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeletingRole}
          itemName={roleToDelete?.name}
          title={t("softDeleteConfirmTitle")}
          description={(
            <>
              {t("softDeleteConfirmDesc").split("{name}")[0]}
              <strong className="font-bold text-foreground mx-1">"{roleToDelete?.name}"</strong>
              {t("softDeleteConfirmDesc").split("{name}")[1]}
            </>
          )}
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDeleteModal
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          isLoading={isBulkDeleting}
          title={t("bulkSoftDeleteTitle")}
          description={(
            <>
              {t("bulkSoftDeleteDesc").split("{count}")[0]}
              <strong className="font-bold text-foreground mx-1">{selectedIds.size}</strong>
              {t("bulkSoftDeleteDesc").split("{count}")[1]}
            </>
          )}
        />
      </div>
    </>
  );
}