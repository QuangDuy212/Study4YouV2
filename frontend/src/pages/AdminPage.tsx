import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import AdminSummaryCards from "@/components/admin/AdminSummaryCards";
import AdminFilters from "@/components/admin/AdminFilters";
import { Button } from "@/components/ui/button";
import AdminTestTable, { Test } from "@/components/admin/AdminTestTable";
import ViewTestDialog from "@/components/admin/ViewTestDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { testService } from "@/services/testService";
import { formatDistanceToNow } from "date-fns";
import { vi as viLocale, enUS as enLocale, zhCN as zhLocale, ja as jaLocale, ko as koLocale } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight, Plus, FileDown, Trash2, RefreshCw } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

const localeMap = {
  vi: viLocale,
  en: enLocale,
  zh: zhLocale,
  ja: jaLocale,
  ko: koLocale,
};

const ITEMS_PER_PAGE = 8;

export default function AdminPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [tests, setTests] = useState<Test[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const response = await testService.getTests(0, 100);
      const formattedTests: Test[] = response.content.map((t) => ({
        id: t.id,
        name: t.title,
        skill: (t.skill as any) || "FULL",
        level: (t.level as any) || "MEDIUM",
        duration: t.durationMinutes || 120,
        questions: 200, // Default for full test
        status: t.active ? "active" : "archived",
        createdBy: "admin",
        updatedAt: formatDistanceToNow(new Date(t.updatedAt), { 
          addSuffix: true,
          locale: localeMap[lang] || viLocale
        }),
      }));
      setTests(formattedTests);
    } catch (error) {
      toast.error(t('failedToLoad'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingTest, setViewingTest] = useState<Test | null>(null);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === "all" || test.skill === skillFilter;
      const matchesLevel = levelFilter === "all" || test.level === levelFilter;
      
      let matchesTab = true;
      if (activeTab === "ACTIVE") matchesTab = test.status === "active";
      if (activeTab === "DELETED") matchesTab = test.status === "archived";

      return matchesSearch && matchesSkill && matchesLevel && matchesTab;
    });
  }, [tests, searchTerm, skillFilter, levelFilter, activeTab]);

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);
  const paginatedTests = filteredTests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, skillFilter, levelFilter, activeTab]);

  const handleView = (test: Test) => {
    navigate(`/admin/tests/${test.id}/view`);
  };

  const handleEdit = (test: Test) => {
    navigate(`/admin/tests/${test.id}/edit`);
  };

  const handleDuplicate = (test: Test) => {
    // Currently frontend-only mock, real API might need duplicate endpoint
    const newId = crypto.randomUUID();
    const duplicated: Test = { ...test, id: newId, name: `${test.name} (Copy)`, status: "draft", updatedAt: "Just now" };
    setTests((prev) => [duplicated, ...prev]);
    toast.success(t('duplicatedSuccess').replace('{name}', test.name));
  };

  const handleArchive = async (test: Test) => {
    try {
      // Toggle active status (assuming archive = false active)
      await testService.updateTest(test.id, { title: test.name, active: false });
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, status: "archived" as const, updatedAt: "Just now" } : t)));
      toast.success(t('archivedSuccess').replace('{name}', test.name));
    } catch (error) {
      toast.error(t('failedToArchive'));
    }
  };

  const handleDeleteClick = (test: Test) => {
    setDeleteTarget(test);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await testService.updateTest(deleteTarget.id, { title: deleteTarget.name, active: false });
      toast.success("Xóa bài thi thành công");
      setDeleteTarget(null);
      fetchTests();
    } catch (error) {
      toast.error(t('failedToDelete') || "Xóa bài thi thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (test: Test) => {
    try {
      await testService.updateTest(test.id, { title: test.name, active: true });
      toast.success(`Khôi phục bài thi "${test.name}" thành công`);
      fetchTests();
    } catch (error) {
      toast.error("Khôi phục bài thi thất bại");
    }
  };

  const toggleSelectAll = () => {
    if (paginatedTests.length === 0) return;
    const allSelected = paginatedTests.every(t => selectedIds.has(t.id));
    const next = new Set(selectedIds);
    if (allSelected) {
      paginatedTests.forEach(t => next.delete(t.id));
    } else {
      paginatedTests.forEach(t => next.add(t.id));
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
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        const test = tests.find(t => t.id === id);
        if (test) {
          await testService.updateTest(id, { title: test.name, active: false });
        }
      }));
      toast.success("Xóa các bài thi thành công");
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchTests();
    } catch (error) {
      toast.error("Xóa các bài thi thất bại");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn khôi phục ${selectedIds.size} bài thi đã chọn?`)) return;
    setIsLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        const test = tests.find(t => t.id === id);
        if (test) {
          await testService.updateTest(id, { title: test.name, active: true });
        }
      }));
      toast.success("Khôi phục các bài thi thành công");
      setSelectedIds(new Set());
      fetchTests();
    } catch (error) {
      toast.error("Khôi phục các bài thi thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTest = () => {
    navigate("/admin/tests/create");
  };

  const handleExportPayments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/payments/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payments_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('reportReady'));
    } catch (error) {
      toast.error(t('failedToLoad'));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <AdminSummaryCards tests={tests} />
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>{t("testManagementTitle") || "Quản lý Bài kiểm tra"}</CardTitle>
            <CardDescription>{t("testManagementDesc") || "Tạo, quản lý và sắp xếp tất cả các bài thi thử TOEIC"}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={handleCreateTest} className="gap-2 rounded-lg h-11 px-5 font-bold">
              <Plus className="w-4 h-4" />
              {t("createNewTest") || "Tạo bài thi mới"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminFilters
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            skillFilter={skillFilter} onSkillFilterChange={setSkillFilter}
            levelFilter={levelFilter} onLevelFilterChange={setLevelFilter}
            activeTab={activeTab} onActiveTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            onCreateTest={handleCreateTest}
          />

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && activeTab !== "ALL" && (
            <div className="flex items-center justify-between p-4 bg-primary/[0.03] border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">Đã chọn {selectedIds.size} bài thi</span>
              </div>
              <div className="flex gap-2">
                {activeTab !== "DELETED" && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setBulkDeleteOpen(true)}
                    className="rounded-lg font-bold shadow-sm h-9 px-4"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Xóa nhiều
                  </Button>
                )}
                {activeTab !== "ACTIVE" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBulkRestore}
                    className="rounded-lg font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all shadow-sm h-9 px-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Khôi phục nhiều
                  </Button>
                )}
              </div>
            </div>
          )}

          <AdminTestTable
            tests={paginatedTests} 
            isLoading={isLoading}
            onView={handleView} 
            onEdit={handleEdit}
            onDuplicate={handleDuplicate} 
            onArchive={handleArchive}
            onDelete={handleDeleteClick} 
            onRestore={handleRestore} 
            onNavigateToEdit={handleEdit}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={filteredTests.length}
            itemsPerPage={ITEMS_PER_PAGE}
            selectedIds={selectedIds}
            onSelectAll={toggleSelectAll}
            onSelectOne={toggleSelectOne}
            activeTab={activeTab}
          />
        </CardContent>
      </Card>
      <ViewTestDialog open={viewOpen} onOpenChange={setViewOpen} test={viewingTest} onEdit={handleEdit} />

      {/* Single Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        itemName={deleteTarget?.name}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={isBulkDeleting}
        title={`Xác nhận xóa ${selectedIds.size} bài thi?`}
        description={`Bạn có chắc chắn muốn xóa toàn bộ ${selectedIds.size} bài thi đã được lựa chọn không? Bạn có thể khôi phục chúng trong tab Lưu trữ.`}
      />
    </div>
  );
}
