import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import questionService, { type ToeicQuestionResponse } from "@/services/questionService";
import partService, { type ToeicPartResponse } from "@/services/partService";
import {
  Search, Plus, Pencil, Trash2, BookOpen, Headphones,
  AlertTriangle, Filter, HelpCircle, Sparkles,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { LISTENING_PARTS } from "@/components/admin/test-editor/types";

const ITEMS_PER_PAGE = 8;

const getSkillFromPart = (part: string) => {
  return LISTENING_PARTS.includes(part as any) ? "listening" : "reading";
};

const getSkillIcon = (skill: string) => {
  return skill === "reading"
    ? <BookOpen className="w-4 h-4" />
    : <Headphones className="w-4 h-4" />;
};

const getDifficultyBadge = (difficulty: string) => {
  const map: Record<string, string> = {
    EASY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    HARD: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return <Badge className={`${map[difficulty] || ""} hover:opacity-90`}>{difficulty || "N/A"}</Badge>;
};

export default function QuestionBankPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ToeicQuestionResponse[]>([]);
  const [partsMap, setPartsMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [partFilter, setPartFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<ToeicQuestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Load parts first if not loaded
      if (Object.keys(partsMap).length === 0) {
        const partsData = await partService.getParts(0, 100);
        const pMap: Record<string, string> = {};
        partsData.content.forEach(p => {
          pMap[p.id] = p.part; // e.g. "PART_1"
        });
        setPartsMap(pMap);

      }

      const data = await questionService.getQuestions(
        currentPage - 1, 
        ITEMS_PER_PAGE, 
        "createdAt", 
        "DESC",
        partFilter,
        levelFilter
      );
      setQuestions(data.content);
      setTotalCount(data.totalElements);
    } catch (error: any) {
      toast.error(t("failedToLoadQuestions"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, partFilter, levelFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    setSelectedQuestions(checked ? questions.map((q) => q.id) : []);
  };

  const handleSelectQuestion = (id: string, checked: boolean) => {
    setSelectedQuestions(checked ? [...selectedQuestions, id] : selectedQuestions.filter((qId) => qId !== id));
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedQuestions.map(id => questionService.deleteQuestion(id)));
      toast.success(t("deletedCountQuestions").replace("{count}", String(selectedQuestions.length)));
      setSelectedQuestions([]);
      fetchQuestions();
    } catch (error) {
      toast.error(t("failedToDeleteQuestions"));
    }
  };

  const handleDelete = (question: ToeicQuestionResponse) => { setQuestionToDelete(question); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (questionToDelete) {
      try {
        await questionService.deleteQuestion(questionToDelete.id);
        toast.success(t("deletedSuccessShort"));
        fetchQuestions();
      } catch (error) {
        toast.error(t("failedToDeleteQuestions"));
      }
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t("justNow");
    if (hours < 24) return t("hoursAgo").replace("{count}", String(hours));
    const days = Math.floor(hours / 24);
    if (days < 7) return t("daysAgo").replace("{count}", String(days));
    return d.toLocaleDateString();
  };

  return (
    <AdminLayout pageTitle={t('questionBank')} pageDescription={t('questionBankDesc')}>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('searchByContent')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={partFilter} onValueChange={(v) => { setPartFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder={t("selectPart")} /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">{t('allParts')}</SelectItem>
                     <SelectItem value="PART_1">{t('part1Desc')}</SelectItem>
                     <SelectItem value="PART_2">{t('part2Desc')}</SelectItem>
                     <SelectItem value="PART_3">{t('part3Desc')}</SelectItem>
                     <SelectItem value="PART_4">{t('part4Desc')}</SelectItem>
                     <SelectItem value="PART_5">{t('part5Desc')}</SelectItem>
                     <SelectItem value="PART_6">{t('part6Desc')}</SelectItem>
                     <SelectItem value="PART_7">{t('part7Desc')}</SelectItem>

                   </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={t("selectLevel")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allLevels')}</SelectItem>
                    <SelectItem value="EASY">{t('levelEasy')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('levelMedium')}</SelectItem>
                    <SelectItem value="HARD">{t('levelHard')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/questions/ai-generate")}>
                  <Sparkles className="w-4 h-4" /> {t('aiGeneration')}
                </Button>

                <Button className="gap-2" onClick={() => navigate("/admin/questions/create")}>
                  <Plus className="w-4 h-4" />{t('addQuestion')}
                </Button>
              </div>
            </div>
            {selectedQuestions.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex items-center gap-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{selectedQuestions.length} {t('selected')}</span>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="w-4 h-4 mr-2" />{t('delete')}</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">{t('showing')} {totalCount} {t('questions')}</div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('noQuestionsFound')}</h3>
                <p className="text-muted-foreground max-w-sm">{t('noQuestionsHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]"><Checkbox checked={selectedQuestions.length === questions.length && questions.length > 0} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} /></TableHead>
                      <TableHead className="min-w-[300px]">{t('questionPreview')}</TableHead>
                      <TableHead className="w-[120px]">{t('part')}</TableHead>
                      <TableHead className="w-[100px]">{t('skill')}</TableHead>

                      <TableHead className="w-[120px]">{t('difficulty')}</TableHead>
                      <TableHead className="w-[80px]">{t('answer')}</TableHead>
                      <TableHead className="w-[120px]">{t('updated')}</TableHead>
                      <TableHead className="w-[120px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => {
                      const partType = partsMap[question.partId] || "Unknown";
                      const skill = getSkillFromPart(partType);
                      return (
                        <TableRow key={question.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell><Checkbox checked={selectedQuestions.includes(question.id)} onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)} /></TableCell>
                          <TableCell><p className="text-sm font-medium text-foreground truncate max-w-[300px]">{question.content || t("empty")}</p></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs font-mono">{partType}</Badge></TableCell>
                          <TableCell><div className="flex items-center gap-2">{getSkillIcon(skill)}<span className="capitalize text-sm">{t(skill as any)}</span></div></TableCell>
                          <TableCell>{getDifficultyBadge(question.level)}</TableCell>

                          <TableCell><span className="font-mono text-sm font-semibold">{question.correctAnswer}</span></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground">{formatDate(question.updatedAt)}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/questions/${question.id}/edit`)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(question)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />{t('deleteQuestion')}</DialogTitle>
              <DialogDescription>{t('deleteQuestionConfirm')}</DialogDescription>
            </DialogHeader>
            {questionToDelete && (
              <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-foreground">{questionToDelete.content}</p></div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>{t('cancel')}</Button>
              <Button variant="destructive" onClick={confirmDelete}>{t('delete')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
