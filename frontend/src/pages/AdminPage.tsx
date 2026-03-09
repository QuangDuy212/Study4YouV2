import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSummaryCards from "@/components/admin/AdminSummaryCards";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminTestTable, { Test } from "@/components/admin/AdminTestTable";
import ViewTestDialog from "@/components/admin/ViewTestDialog";

const initialTests: Test[] = [
  { id: 1, name: "TOEIC Reading - Climate Change", skill: "reading", level: "intermediate", duration: 60, questions: 40, status: "active", createdBy: "admin", updatedAt: "2 hours ago" },
  { id: 2, name: "TOEIC Listening - Business English", skill: "listening", level: "advanced", duration: 45, questions: 30, status: "active", createdBy: "admin", updatedAt: "5 hours ago" },
  { id: 4, name: "TOEIC Listening - University Lecture", skill: "listening", level: "advanced", duration: 40, questions: 25, status: "draft", createdBy: "admin", updatedAt: "2 days ago" },
  { id: 5, name: "TOEIC Reading - Technology Article", skill: "reading", level: "intermediate", duration: 30, questions: 20, status: "active", createdBy: "admin", updatedAt: "3 days ago" },
  { id: 7, name: "TOEIC Listening - News Report", skill: "listening", level: "beginner", duration: 25, questions: 15, status: "active", createdBy: "admin", updatedAt: "5 days ago" },
  { id: 8, name: "TOEIC Reading - Academic Essay", skill: "reading", level: "advanced", duration: 50, questions: 35, status: "archived", createdBy: "admin", updatedAt: "1 week ago" },
  { id: 10, name: "TOEIC Reading - Scientific Research", skill: "reading", level: "advanced", duration: 55, questions: 38, status: "draft", createdBy: "admin", updatedAt: "2 weeks ago" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading] = useState(false);

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

  const handleView = (test: Test) => {
    navigate(`/admin/tests/${test.id}/view`);
  };

  const handleEdit = (test: Test) => {
    navigate(`/admin/tests/${test.id}/edit`);
  };

  const handleDuplicate = (test: Test) => {
    const newId = Math.max(...tests.map((t) => t.id)) + 1;
    const duplicated: Test = { ...test, id: newId, name: `${test.name} (Copy)`, status: "draft", updatedAt: "Just now" };
    setTests((prev) => [duplicated, ...prev]);
    toast.success(`Duplicated: ${test.name}`);
  };

  const handleArchive = (test: Test) => {
    setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, status: "archived" as const, updatedAt: "Just now" } : t)));
    toast.success(`Archived: ${test.name}`);
  };

  const handleDelete = (test: Test) => {
    setTests((prev) => prev.filter((t) => t.id !== test.id));
    toast.success(`Deleted: ${test.name}`);
  };

  const handleCreateTest = () => {
    navigate("/admin/tests/create");
  };

  return (
    <AdminLayout pageTitle="Test Management" pageDescription="Create, manage, and organize all TOEIC practice tests">
      <div className="space-y-6">
        <AdminSummaryCards />
        <AdminFilters
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          skillFilter={skillFilter} onSkillFilterChange={setSkillFilter}
          levelFilter={levelFilter} onLevelFilterChange={setLevelFilter}
          statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          onCreateTest={handleCreateTest}
        />
        <div className="text-sm text-muted-foreground">
          Showing {filteredTests.length} of {tests.length} tests
        </div>
        <AdminTestTable
          tests={filteredTests} isLoading={isLoading}
          onView={handleView} onEdit={handleEdit}
          onDuplicate={handleDuplicate} onArchive={handleArchive}
          onDelete={handleDelete} onNavigateToEdit={handleEdit}
        />
      </div>
      <ViewTestDialog open={viewOpen} onOpenChange={setViewOpen} test={viewingTest} onEdit={handleEdit} />
    </AdminLayout>
  );
}
