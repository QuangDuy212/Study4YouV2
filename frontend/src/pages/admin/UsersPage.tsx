import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import userService, { type UserResponse } from "@/services/userService";
import {
  Search, Eye, UserX, UserCheck, User, Mail, Calendar, Award, BookOpen, Filter,
  Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

const ITEMS_PER_PAGE = 8;

export default function UsersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkRestoreLoading, setBulkRestoreLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const isActiveParam = activeTab === "ALL" ? undefined : activeTab === "ACTIVE" ? true : false;
      const data = await userService.getUsers(page, pageSize, "createdAt", "DESC", isActiveParam);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(t("failedToLoad") || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    setSelectedUserIds(new Set());
  }, [activeTab, page]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const handleToggleStatus = async (user: UserResponse) => {
    const newStatus = user.status.toLowerCase() === "active" ? "INACTIVE" : "ACTIVE";
    try {
      await userService.updateUser(user.id, { 
        email: user.email,
        fullName: user.fullName,
        status: newStatus 
      });
      toast.success(t("userStatusUpdated").replace("{name}", user.fullName).replace("{status}", t(newStatus.toLowerCase() as any)));
      fetchUsers();
    } catch (error) {
      toast.error(t("error") || "Failed to update status");
    }
  };

  const handleDeleteUser = (user: UserResponse) => {
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const handleRestoreUser = async (id: string) => {
    try {
      await userService.restoreUser(id);
      toast.success(t("restoreSuccess") || "User restored successfully");
      fetchUsers();
    } catch (error) {
      toast.error(t("error") || "Failed to restore user");
    }
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setIsDeletingUser(true);
      try {
        await userService.deleteUser(userToDelete.id);
        toast.success(t("userDeleted").replace("{name}", userToDelete.fullName));
        fetchUsers();
        setDeleteOpen(false);
        setUserToDelete(null);
      } catch (error) {
        toast.error(t("failedToDelete") || "Failed to delete user");
      } finally {
        setIsDeletingUser(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (filteredUsers.length === 0) return;
    const allSelected = filteredUsers.every(u => selectedUserIds.has(u.id));
    const next = new Set(selectedUserIds);
    if (allSelected) {
      filteredUsers.forEach(u => next.delete(u.id));
    } else {
      filteredUsers.forEach(u => next.add(u.id));
    }
    setSelectedUserIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedUserIds).map(id => userService.deleteUser(id)));
      toast.success(t("bulkDeleteSuccess")?.replace("{count}", selectedUserIds.size.toString()) || "Selected users deleted successfully");
      setSelectedUserIds(new Set());
      setBulkDeleteOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error("Failed to delete some selected users");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedUserIds.size === 0) return;
    setBulkRestoreLoading(true);
    try {
      await Promise.all(Array.from(selectedUserIds).map((id) => userService.restoreUser(id)));
      toast.success(t("bulkRestoreSuccess")?.replace("{count}", selectedUserIds.size.toString()) || "Successfully restored selected users");
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (error) {
      toast.error("Failed to restore some users");
    } finally {
      setBulkRestoreLoading(false);
    }
  };

  const handleBulkToggleStatus = async () => {
    if (!window.confirm(`Are you sure you want to change status for ${selectedUserIds.size} selected users?`)) return;
    setIsLoading(true);
    try {
      await Promise.all(Array.from(selectedUserIds).map(async (id) => {
        const u = users.find(user => user.id === id);
        if (u) {
          const newStatus = u.status.toLowerCase() === "active" ? "INACTIVE" : "ACTIVE";
          await userService.updateUser(id, { 
            email: u.email,
            fullName: u.fullName,
            status: newStatus 
          });
        }
      }));
      toast.success("Successfully toggled status for selected users");
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (e) {
      toast.error("Failed to update status for some selected users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Header actions & stats placeholder can go here if needed later */}

        <Card className="border-none shadow-md shadow-primary/5 overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Control Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('searchByNameEmail')} 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} 
                    className="pl-9 h-10 bg-background/50 focus-visible:ring-primary/30 border-border/60 rounded-xl transition-all" 
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                    <SelectTrigger className="h-10 w-[160px] rounded-xl bg-background/50 border-border/60"><SelectValue placeholder={t("status")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allStatus')}</SelectItem>
                      <SelectItem value="active">{t('active')}</SelectItem>
                      <SelectItem value="inactive">{t('inactive')}</SelectItem>
                      <SelectItem value="banned">{t('banned') || "Banned"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                  {(["ALL", "ACTIVE", "DELETED"] as const).map((tab) => (
                    <Button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedUserIds(new Set());
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
                <Button className="gap-2 shrink-0 shadow-lg shadow-primary/20" onClick={() => navigate("/admin/users/create")}>
                  <Plus className="w-4 h-4" /> {t('createUser')}
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUserIds.size > 0 && activeTab !== "ALL" && (
              <div className="flex items-center justify-between p-4 mb-6 bg-primary/[0.03] border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-bold text-primary">{t("selectedItems")?.replace("{count}", selectedUserIds.size.toString()) || `Đã chọn ${selectedUserIds.size} mục`}</span>
                </div>
                <div className="flex gap-2">
                  {activeTab === "ACTIVE" && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setBulkDeleteOpen(true)}
                      className="rounded-lg font-bold shadow-sm h-9 px-4"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" /> {t("deleteSelected") || "Xóa nhiều"}
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
                      {t("restoreSelected") || "Khôi phục nhiều"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-muted/10 rounded-xl animate-pulse">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-3 w-1/3" /></div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/5 rounded-xl border-2 border-dashed">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('noUsersFound')}</h3>
                <p className="text-muted-foreground max-w-sm mb-4">{t('noUsersHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-b border-border/50">
                      {activeTab !== "ALL" && (
                        <TableHead className="w-12">
                          <input 
                            type="checkbox" 
                            checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.id))}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                        </TableHead>
                      )}
                      <TableHead className="font-bold">{t('user')}</TableHead>
                      <TableHead className="w-[160px] font-bold">{t('roles')}</TableHead>
                      <TableHead className="w-[140px] font-bold">{t('status')}</TableHead>
                      <TableHead className="w-[160px] font-bold">{t('registered')}</TableHead>
                      <TableHead className="w-[140px] text-right font-bold">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={cn(
                          "transition-colors border-b border-border/50 hover:bg-muted/30",
                          selectedUserIds.has(user.id) && "bg-primary/[0.02]"
                        )}
                      >
                        {activeTab !== "ALL" && (
                          <TableCell className="w-12">
                            <input 
                              type="checkbox" 
                              checked={selectedUserIds.has(user.id)}
                              onChange={() => toggleSelectOne(user.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10 border shadow-sm">
                                <AvatarImage src={user.avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                  {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {user.status.toLowerCase() === "active" && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full shadow-sm" />
                              )}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${user.active === false ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {user.fullName || t("noName")}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length > 0 ? user.roles.map((role) => (
                              <Badge key={role.id} variant="secondary" className="text-[10px] font-bold bg-secondary/50 border-none">
                                {role.name.replace("ROLE_", "")}
                              </Badge>
                            )) : <span className="text-xs text-muted-foreground italic">{t('noRoles')}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "pl-1.5 pr-2.5 py-1 rounded-full text-[10px] font-bold uppercase border-none flex items-center gap-1.5 w-fit",
                            user.status.toLowerCase() === "active"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : user.status.toLowerCase() === "banned"
                              ? "bg-rose-500/10 text-rose-700"
                              : "bg-zinc-500/10 text-zinc-700"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              user.status.toLowerCase() === "active" ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : 
                              user.status.toLowerCase() === "banned" ? "bg-rose-500" : "bg-zinc-400"
                            )} />
                            {t(user.status.toLowerCase() as any) || user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.active !== false ? (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className={cn(
                                  "h-8 w-8 rounded-lg transition-colors",
                                  user.status.toLowerCase() === "active" ? "text-orange-500 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"
                                )} onClick={() => handleToggleStatus(user)}>
                                  {user.status.toLowerCase() === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => handleDeleteUser(user)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                onClick={() => handleRestoreUser(user.id)}
                                title={t("restore") || "Khôi phục"}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Server Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t("showing") || "HIỂN THỊ"} {totalElements === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} {t("of") || "TRONG"} {totalElements}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-lg bg-background border-border/60"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                    // Show reasonable range of pages
                    if (totalPages > 7 && Math.abs(pageNum - page) > 2 && pageNum !== 0 && pageNum !== totalPages - 1) {
                      if (pageNum === 1 || pageNum === totalPages - 2) return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                      return null;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "w-8 h-8 p-0 text-xs font-bold rounded-lg",
                          page === pageNum ? "bg-primary shadow-md shadow-primary/20" : "bg-background hover:bg-primary/5 hover:text-primary border-border/60"
                        )}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-lg bg-background border-border/60"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual User Delete Modal */}
        <ConfirmDeleteModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
          isLoading={isDeletingUser}
          itemName={userToDelete?.fullName}
          title={t("softDeleteConfirmTitle") || "Xóa người dùng?"}
          description={t("softDeleteConfirmDesc") || "Người dùng này sẽ được chuyển vào thùng rác và có thể khôi phục sau."}
        />

        {/* Bulk User Delete Modal */}
        <ConfirmDeleteModal
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          isLoading={isBulkDeleting}
          title={t("bulkSoftDeleteTitle") || `Xóa ${selectedUserIds.size} người dùng?`}
          description={t("bulkSoftDeleteDesc") || "Các mục này sẽ được di chuyển vào danh sách đã xóa."}
        />
      </div>
    </>
  );
}
