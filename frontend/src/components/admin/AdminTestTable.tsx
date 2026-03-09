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

export interface Test {
  id: number;
  name: string;
  skill: "listening" | "reading";
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  questions: number;
  status: "active" | "draft" | "archived";
  createdBy: "admin";
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
}

const skillConfig = {
  listening: { icon: Headphones, color: "text-purple-600", bg: "bg-purple-500/10" },
  reading: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
};

const levelConfig = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
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
        No tests found
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        There are no tests matching your current filters. Try adjusting your search or create a new test.
      </p>
    </motion.div>
  );
}

export default function AdminTestTable({
  tests, isLoading = false, onView, onEdit, onDuplicate, onArchive, onDelete, onNavigateToEdit,
}: AdminTestTableProps) {
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
                <TableHead className="w-[280px]">Test Name</TableHead>
                <TableHead className="w-[100px]">Skill</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
                <TableHead className="w-[80px]">Questions</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Last Updated</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                      <TableCell className="text-muted-foreground">{test.duration} min</TableCell>
                      <TableCell className="text-muted-foreground">{test.questions}</TableCell>
                      <TableCell><Badge className={cn("capitalize", statusConfig[test.status])}>{test.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{test.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(test)}><Eye className="w-4 h-4" /></Button></TooltipTrigger>
                            <TooltipContent className="bg-card border border-border">View</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(test)}><Pencil className="w-4 h-4" /></Button></TooltipTrigger>
                            <TooltipContent className="bg-card border border-border">Edit</TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border">
                              <DropdownMenuItem onClick={() => onDuplicate(test)} className="gap-2"><Copy className="w-4 h-4" />Duplicate</DropdownMenuItem>
                              {onNavigateToEdit && (
                                <DropdownMenuItem onClick={() => onNavigateToEdit(test)} className="gap-2"><ExternalLink className="w-4 h-4" />Open Editor</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchiveClick(test)} className="gap-2 text-destructive focus:text-destructive"><Archive className="w-4 h-4" />Archive</DropdownMenuItem>
                              {onDelete && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(test)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
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
                         <DropdownMenuItem onClick={() => onView(test)} className="gap-2"><Eye className="w-4 h-4" />View</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onEdit(test)} className="gap-2"><Pencil className="w-4 h-4" />Edit</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDuplicate(test)} className="gap-2"><Copy className="w-4 h-4" />Duplicate</DropdownMenuItem>
                         {onNavigateToEdit && (
                           <DropdownMenuItem onClick={() => onNavigateToEdit(test)} className="gap-2"><ExternalLink className="w-4 h-4" />Open Editor</DropdownMenuItem>
                         )}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => handleArchiveClick(test)} className="gap-2 text-destructive focus:text-destructive"><Archive className="w-4 h-4" />Archive</DropdownMenuItem>
                         {onDelete && (
                           <DropdownMenuItem onClick={() => handleDeleteClick(test)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                         )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground text-xs mb-0.5">Level</p><Badge className={cn("capitalize text-xs", levelConfig[test.level])}>{test.level}</Badge></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">Duration</p><p className="font-medium">{test.duration} min</p></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">Questions</p><p className="font-medium">{test.questions}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Updated {test.updatedAt}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-destructive" />Archive Test</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to archive "{selectedTest?.name}"? This test will be moved to the archive and won't be visible to users.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="w-5 h-5 text-destructive" />Delete Test</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to permanently delete "{selectedTest?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
