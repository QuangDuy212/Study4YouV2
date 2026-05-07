import { Save, Send, Headphones, BookOpen, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { TestData } from "./types";
import { PART_LABELS, LISTENING_PARTS, READING_PARTS } from "./types";

interface TestSidebarProps {
  data: TestData;
  onSave: () => void;
  onPublish: () => void;
  isSaving?: boolean;
  expandedPartId: string | null;
  onTogglePart: (id: string) => void;
}

export default function TestSidebar({ data, onSave, onPublish, isSaving, expandedPartId, onTogglePart }: TestSidebarProps) {
  const { t } = useLanguage();
  const listeningCount = data.parts.filter((p) => LISTENING_PARTS.includes(p.type)).reduce((sum, p) => sum + p.questions.length, 0);
  const readingCount = data.parts.filter((p) => READING_PARTS.includes(p.type)).reduce((sum, p) => sum + p.questions.length, 0);
  const totalQuestions = listeningCount + readingCount;

  return (
    <div className="space-y-4 sticky top-20">
      <div className="flex flex-col gap-2">
        <Button onClick={onSave} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? t("saving") : t("saveTest")}
        </Button>
        <Button variant="outline" onClick={onPublish} className="w-full">
          <Send className="w-4 h-4 mr-2" /> {t("publishTest")}
        </Button>
        {expandedPartId && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              const activePart = data.parts.find(p => p.id === expandedPartId);
              if (activePart) onTogglePart(activePart.id);
            }} 
            className="w-full mt-1 text-xs flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 h-9 rounded-xl font-bold transition-all"
          >
            <XCircle className="w-3.5 h-3.5" /> Collapse Active Part
          </Button>
        )}
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t("testOverview")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("totalQuestionsLabel")}</span>
            <Badge variant="secondary" className="font-mono">{totalQuestions}</Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Headphones className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-muted-foreground">{t("listening")}</span>
              <Badge variant="outline" className="ml-auto font-mono text-xs">{listeningCount}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-muted-foreground">{t("reading")}</span>
              <Badge variant="outline" className="ml-auto font-mono text-xs">{readingCount}</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5">
            {data.parts.map((part) => {
              const isExpanded = expandedPartId === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => onTogglePart(part.id)}
                  className={cn(
                    "flex items-center justify-between w-full text-xs p-2 rounded-lg transition-all hover:bg-muted text-left border border-transparent",
                    isExpanded && "bg-primary/10 text-primary font-semibold border-primary/20 shadow-sm"
                  )}
                >
                  <span className={cn("text-muted-foreground transition-colors", isExpanded && "text-primary font-bold")}>
                    {t(PART_LABELS[part.type].labelKey)}
                  </span>
                  <Badge variant={isExpanded ? "default" : "secondary"} className="font-mono text-[10px] h-5 px-1.5">
                    {part.questions.length}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
