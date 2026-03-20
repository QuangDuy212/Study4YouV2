import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Headphones,
  Eye,
  Pencil,
  Copy,
  Archive,
  MoreHorizontal,
  AlertCircle,
  FileText,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Test {
  id: string;
  name: string;
  skill: "LISTENING" | "READING" | "FULL";
  level: "EASY" | "MEDIUM" | "HARD";
  duration: number;
  questions: number;
  status: "active" | "draft" | "archived";
  createdBy: string;
  updatedAt: string;
}

interface AdminTestTableProps {
  tests: Test[];
  isLoading?: boolean;
  onView: (test: Test) => void;
  onEdit: (test: Test) => void;
  onDuplicate: (test: Test) => void;
  onArchive: (test: Test) => void;
  onDelete?: (test: Test) => void;
  onNavigateToEdit?: (test: Test) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
  itemsPerPage?: number;
}

const skillConfig: Record<string, { icon: any; color: string; bg: string }> = {
  LISTENING: { icon: Headphones, color: "text-purple-600", bg: "bg-purple-500/10" },
  READING: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
  FULL: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const levelConfig = {
  EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  HARD: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusConfig = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-warning/10 text-warning border-warning/20",
  archived: "bg-muted text-muted-foreground border-border",
};

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        {t('noResultsFound')}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {t('noTestsFoundFilter')}
      </p>
    </motion.div>
  );
}

export default function AdminTestTable({
  tests, 
  isLoading = false, 
  onView, 
  onEdit, 
  onDuplicate, 
  onArchive, 
  onDelete, 
  onNavigateToEdit,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalCount = 0,
  itemsPerPage = 10,
}: AdminTestTableProps) {
  const { t } = useLanguage();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const handleArchiveClick = (test: Test) => {
    setSelectedTest(test);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    if (selectedTest) onArchive(selectedTest);
    setArchiveDialogOpen(false);
    setSelectedTest(null);
  };

  const handleDeleteClick = (test: Test) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTest && onDelete) onDelete(selectedTest);
    setDeleteDialogOpen(false);
    setSelectedTest(null);
  };

  if (isLoading) return <Card><CardContent className="p-0"><TableSkeleton /></CardContent></Card>;
  if (tests.length === 0) return <Card><CardContent className="p-0"><EmptyState /></CardContent></Card>;

  return (
    <TooltipProvider>
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-[280px]">{t('testName')}</TableHead>
                <TableHead className="w-[100px]">{t('skill')}</TableHead>
                <TableHead className="w-[100px]">{t('level')}</TableHead>
                <TableHead className="w-[80px]">{t('duration')}</TableHead>
                <TableHead className="w-[80px]">{t('questions')}</TableHead>
                <TableHead className="w-[100px]">{t('status')}</TableHead>
                <TableHead className="w-[120px]">{t('lastUpdated')}</TableHead>
                <TableHead className="w-[120px] text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {tests.map((test, index) => {
                  const skill = skillConfig[test.skill];
                  const SkillIcon = skill.icon;
                  return (
                    <motion.tr
                      key={test.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn("border-b transition-colors hover:bg-muted/30", index % 2 === 0 ? "bg-transparent" : "bg-muted/10")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", skill.bg)}>
                            <SkillIcon className={cn("w-4 h-4", skill.color)} />
                          </div>
                          <p className="font-medium text-foreground">{test.name}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="capitalize text-sm">{test.skill}</span></TableCell>
                      <TableCell><Badge className={cn("capitalize", levelConfig[test.level])}>{test.level}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{test.duration} {t('minutes')}</TableCell>
                      <TableCell className="text-muted-foreground">{test.questions}</TableCell>
                      <TableCell><Badge className={cn("capitalize", statusConfig[test.status])}>{t(test.status)}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{test.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(test)}><Eye className="w-4 h-4" /></Button></TooltipTrigger>
                            <TooltipContent className="bg-card border border-border">{t('view')}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(test)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger>
                            <TooltipContent className="bg-card border border-border">{t('edit')}</TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border">
                              <DropdownMenuItem onClick={() => onDuplicate(test)} className="gap-2"><Copy className="w-4 h-4" />{t('duplicate')}</DropdownMenuItem>
                              {onNavigateToEdit && (
                                <DropdownMenuItem onClick={() => onNavigateToEdit(test)} className="gap-2"><ExternalLink className="w-4 h-4" />{t('openEditor')}</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchiveClick(test)} className="gap-2 text-destructive focus:text-destructive"><Archive className="w-4 h-4" />{t('archive')}</DropdownMenuItem>
                              {onDelete && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(test)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />{t('delete')}</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              {t('showing')} {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalCount)} {t('of')} {totalCount} {t('tests').toLowerCase()}
            </div>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => onPageChange?.(currentPage - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <div key={p} className="flex gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 self-center text-muted-foreground">...</span>}
                    <Button 
                      key={p}
                      variant={p === currentPage ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => onPageChange?.(p)} 
                      className="w-8 h-8 p-0 font-medium"
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => onPageChange?.(currentPage + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {tests.map((test, index) => {
          const skill = skillConfig[test.skill];
          const SkillIcon = skill.icon;
          return (
            <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", skill.bg)}>
                        <SkillIcon className={cn("w-5 h-5", skill.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{test.name}</p>
                        <Badge className={cn("capitalize text-xs mt-1", statusConfig[test.status])}>{test.status}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="bg-card border border-border">
                         <DropdownMenuItem onClick={() => onView(test)} className="gap-2"><Eye className="w-4 h-4" />{t('view')}</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onEdit(test)} className="gap-2"><Pencil className="w-4 h-4" />{t('edit')}</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDuplicate(test)} className="gap-2"><Copy className="w-4 h-4" />{t('duplicate')}</DropdownMenuItem>
                         {onNavigateToEdit && (
                           <DropdownMenuItem onClick={() => onNavigateToEdit(test)} className="gap-2"><ExternalLink className="w-4 h-4" />{t('openEditor')}</DropdownMenuItem>
                         )}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => handleArchiveClick(test)} className="gap-2 text-destructive focus:text-destructive"><Archive className="w-4 h-4" />{t('archive')}</DropdownMenuItem>
                         {onDelete && (
                           <DropdownMenuItem onClick={() => handleDeleteClick(test)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />{t('delete')}</DropdownMenuItem>
                         )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground text-xs mb-0.5">{t('level')}</p><Badge className={cn("capitalize text-xs", levelConfig[test.level])}>{test.level}</Badge></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">{t('duration')}</p><p className="font-medium">{test.duration} {t('minutes')}</p></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">{t('questions')}</p><p className="font-medium">{test.questions}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{t('updated')} {test.updatedAt}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-4 items-center py-4">
             <div className="text-xs text-muted-foreground">
              {t('showing')} {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalCount)} {t('of')} {totalCount} {t('tests').toLowerCase()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange?.(currentPage - 1)} className="h-9 px-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('back')}
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange?.(currentPage + 1)} className="h-9 px-4">
                {t('next')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-destructive" />{t('archiveTest')}</AlertDialogTitle>
            <AlertDialogDescription>{t('archiveTestConfirm').replace('{name}', selectedTest?.name || '')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('archive')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="w-5 h-5 text-destructive" />{t('deleteTest')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteTestConfirm').replace('{name}', selectedTest?.name || '')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
