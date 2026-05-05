import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Video, Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import courseService, { type CourseResponse, type PageResponse } from "@/services/courseService";
import { getMediaUrl } from "@/lib/utils";

export default function AdminCoursesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PageResponse<CourseResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getAllCoursesAdmin(page, 10);
      setCourses(data);
    } catch (error) {
      toast.error("Failed to load courses");
      setCourses({ content: [], totalElements: 0, totalPages: 0, pageSize: 10, pageNumber: 0, last: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCourses();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"?`)) return;
    try {
      await courseService.deleteCourse(id);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete course");
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{t("manageCourses")}</CardTitle>
            <CardDescription>Overview and management of learning courses</CardDescription>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link to="/admin/courses/create">
              <Plus className="w-4 h-4" />
              {t("createCourse")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">{t("search")}</Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses?.content?.map((course) => (
                    <TableRow key={course.id}>
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
                              {course.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {course.price > 0 ? (
                          new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(course.price)
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={course.status === "PUBLISHED" ? "default" : course.status === "DELETED" ? "destructive" : "outline"}
                          className={course.status === "DELETED" ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" : ""}
                        >
                          {course.status}
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
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/courses/${course.id}`} target="_blank">
                                  <Eye className="w-4 h-4 text-primary" />
                                </Link>
                              </Button>
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
                  {(!courses?.content || courses.content.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No courses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
