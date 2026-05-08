import { Search, Filter, Plus, X, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdminFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  skillFilter: string;
  onSkillFilterChange: (value: string) => void;
  levelFilter: string;
  onLevelFilterChange: (value: string) => void;
  activeTab: "ALL" | "ACTIVE" | "DELETED";
  onActiveTabChange: (value: "ALL" | "ACTIVE" | "DELETED") => void;
  onCreateTest: () => void;
  onExportPayments?: () => void;
}

export default function AdminFilters({
  searchTerm,
  onSearchChange,
  skillFilter,
  onSkillFilterChange,
  levelFilter,
  onLevelFilterChange,
  activeTab,
  onActiveTabChange,
  onCreateTest,
  onExportPayments,
}: AdminFiltersProps) {
  const { t } = useLanguage();
  const activeFilters = [skillFilter, levelFilter].filter(
    (f) => f && f !== "all"
  ).length;

  const clearFilters = () => {
    onSkillFilterChange("all");
    onLevelFilterChange("all");
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
          {/* Active / Deleted Tabs */}
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50 shrink-0">
            {(["ALL", "ACTIVE", "DELETED"] as const).map((tab) => (
              <Button
                key={tab}
                type="button"
                onClick={() => {
                  onActiveTabChange(tab);
                }}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`h-9 rounded-lg px-4 text-xs font-bold transition-all ${
                  activeTab === tab ? "shadow-sm bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {tab === "ALL" ? t("all") : tab === "ACTIVE" ? t("activeTestsTab") : t("deletedTestsTab")}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchByTestName') || "Tìm kiếm theo tên bài kiểm tra..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 rounded-lg bg-card border-border/50"
            />
          </div>
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t('filter') || "Lọc"}:</span>
          </div>

          <Select value={skillFilter} onValueChange={onSkillFilterChange}>
            <SelectTrigger className="w-[140px] h-11 rounded-lg bg-card border-border/50">
              <SelectValue placeholder={t('skillType') || "Kỹ năng"} />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">{t('allSkills') || "Tất cả kỹ năng"}</SelectItem>
              <SelectItem value="LISTENING">{t("listening") || "Nghe"}</SelectItem>
              <SelectItem value="READING">{t("reading") || "Đọc"}</SelectItem>
              <SelectItem value="FULL">{t("full") || "Full"}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={onLevelFilterChange}>
            <SelectTrigger className="w-[140px] h-11 rounded-lg bg-card border-border/50">
              <SelectValue placeholder={t('level') || "Mức độ"} />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">{t('allLevels') || "Tất cả mức độ"}</SelectItem>
              <SelectItem value="EASY">{t('levelEasy') || "Dễ"}</SelectItem>
              <SelectItem value="MEDIUM">{t('levelMedium') || "Trung bình"}</SelectItem>
              <SelectItem value="HARD">{t('levelHard') || "Khó"}</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground h-11 rounded-lg"
            >
              <X className="w-4 h-4 mr-1" />
              {t('reset') || "Thiết lập lại"} ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t('activeFilters') || "Bộ lọc hoạt động:"}</span>
          {skillFilter && skillFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {skillFilter === 'LISTENING' ? (t('listening') || "Nghe") : skillFilter === 'READING' ? (t('reading') || "Đọc") : (t('full') || "Full")}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onSkillFilterChange("all")} />
            </Badge>
          )}
          {levelFilter && levelFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {levelFilter === 'EASY' ? (t('levelEasy') || "Dễ") : levelFilter === 'MEDIUM' ? (t('levelMedium') || "Trung bình") : (t('levelHard') || "Khó")}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onLevelFilterChange("all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
