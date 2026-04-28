import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import courseService, { type CourseResponse, type LessonResponse } from "@/services/courseService";
import enrollmentService from "@/services/enrollmentService";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonList } from "@/components/course/LessonList";
import { Menu, ChevronLeft, ChevronRight, CheckCircle, Award, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function LearnPage() {
  const { t } = useLanguage();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonResponse | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      courseService.getCourseDetail(courseId),
      enrollmentService.getMyCourses().catch(() => []),
    ]).then(([courseData, enrollments]) => {
      setCourse(courseData);
      const enrollment = enrollments.find(e => e.courseId === courseId);
      
      const allLessons = [
        ...(courseData.sections?.flatMap(s => s.lessons) ?? []),
        ...(courseData.lessons ?? []),
      ];

      if (enrollment) {
        setEnrolled(true);
        setProgress(enrollment.progress);
        if (allLessons.length > 0) setCurrentLesson(allLessons[0]);
      } else {
        setEnrolled(false);
        // Preview mode: check if any lesson is free preview
        const firstPreview = allLessons.find(l => l.isPreview);
        if (firstPreview) {
          setCurrentLesson(firstPreview);
          toast.info(t("previewModeToast"));
        } else {
          toast.error(t("notEnrolledNoPreview"));
          navigate(`/courses/${courseId}`);
        }
      }
    }).catch(() => {
      toast.error(t("failedToLoadCourse") || "Failed to load course");
      navigate("/my-courses");
    }).finally(() => setLoading(false));
  }, [courseId, navigate]);

  const getAllLessons = useCallback((): LessonResponse[] => {
    if (!course) return [];
    return [
      ...(course.sections?.flatMap(s => s.lessons) ?? []),
      ...(course.lessons ?? []),
    ];
  }, [course]);

  const handleLessonSelect = (lesson: LessonResponse) => {
    setCurrentLesson(lesson);
  };

  const handleNextLesson = () => {
    const all = getAllLessons();
    const idx = all.findIndex(l => l.id === currentLesson?.id);
    if (idx < all.length - 1) {
      setCurrentLesson(all[idx + 1]);
    }
  };

  const handlePrevLesson = () => {
    const all = getAllLessons();
    const idx = all.findIndex(l => l.id === currentLesson?.id);
    if (idx > 0) {
      setCurrentLesson(all[idx - 1]);
    }
  };

  const handleUpdateProgress = useCallback(async (newProgress: number) => {
    if (!courseId) return;
    try {
      await enrollmentService.updateProgress(courseId, newProgress);
      setProgress(newProgress);
      if (newProgress >= 100) toast.success(t("courseCompletedToast"));
    } catch (error) {
      console.error("Failed to mark lesson complete", error);
    }
  }, [courseId, t]);

  const handleMarkComplete = () => {
    const all = getAllLessons();
    const idx = all.findIndex(l => l.id === currentLesson?.id);
    const newProgress = Math.round(((idx + 1) / all.length) * 100);
    handleUpdateProgress(Math.max(progress, newProgress));
    if (idx < all.length - 1) {
      setCurrentLesson(all[idx + 1]);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-background">{t("loadingCourse")}</div>;
  }

  if (!course) return null;

  const allLessons = getAllLessons();
  const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <Link to={`/courses/${course.id}`} className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm hidden sm:inline-block truncate max-w-xs">{course.title}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
           {progress === 100 && (
             <div className="hidden sm:flex items-center gap-2 text-yellow-500 font-medium text-sm animate-pulse">
                <Award className="w-4 h-4" /> {t("completed")}
              </div>
            )}
            <div className="flex items-center gap-3 w-32 sm:w-48">
             <Progress value={progress} className="w-full h-2" />
             <span className="text-sm font-semibold shrink-0">{progress}%</span>
           </div>
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 flex flex-col min-w-0 pb-12">
          <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-4">
               <span>{t("courseContent")}</span>
               <ChevronRight className="w-3 h-3" />
               <span className="text-primary truncate max-w-[200px] sm:max-w-md">{currentLesson?.title}</span>
            </div>

            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VideoPlayer 
                videoUrl={currentLesson?.videoUrl} 
                title={currentLesson?.title} 
                isPreview={!enrolled && currentLesson?.isPreview} 
              />
            </section>

            <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="max-w-5xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                  {currentLesson?.title || t("lessonPlaceholder")}
                </h2>
                
                <div className="flex items-center gap-4 py-6 border-b border-border/50 mb-8">
                  <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-primary/10">
                    Lesson {currentIdx + 1}
                  </div>
                  <div className="h-4 w-px bg-border/50" />
                  <div className="text-muted-foreground text-sm font-medium">
                    {currentLesson?.duration ? `${Math.floor(currentLesson.duration / 60)}m ${currentLesson.duration % 60}s` : ""}
                  </div>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {currentLesson?.description ? (
                    <p className="text-muted-foreground leading-relaxed">{currentLesson.description}</p>
                  ) : (
                    <div className="flex items-center gap-3 p-6 rounded-2xl bg-muted/50 border border-border/10 text-muted-foreground italic">
                      <Sparkles className="w-4 h-4 text-primary" /> {t("noDescription")}
                    </div>
                  )}
                </div>
              </div>

              {currentLesson && (
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 min-w-[200px] w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevLesson} 
                    disabled={currentIdx === 0}
                    className="gap-2 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t("prev")}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleMarkComplete}
                    disabled={!enrolled && !allLessons[currentIdx + 1]?.isPreview}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl"
                  >
                    {currentIdx === allLessons.length - 1 ? (
                      <><CheckCircle className="w-4 h-4" /> {t("finishCourse")}</>
                    ) : (
                      <>{t("completeAndNext")} <ChevronRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </main>

        {!sidebarOpen ? null : (
          <aside 
            className={`fixed inset-y-0 right-0 z-50 w-[85%] sm:w-[400px] bg-card border-l border-border flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300
              lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-[400px] lg:z-10`}
          >
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30 backdrop-blur-sm shrink-0">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-foreground">{t("curriculum")}</h3>
                  <p className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                    {t("lessonsCount", { count: allLessons.length, current: currentIdx + 1 })}
                  </p>
                </div>
               <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                 <ChevronRight className="w-5 h-5 text-muted-foreground" />
               </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <LessonList
                sections={course.sections}
                lessons={course.lessons}
                enrolled={true}
                currentLessonId={currentLesson?.id}
                onSelect={(l) => {
                  handleLessonSelect(l);
                  if (window.innerWidth < 1024) setSidebarOpen(false); // Auto close on mobile
                }}
              />
            </div>
          </aside>
        )}
        
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
