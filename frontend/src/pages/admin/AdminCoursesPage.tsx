import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Video, Eye, Loader2, RefreshCw, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import courseService, { type CourseResponse, type PageResponse } from "@/services/courseService";
import { getMediaUrl } from "@/lib/utils";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export default function AdminCoursesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PageResponse<CourseResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filteredCourses = useMemo(() => {
    if (!courses?.content) return [];
    return courses.content.filter((course) => {
      const matchesKeyword = course.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (course.description?.toLowerCase() || "").includes(keyword.toLowerCase());
      
      if (activeTab === "ACTIVE") return matchesKeyword && course.status !== "DELETED";
      if (activeTab === "DELETED") return matchesKeyword && course.status === "DELETED";
      return matchesKeyword;
    });
  }, [courses, keyword, activeTab]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getAllCoursesAdmin(page, 5);
      setCourses(data);
    } catch (error) {
      toast.error("Failed to load courses");
      setCourses({ content: [], totalElements: 0, totalPages: 0, pageSize: 5, pageNumber: 0, last: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page]);

  // Reset selection when tab or page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCourses();
  };

  const handlePublish = async (id: string, title: string) => {
    try {
      await courseService.publishCourse(id);
      toast.success(`Khóa học "${title}" đã được công khai!`);
      fetchCourses();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Không thể công khai khóa học");
    }
  };

  const handleDelete = (id: string, title: string) => {
    setCourseToDelete({ id, title });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeletingCourse(true);
    try {
      await courseService.deleteCourse(courseToDelete.id);
      toast.success("Course deleted successfully");
      fetchCourses();
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete course");
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handleRestore = async (id: string, title: string) => {
    try {
      await courseService.restoreCourse(id);
      toast.success(`Course "${title}" restored successfully`);
      fetchCourses();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to restore course");
    }
  };

  const toggleSelectAll = () => {
    if (filteredCourses.length === 0) return;
    const allSelected = filteredCourses.every(c => selectedIds.has(c.id));
    const next = new Set(selectedIds);
    if (allSelected) {
      filteredCourses.forEach(c => next.delete(c.id));
    } else {
      filteredCourses.forEach(c => next.add(c.id));
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
      await Promise.all(Array.from(selectedIds).map(id => courseService.deleteCourse(id)));
      toast.success("Selected courses deleted successfully");
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchCourses();
    } catch (e: any) {
      toast.error("Failed to delete some selected courses");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    if (!window.confirm(`Are you sure you want to restore ${selectedIds.size} selected courses?`)) return;
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => courseService.restoreCourse(id)));
      toast.success("Selected courses restored successfully");
      setSelectedIds(new Set());
      fetchCourses();
    } catch (e: any) {
      toast.error("Failed to restore some selected courses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchCourses")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-11 rounded-xl px-5 font-bold">{t("search")}</Button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                {(["ALL", "ACTIVE", "DELETED"] as const).map((tab) => (
                  <Button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setPage(0);
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
              <Button asChild className="gap-2 shrink-0 shadow-lg shadow-primary/20">
                <Link to="/admin/courses/create">
                  <Plus className="w-4 h-4" />
                  {t("createCourse")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-4 mb-6 bg-primary/[0.03] border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">Đã chọn {selectedIds.size} khóa học</span>
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

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input 
                        type="checkbox" 
                        checked={filteredCourses.length > 0 && filteredCourses.every(c => selectedIds.has(c.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>{t("courses")}</TableHead>
                    <TableHead>{t("price")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className={selectedIds.has(course.id) ? "bg-primary/[0.02]" : ""}>
                      <TableCell className="w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(course.id)}
                          onChange={() => toggleSelectOne(course.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.thumbnailUrl ? (
                            <img src={getMediaUrl(course.thumbnailUrl)} alt={course.title} className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Video className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">{course.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={course.description}>
                              {course.description || t("noDesc")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {course.price > 0 ? (
                          new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(course.price)
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{t("free")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={course.status === "PUBLISHED" ? "default" : course.status === "DELETED" ? "destructive" : "outline"}
                          className={course.status === "DELETED" ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" : ""}
                        >
                          {course.status === "PUBLISHED" ? t("published") : course.status === "DELETED" ? t("deletedTestsTab") : t("draft")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {course.status === "DELETED" ? (
                            <Button variant="ghost" size="icon" onClick={() => handleRestore(course.id, course.title)} title="Restore course">
                              <RefreshCw className="w-4 h-4 text-emerald-600" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" asChild title="View course curriculum">
                                <Link to={`/admin/courses/${course.id}/lessons`}>
                                  <Eye className="w-4 h-4 text-primary" />
                                </Link>
                              </Button>
                              {course.status === "DRAFT" && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handlePublish(course.id, course.title)}
                                  title="Công khai khóa học"
                                >
                                  <Check className="w-4 h-4 text-emerald-600" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/admin/courses/${course.id}/edit`}>
                                  <Edit className="w-4 h-4 text-blue-500" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id, course.title)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {t("noCoursesFound") || "No courses found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {courses && courses.totalPages >= 1 && (
            <div className="p-6 bg-muted/10 border border-t-0 border-border/50 rounded-b-md flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {t("showing")} {courses.pageNumber * courses.pageSize + 1} - {Math.min((courses.pageNumber + 1) * courses.pageSize, courses.totalElements)} {t("of")} {courses.totalElements}
              </p>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {[...Array(courses.totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i ? "default" : "ghost"}
                      size="sm"
                      className={`w-9 h-9 rounded-lg p-0 font-bold transition-all ${
                        page === i 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15" 
                          : "border border-border/50 hover:bg-primary/10 hover:text-primary"
                      }`}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                  onClick={() => setPage(prev => Math.min(courses.totalPages - 1, prev + 1))}
                  disabled={page === courses.totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Course */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeletingCourse}
        itemName={courseToDelete?.title}
        description={`Bạn có chắc chắn muốn xóa khóa học "${courseToDelete?.title}"? Hành động này sẽ chuyển khóa học vào thùng rác.`}
      />

      {/* Bulk Delete Course */}
      <ConfirmDeleteModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={isBulkDeleting}
        title={`Xóa ${selectedIds.size} khóa học?`}
        description={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.size} khóa học này không?`}
      />
    </div>
  );
}
