import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import courseService from "@/services/courseService";
import { CourseCard } from "@/components/course/CourseCard";
import { GraduationCap, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CoursesPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlKeyword = searchParams.get("keyword") || "";

  const [keyword, setKeyword] = useState(urlKeyword);
  const [search, setSearch] = useState(urlKeyword);
  const [page, setPage] = useState(0);

  // Sync from URL when it changes externally (e.g., from top search bar)
  useEffect(() => {
    if (urlKeyword !== search) {
      setKeyword(urlKeyword);
      setSearch(urlKeyword);
      setPage(0);
    }
  }, [urlKeyword]);

  // Debounce search input from this page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== search) {
        setSearch(keyword);
        setPage(0);
        if (keyword) {
          setSearchParams({ keyword });
        } else {
          setSearchParams({});
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, search, setSearchParams]);

  const itemsPerPage = 6;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["courses", search, page, itemsPerPage],
    queryFn: () => courseService.getAllCourses({ keyword: search || undefined, page, size: itemsPerPage }),
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });

  const renderPageNumbers = () => {
    const totalPages = data?.totalPages || 0;
    const currentPage = page + 1; 
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    
    return pages.map((pNum, index) => {
      if (pNum === "ellipsis") {
        return (
          <PaginationItem key={`ellipsis-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={pNum}>
          <PaginationLink
            href="#"
            isActive={currentPage === pNum}
            onClick={(e) => {
              e.preventDefault();
              setPage((pNum as number) - 1);
            }}
            className={cn(
              "cursor-pointer rounded-xl font-bold h-10 w-10 transition-all border",
              currentPage === pNum 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md shadow-primary/15 border-transparent" 
                : "border-border/50 hover:bg-primary/10 hover:text-primary"
            )}
          >
            {pNum}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

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
            {data.totalPages > 0 && (
              <div className="courses-page__pagination mt-12 flex justify-center items-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 0) setPage(p => p - 1);
                        }}
                        className={cn(
                          "rounded-xl font-bold cursor-pointer border border-border/50 transition-all hover:bg-primary/10 hover:text-primary",
                          page === 0 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    
                    {renderPageNumbers()}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < data.totalPages - 1) setPage(p => p + 1);
                        }}
                        className={cn(
                          "rounded-xl font-bold cursor-pointer border border-border/50 transition-all hover:bg-primary/10 hover:text-primary",
                          page >= data.totalPages - 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
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
               <Button variant="link" onClick={() => { setKeyword(""); setSearch(""); setPage(0); setSearchParams({}); }}>
                 Clear search
               </Button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
