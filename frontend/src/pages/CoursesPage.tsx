import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import courseService from "@/services/courseService";
import { CourseCard } from "@/components/course/CourseCard";
import { GraduationCap, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

export default function CoursesPage() {
  const { t } = useLanguage();
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(keyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["courses", search, page],
    queryFn: () => courseService.getAllCourses({ keyword: search || undefined, page, size: 12 }),
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">{t("exploreCourses")}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">{t("exploreCoursesDesc")}</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder={t("searchCourses")} 
            className="pl-9 bg-card border-border h-12 rounded-xl shadow-sm"
          />
        </div>
      </div>

      <div className="pt-2">
        {isLoading && !data ? (
          <div className="courses-page__skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="course-skeleton" />
            ))}
          </div>
        ) : data && data.content.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className={isPlaceholderData ? "opacity-50 transition-opacity" : ""}
          >
            <p className="courses-page__count mb-6 font-medium text-sm">
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
              <div className="courses-page__pagination mt-12 flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl font-bold"
                >
                  ← Prev
                </Button>
                <span className="text-sm font-bold text-muted-foreground">
                  Page {page + 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl font-bold"
                >
                  Next →
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="courses-page__empty py-20 text-center">
             <div className="w-20 h-20 bg-muted rounded-[2rem] mx-auto flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-muted-foreground/30" />
             </div>
             <h3 className="text-xl font-bold">{t("noCoursesFound")}</h3>
             {search && (
               <Button variant="link" onClick={() => { setKeyword(""); setSearch(""); setPage(0); }}>
                 Clear search
               </Button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
