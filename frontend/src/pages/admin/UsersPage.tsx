import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import userService, { type UserResponse } from "@/services/userService";
import {
  Search, Eye, UserX, UserCheck, User, Mail, Calendar, Award, BookOpen, Filter,
  Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
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


const ITEMS_PER_PAGE = 8;

export default function UsersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetching first 100 users for local filtering/pagination to match existing UI logic
      // In a real large app, we'd use server-side search/filter
      const data = await userService.getUsers(0, 100);
      setUsers(data.content);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(t("failedToLoad") || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await userService.deleteUser(userToDelete.id);
        toast.success(t("userDeleted").replace("{name}", userToDelete.fullName));
        fetchUsers();
      } catch (error) {
        toast.error(t("failedToDelete") || "Failed to delete user");
      }
      setDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <AdminLayout pageTitle={t('usersManagement')} pageDescription={t('usersManagementDesc')}>
      <div className="space-y-3 sm:space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('searchByNameEmail')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={t("status")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatus')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>

                </Select>
                <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/users/ai-generate")}>
                  <Sparkles className="w-4 h-4" /> {t('aiGenerateUsers')}
                </Button>
                <Button className="gap-2" onClick={() => navigate("/admin/users/create")}>
                  <Plus className="w-4 h-4" /> {t('createUser')}
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">{t('showingUsers').replace('{count}', String(filteredUsers.length))}</div>

        <Card>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><User className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('noUsersFound')}</h3>
                <p className="text-muted-foreground max-w-sm">{t('noUsersHint')}</p>
              </div>

            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-border/50">
                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('user')}</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('roles')}</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('status')}</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('registered')}</TableHead>
                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>

                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id} className="group hover:bg-primary/[0.02] transition-colors border-b border-border/50">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group/avatar">
                                <Avatar className="w-10 h-10 border border-border/50 transition-all group-hover/avatar:border-primary/30">
                                  <AvatarImage src={user.avatarUrl || ""} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-xs">
                                    {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {user.status.toLowerCase() === "active" && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{user.fullName || t("noName")}</p>
                                <p className="text-[12px] text-muted-foreground font-medium">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles.length > 0 ? user.roles.map((role) => (
                                <Badge key={role.id} variant="secondary" className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight bg-secondary/50 text-secondary-foreground border-none">
                                  {role.name.replace("ROLE_", "")}
                                </Badge>
                              )) : <span className="text-xs text-muted-foreground italic">{t('noRoles')}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "pl-1.5 pr-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none flex items-center gap-1.5 w-fit",
                              user.status.toLowerCase() === "active"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : user.status.toLowerCase() === "banned"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                user.status.toLowerCase() === "active" ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" : 
                                user.status.toLowerCase() === "banned" ? "bg-rose-500" : "bg-zinc-400"
                              )} />
                              {t(user.status.toLowerCase() as any) || user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className={cn(
                                "h-8 w-8",
                                user.status.toLowerCase() === "active" ? "text-orange-500 hover:bg-orange-50/50" : "text-emerald-500 hover:bg-emerald-50/50"
                              )} onClick={() => handleToggleStatus(user)}>
                                {user.status.toLowerCase() === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50/50" onClick={() => handleDeleteUser(user)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
               </div>
             )}
 
             {totalPages > 1 && (
               <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                 <span className="text-sm text-muted-foreground">{t('page')} {currentPage} {t('of')} {totalPages}</span>
                 <div className="flex gap-1">

                   <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                     <ChevronLeft className="w-4 h-4" />
                   </Button>
                   {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                     <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(p)} className="w-8">{p}</Button>
                   ))}
                   <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                     <ChevronRight className="w-4 h-4" />
                   </Button>
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
 
         <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> {t('deleteUser')}</DialogTitle>
               <DialogDescription>{t('deleteUserConfirm').replace('{name}', userToDelete?.fullName || '')}</DialogDescription>
             </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('cancel')}</Button>
              <Button variant="destructive" onClick={confirmDelete}>{t('delete')}</Button>
            </DialogFooter>
          </DialogContent>

        </Dialog>
      </div>
    </AdminLayout>
  );
}
