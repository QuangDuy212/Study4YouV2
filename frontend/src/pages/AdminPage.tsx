import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminSummaryCards from "@/components/admin/AdminSummaryCards";
import AdminFilters from "@/components/admin/AdminFilters";
import { Button } from "@/components/ui/button";
import AdminTestTable, { Test } from "@/components/admin/AdminTestTable";
import ViewTestDialog from "@/components/admin/ViewTestDialog";

import { testService } from "@/services/testService";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tests, setTests] = useState<Test[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
        status: t.active ? "active" : "draft",
        createdBy: "admin",
        updatedAt: formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true }),
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
      const matchesStatus = statusFilter === "all" || test.status === statusFilter;
      return matchesSearch && matchesSkill && matchesLevel && matchesStatus;
    });
  }, [tests, searchTerm, skillFilter, levelFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);
  const paginatedTests = filteredTests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, skillFilter, levelFilter, statusFilter]);

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

  const handleDelete = async (test: Test) => {
    try {
      await testService.deleteTest(test.id);
      setTests((prev) => prev.filter((t) => t.id !== test.id));
      toast.success(t('deletedSuccess').replace('{name}', test.name));
    } catch (error) {
      toast.error(t('failedToDelete'));
    }
  };

  const handleCreateTest = () => {
    navigate("/admin/tests/create");
  };

  return (
    <>
      <div className="space-y-6">
        <AdminSummaryCards tests={tests} />
        <AdminFilters
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          skillFilter={skillFilter} onSkillFilterChange={setSkillFilter}
          levelFilter={levelFilter} onLevelFilterChange={setLevelFilter}
          statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          onCreateTest={handleCreateTest}
        />
        <AdminTestTable
          tests={paginatedTests} 
          isLoading={isLoading}
          onView={handleView} 
          onEdit={handleEdit}
          onDuplicate={handleDuplicate} 
          onArchive={handleArchive}
          onDelete={handleDelete} 
          onNavigateToEdit={handleEdit}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalCount={filteredTests.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
      <ViewTestDialog open={viewOpen} onOpenChange={setViewOpen} test={viewingTest} onEdit={handleEdit} />
    </>
  );
}
