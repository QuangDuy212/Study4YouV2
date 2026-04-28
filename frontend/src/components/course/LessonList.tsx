import type { LessonResponse, SectionResponse } from "@/services/courseService";
import { PlayCircle, Lock, CheckCircle2, ChevronRight, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface LessonListProps {
  sections?: SectionResponse[];
  lessons?: LessonResponse[];
  onSelect?: (lesson: LessonResponse) => void;
  currentLessonId?: string;
  enrolled?: boolean;
}

function LessonItem({
  lesson,
  onSelect,
  active,
  accessible,
  index,
  enrolled
}: {
  lesson: LessonResponse;
  onSelect?: (l: LessonResponse) => void;
  active: boolean;
  accessible: boolean;
  index: number;
  enrolled?: boolean;
}) {
  const { t } = useLanguage();
  const minutes = Math.floor(lesson.duration / 60);
  const seconds = lesson.duration % 60;
  const durationStr = lesson.duration ? `${minutes}:${String(seconds).padStart(2, "0")}` : "";

  return (
    <motion.button
      whileHover={accessible ? { scale: 1.01 } : {}}
      whileTap={accessible ? { scale: 0.99 } : {}}
      className={`w-full flex items-center justify-between p-4 mb-3 rounded-xl border transition-all duration-200 group text-left ${
        active 
          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
          : accessible
            ? "bg-card border-border hover:border-primary/50 hover:shadow-md"
            : "bg-muted/50 border-border/50 opacity-70 cursor-not-allowed"
      }`}
      onClick={() => accessible && onSelect?.(lesson)}
      disabled={!accessible}
    >
      <div className="flex items-start gap-4">
        {/* Icon & Index */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
          active ? "bg-primary text-primary-foreground" : accessible ? "bg-primary/10 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
        }`}>
          {!accessible ? (
            <Lock className="w-4 h-4" />
          ) : active ? (
            <PlayCircle className="w-5 h-5 fill-current" />
          ) : (
            <span className="text-sm font-semibold">{index}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <span className={`font-medium ${active ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}`}>
            {lesson.title}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" /> {t("video")}
            </span>
            {durationStr && <span>• {durationStr}</span>}
          </div>
        </div>
      </div>

      {/* Badges/Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        {lesson.isPreview && !enrolled && (
           <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none">{t("freePreview")}</Badge>
        )}
        {accessible && (
           <ChevronRight className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
        )}
      </div>
    </motion.button>
  );
}

export function LessonList({ sections, lessons, onSelect, currentLessonId, enrolled }: LessonListProps) {
  const { t } = useLanguage();
  const canAccess = (lesson: LessonResponse) => enrolled || lesson.isPreview;
  let globalIndex = 1;

  if (sections && sections.length > 0) {
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="relative">
            <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-primary/20"></span>
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  onSelect={onSelect}
                  active={lesson.id === currentLessonId}
                  accessible={canAccess(lesson)}
                  enrolled={enrolled}
                  index={globalIndex++}
                />
              ))}
            </div>
          </div>
        ))}
        {lessons && lessons.filter(l => !l.sectionId).length > 0 && (
           <div className="relative mt-8">
             <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
               <span className="w-2 h-6 rounded-full bg-primary/20"></span>
               {t("otherLessons")}
             </h4>
             <div className="space-y-1">
               {lessons.filter(l => !l.sectionId).map((lesson) => (
                 <LessonItem
                   key={lesson.id}
                   index={globalIndex++}
                   lesson={lesson}
                   onSelect={onSelect}
                   active={lesson.id === currentLessonId}
                   accessible={canAccess(lesson)}
                   enrolled={enrolled}
                 />
               ))}
             </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {(lessons ?? []).map((lesson) => (
        <LessonItem
          key={lesson.id}
          index={globalIndex++}
          lesson={lesson}
          onSelect={onSelect}
          active={lesson.id === currentLessonId}
          accessible={canAccess(lesson)}
          enrolled={enrolled}
        />
      ))}
    </div>
  );
}
