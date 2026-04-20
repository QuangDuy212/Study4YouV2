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

export function CourseCard({ course, enrolled, progress }: CourseCardProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 rounded-3xl overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-muted/30 overflow-hidden">
        {course.thumbnailUrl ? (
          <img 
            src={getMediaUrl(course.thumbnailUrl)} 
            alt={course.title} 
            loading="lazy" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/30">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {course.price === 0 && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            {t("free")}
          </span>
        )}
        {course.status === "DRAFT" && (
          <span className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            {t("draft")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        )}

        {enrolled && progress !== undefined && (
          <div className="mt-2 space-y-2">
            <Progress value={progress} className="h-2" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("percentComplete", { percent: progress })}
            </span>
          </div>
        )}

        {/* Footer: Price & Button */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          <span className="text-lg font-black text-primary tracking-tight">
            {formatPrice(course.price, t)}
          </span>
          <Link
            to={enrolled ? `/learn/${course.id}` : `/courses/${course.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            {enrolled ? t("continueLearning") : t("viewCourse")}
          </Link>
        </div>
      </div>
    </div>
  );
}
