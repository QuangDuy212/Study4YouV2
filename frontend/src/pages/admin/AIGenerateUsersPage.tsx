import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, RotateCcw, Pencil, Trash2, Save, ArrowLeft, Check, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import aiService, { type GeneratedUserResponse } from "@/services/aiService";
import userService from "@/services/userService";
import roleService, { type RoleResponse } from "@/services/roleService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AIGenerateUsersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [count, setCount] = useState(5);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedUsers, setGeneratedUsers] = useState<GeneratedUserResponse[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<GeneratedUserResponse | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await roleService.getRoles(0, 50);
        setRoles(data.content);
        if (data.content.length > 0) {
          // Default to first non-admin role if possible or just first
          const studentRole = data.content.find(r => r.name.toLowerCase().includes("student"));
          setSelectedRole(studentRole?.id || data.content[0].id);
        }
      } catch (err) {
        toast.error(t('failedToLoadRoles'));
      }
    };
    fetchRoles();
  }, []);

  const handleGenerate = async () => {
    if (!selectedRole) {
      toast.error(t('pleaseSelectRole'));
      return;
    }

    setIsGenerating(true);
    setGeneratedUsers([]);

    try {
      const data = await aiService.generateUsers(count, selectedRole, selectedStatus);
      setGeneratedUsers(data);
      toast.success(t('usersGeneratedSuccess').replace('{count}', String(data.length)));
    } catch (err: any) {
      toast.error(t('failedToGenerateUsers'), {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCount(5);
    setGeneratedUsers([]);
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...generatedUsers[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...generatedUsers];
      updated[editingIndex] = editForm;
      setGeneratedUsers(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleDeleteRow = (index: number) => {
    setGeneratedUsers((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleSaveAll = async () => {
    if (generatedUsers.length === 0) return;
    if (generatedUsers.length > 10) {
      setConfirmSaveOpen(true);
      return;
    }
    await executeSave();
  };

  const executeSave = async () => {
    setConfirmSaveOpen(false);
    setIsSaving(true);

    try {
      // Sequential save since backend lacks bulk-create
      let successCount = 0;
      for (const user of generatedUsers) {
        try {
          await userService.createUser({
            email: user.email,
            fullName: user.name,
            password: user.password || "123456",
            status: user.status,
            roleIds: [user.roleId]
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to create user ${user.email}`, e);
        }
      }

      toast.success(t('usersCreatedSuccess').replace('{success}', String(successCount)).replace('{total}', String(generatedUsers.length)));
      navigate("/admin/users");
    } catch (err: any) {
      toast.error(t('failedToSaveUsers'), {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || t("unknown");
  };

  const getRoleBadgeClass = (roleId: string) => {
    const name = getRoleName(roleId).toLowerCase();
    if (name.includes("admin")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (name.includes("teacher")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (name.includes("student")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <AdminLayout pageTitle={t('aiGenerateUsers')} pageDescription={t('aiGenerateUsersDesc')}>
      <div className="space-y-6 w-full">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="w-4 h-4" /> {t('backToUsers')}
        </Button>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              {t('aiGenerationForm')}
            </CardTitle>
            <CardDescription>
              {t('configureParams')}
            </CardDescription>

          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>{t('numberOfUsers')} ({t('max')} 20)</Label>
                <Input 

                  type="number" 
                  min={1} 
                  max={20} 
                  value={count} 
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('role')}</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isGenerating}>
                  <SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('status')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isGenerating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('active')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
                    <SelectItem value="BANNED">{t('banned')}</SelectItem>
                  </SelectContent>

                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating || !selectedRole} className="gap-2">
                {isGenerating ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> {t('generating')}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {t('generateUsersAI')}</>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isGenerating} className="gap-2">
                <RotateCcw className="w-4 h-4" /> {t('reset')}
              </Button>
            </div>

          </CardContent>
        </Card>

        {generatedUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('generatedUsersPreview')}</CardTitle>
              <CardDescription>
                {t('reviewGeneratedUsers')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>{t('fullName')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead className="w-[150px]">{t('role')}</TableHead>
                      <TableHead className="w-[120px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {generatedUsers.map((user, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>

                        {editingIndex === idx && editForm ? (
                          <>
                            <TableCell>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Select value={editForm.roleId} onValueChange={(v) => setEditForm({ ...editForm, roleId: v })}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-sm font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getRoleBadgeClass(user.roleId) + " text-xs"}>
                                {getRoleName(user.roleId)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(idx)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteRow(idx)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {generatedUsers.length > 0 && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/admin/users")} disabled={isSaving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveAll} disabled={isSaving || generatedUsers.length === 0} className="gap-2">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
              ) : (
                <><Save className="w-4 h-4" /> {t('saveAllUsers')} ({generatedUsers.length})</>
              )}
            </Button>
          </div>
        )}

      </div>

      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmBulkSave')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkSaveConfirmDesc')?.replace('{count}', String(generatedUsers.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={executeSave}>{t('continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
}
