import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Plus, Edit, Trash2, GripVertical, Image as ImageIcon, Video, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import courseService, { type CourseResponse } from "@/services/courseService";
import lessonService from "@/services/lessonService";
import { type LessonResponse } from "@/services/courseService";
import { getMediaUrl } from "@/lib/utils";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export default function AdminCurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const courseData = await courseService.getCourseDetail(id);
      setCourse(courseData);
      
      const lessonsData = await lessonService.getLessonsByCourse(id);
      setLessons(lessonsData.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) {
      toast.error("Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await lessonService.deleteLesson(deleteTarget.id);
      toast.success("Lesson deleted successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      toast.error("Failed to delete lesson");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          to={`/admin/courses/${id}/edit`} 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Course Edit
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Curriculum Manager</h1>
          <p className="text-muted-foreground mt-1">Manage lessons for: <span className="font-medium text-foreground">{course?.title}</span></p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link to={`/admin/courses/${id}/lessons/create`}>
            <Plus className="w-4 h-4" /> Add Lesson
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                {/* Thumbnail Preview icon size */}
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                  {(lesson as any).thumbnailUrl ? (
                    <img src={getMediaUrl((lesson as any).thumbnailUrl)} alt="thumb" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {index + 1}. {lesson.title}
                    </span>
                    {lesson.isPreview && <Badge variant="secondary" className="text-[10px]">Preview</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {lesson.videoUrl && (
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Has Video</span>
                    )}
                    {lesson.duration > 0 && <span>Duration: {lesson.duration}s</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/admin/courses/${id}/lessons/${lesson.id}/edit`}>
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: lesson.id, title: lesson.title })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {lessons.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Video className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p>No lessons yet. Add your first lesson to build the curriculum.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lesson Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        itemName={deleteTarget?.title}
        description={`Bạn có chắc chắn muốn xóa bài học "${deleteTarget?.title}" không? Thao tác này sẽ gỡ bài học ra khỏi khóa học hiện tại.`}
      />
    </div>
  );
}
