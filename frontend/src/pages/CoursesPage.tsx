import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import courseService, { type CourseResponse, type PageResponse } from "@/services/courseService";
import { CourseCard } from "@/components/course/CourseCard";
import { GraduationCap, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CoursesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PageResponse<CourseResponse> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await courseService.getAllCourses({ keyword: search || undefined, page, size: 12 });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(keyword);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">{t("exploreCourses")}</h1>
              </div>
              <p className="text-muted-foreground">{t("exploreCoursesDesc")}</p>
            </div>
            
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder={t("searchCourses")} 
                  className="pl-9 bg-card border-border"
                />
              </div>
              <Button type="submit">{t("search")}</Button>
            </form>
          </div>
        </motion.div>

      {/* Course Grid */}
      <div className="pt-2">
        {loading ? (
          <div className="courses-page__skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="course-skeleton" />
            ))}
          </div>
        ) : data && data.content.length > 0 ? (
          <>
            <p className="courses-page__count">
              {t("coursesFoundCount", { count: data.totalElements })}
              {search && <> for "<strong>{search}</strong>"</>}
            </p>
            <div className="courses-page__grid">
              {data.content.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="courses-page__pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {data.totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="courses-page__empty">
            <svg viewBox="0 0 96 96" fill="none" width={80} height={80}>
              <circle cx="48" cy="48" r="48" fill="rgba(99,102,241,0.08)" />
              <path d="M48 28c0-1.1.9-2 2-2h12a2 2 0 012 2v12a2 2 0 01-2 2H50a2 2 0 01-2-2V28z" fill="rgba(99,102,241,0.3)" />
              <rect x="28" y="42" width="40" height="28" rx="4" fill="rgba(99,102,241,0.2)" />
            </svg>
            <h3>No courses found</h3>
            {search && (
              <button className="btn-ghost" onClick={() => { setSearch(""); setKeyword(""); setPage(0); }}>
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
