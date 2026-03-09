import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import userService, { type UserResponse } from "@/services/userService";
import {
  Search, Eye, UserX, UserCheck, User, Mail, Calendar, Award, BookOpen, Filter,
  Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
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
      toast.error("Failed to load users");
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
    const newStatus = user.status.toLowerCase() === "active" ? "DISABLED" : "ACTIVE";
    try {
      await userService.updateUser(user.id, { 
        fullName: user.fullName,
        status: newStatus 
      });
      toast.success(`User ${user.fullName} has been ${newStatus.toLowerCase()}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update status");
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
        toast.success(`User "${userToDelete.fullName}" deleted`);
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
      setDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <AdminLayout pageTitle={t('usersManagement')} pageDescription={t('usersManagementDesc')}>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/users/ai-generate")}>
                  <Sparkles className="w-4 h-4" /> AI Generate Users
                </Button>
                <Button className="gap-2" onClick={() => navigate("/admin/users/create")}>
                  <Plus className="w-4 h-4" /> Create User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">Showing {filteredUsers.length} users</div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : paginatedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><User className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground max-w-sm">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="w-[160px]">Roles</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Registered</TableHead>
                      <TableHead className="w-[140px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatarUrl || ""} />
                               <AvatarFallback className="bg-primary/10 text-primary font-medium">{user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                             </Avatar>
                             <div>
                               <p className="font-medium text-foreground">{user.fullName || "(no name)"}</p>
                               <p className="text-sm text-muted-foreground">{user.email}</p>
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-wrap gap-1">
                             {user.roles.length > 0 ? user.roles.map((role) => (
                               <Badge key={role.id} variant="secondary" className="text-xs capitalize">{role.name}</Badge>
                             )) : <span className="text-xs text-muted-foreground">No roles</span>}
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge className={user.status.toLowerCase() === "active"
                             ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                             : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                           }>{user.status}</Badge>
                         </TableCell>
                         <TableCell><span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span></TableCell>
                         <TableCell>
                           <div className="flex items-center justify-end gap-1">
                             <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${user.id}/edit`)}><Pencil className="w-4 h-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} className={user.status.toLowerCase() === "active" ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}>
                               {user.status.toLowerCase() === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                             </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user)}>
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
 
             {totalPages > 1 && (
               <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                 <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
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
               <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Delete User</DialogTitle>
               <DialogDescription>Are you sure you want to delete "{userToDelete?.fullName}"? This action cannot be undone.</DialogDescription>
             </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
