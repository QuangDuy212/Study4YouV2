import React, { memo } from "react";
import { Link } from "react-router-dom";
import type { CourseResponse } from "@/services/courseService";
import { getMediaUrl } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface CourseCardProps {
  course: CourseResponse;
  enrolled?: boolean;
  progress?: number;
}

function formatPrice(price: number, t: (k: string) => string): string {
  if (price === 0) return t("free");
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export const CourseCard = memo(({ course, enrolled, progress }: CourseCardProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="course-card flex flex-col bg-card border border-border shadow-sm transition-all duration-300 rounded-3xl overflow-hidden group will-change-transform">
      {/* Thumbnail */}
      <div className="course-card__thumb relative aspect-video bg-muted/30 overflow-hidden">
        {course.thumbnailUrl ? (
          <img 
            src={getMediaUrl(course.thumbnailUrl)} 
            alt={course.title} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.classList.add('bg-muted');
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/30">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {course.price === 0 && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider z-10">
            {t("free")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="course-card__body flex flex-col flex-1 p-5 gap-3">
        <h3 className="course-card__title font-bold text-base text-foreground leading-tight line-clamp-2 transition-colors">
          {course.title}
        </h3>
        
        {course.description && (
          <p className="course-card__desc text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        )}

        {enrolled && progress !== undefined && (
          <div className="mt-2 space-y-2">
            <Progress value={progress} className="h-1.5" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              {t("percentComplete", { percent: progress })}
            </span>
          </div>
        )}

        {/* Footer: Price & Button */}
        <div className="course-card__footer mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          <span className="course-card__price text-base font-black text-primary tracking-tight">
            {formatPrice(course.price, t)}
          </span>
          <Link
            to={enrolled ? `/learn/${course.id}` : `/courses/${course.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
          >
            {enrolled ? t("continueLearning") : t("viewCourse")}
          </Link>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";
