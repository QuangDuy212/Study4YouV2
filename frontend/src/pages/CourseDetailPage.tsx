import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import courseService, { type CourseResponse } from "@/services/courseService";
import { LessonList } from "@/components/course/LessonList";
import { PaymentButton } from "@/components/course/PaymentButton";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, BookOpen, Clock, PlayCircle, Globe, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMediaUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

function formatPrice(price: number, t: (k: string) => string): string {
  if (price === 0) return t("free");
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CourseDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    courseService.getCourseDetail(id)
      .then(setCourse)
      .catch(() => setError(t("failedToLoadCourse")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="course-detail-page__skeleton">
          <div className="skeleton-block skeleton-block--hero" />
          <div className="skeleton-block" style={{ width: "60%", height: 32, marginTop: 24 }} />
          <div className="skeleton-block" style={{ width: "80%", height: 20, marginTop: 12 }} />
          <div className="skeleton-block" style={{ width: "30%", height: 20, marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-page">
        <div className="error-state">
          <h2>{t("noResultsFound")}</h2>
          <Link to="/courses" className="btn-ghost">← {t("back")}</Link>
        </div>
      </div>
    );
  }

  const totalLessons = (course.sections?.flatMap(s => s.lessons) ?? []).length +
    (course.lessons?.length ?? 0);
  const totalDuration = [
    ...(course.sections?.flatMap(s => s.lessons) ?? []),
    ...(course.lessons ?? []),
  ].reduce((sum, l) => sum + (l.duration ?? 0), 0);

  return (
    <div className="min-h-screen bg-background premium-gradient-bg">
      {/* Hero Section */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
        <div className="container max-w-7xl mx-auto px-4 py-12 lg:py-16 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/courses" className="hover:text-primary transition-colors">{t("courses")}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium truncate">{course.title}</span>
          </nav>

          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
                {course.title}
              </h1>
              <div className="prose prose-lg dark:prose-invert max-w-2xl text-muted-foreground/90 mb-8 leading-relaxed">
                {course.description ? (
                  <p>{course.description}</p>
                ) : (
                  <p className="italic">{t("noDescription")}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen size={16} />
                  </div>
                  <span>{t("lessonsCount", { count: totalLessons })}</span>
                </div>
                {totalDuration > 0 && (
                  <>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                        <Clock size={16} />
                      </div>
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  </>
                )}
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Globe size={16} />
                  </div>
                  <span>Vietnamese / English</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-md border border-border/50 rounded-[2rem] p-6 md:p-10 shadow-sm"
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <PlayCircle size={22} />
                </div>
                {t("courseCurriculum")}
              </h2>
              <LessonList
                sections={course.sections}
                lessons={course.lessons}
                enrolled={course.enrolled === true}
                onSelect={() => navigate(`/learn/${course.id}`)}
              />
            </motion.section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card-premium rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {course.thumbnailUrl && (
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={getMediaUrl(course.thumbnailUrl)}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                       <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                          <PlayCircle className="w-8 h-8 text-white fill-white" />
                       </div>
                    </div>
                  </div>
                )}

                <div className="p-8 space-y-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter text-foreground">
                      {formatPrice(course.price, t)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {user ? (
                      <PaymentButton
                        courseId={course.id}
                        price={course.price}
                        enrolled={course.enrolled === true}
                      />
                    ) : (
                      <Link
                        to="/login"
                        className="flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      >
                        {t("loginToEnroll")}
                      </Link>
                    )}
                  </div>

                  <div className="space-y-6 pt-6 border-t border-border/50">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">{t("thisCourseIncludes")}:</p>
                    <ul className="space-y-4">
                      {[
                        { icon: Clock, text: t("fullLifetimeAccess") },
                        { icon: Globe, text: t("watchAnyDevice") },
                        { icon: Award, text: t("certificateOnCompletion") },
                        { icon: CheckCircle2, text: t("expertGuidance") },
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-4 text-sm font-medium text-foreground/80 group/item">
                          <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform duration-300">
                            <item.icon size={16} />
                          </div>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground pt-4 border-t border-border/30">
                     <ShieldCheck size={14} className="text-emerald-500" />
                     <span>{t("secureTransaction")}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
