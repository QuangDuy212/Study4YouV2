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
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
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
  statusFilter,
  onStatusFilterChange,
  onCreateTest,
  onExportPayments,
}: AdminFiltersProps) {
  const { t } = useLanguage();
  const activeFilters = [skillFilter, levelFilter, statusFilter].filter(
    (f) => f && f !== "all"
  ).length;

  const clearFilters = () => {
    onSkillFilterChange("all");
    onLevelFilterChange("all");
    onStatusFilterChange("all");
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchByTestName')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{t('filter')}:</span>
          </div>

          <Select value={skillFilter} onValueChange={onSkillFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder={t('skillType')} />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">{t('allSkills')}</SelectItem>
              <SelectItem value="LISTENING">{t("listening")}</SelectItem>
              <SelectItem value="READING">{t("reading")}</SelectItem>
              <SelectItem value="FULL">{t("full")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={onLevelFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder={t('level')} />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">{t('allLevels')}</SelectItem>
              <SelectItem value="EASY">{t('levelEasy')}</SelectItem>
              <SelectItem value="MEDIUM">{t('levelMedium')}</SelectItem>
              <SelectItem value="HARD">{t('levelHard')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="draft">{t('draft')}</SelectItem>
              <SelectItem value="archived">{t('archived')}</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              {t('reset')} ({activeFilters})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 lg:ml-auto">
          {onExportPayments && (
            <Button variant="outline" onClick={onExportPayments} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">{t('exportRecords')}</span>
            </Button>
          )}
          <Button onClick={onCreateTest} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('createNewTest')}</span>
            <span className="sm:hidden">{t('createTest')}</span>
          </Button>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t('activeFilters')}</span>
          {skillFilter && skillFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {skillFilter === 'LISTENING' ? t('listening') : skillFilter === 'READING' ? t('reading') : t('full')}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onSkillFilterChange("all")} />
            </Badge>
          )}
          {levelFilter && levelFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {levelFilter === 'EASY' ? t('levelEasy') : levelFilter === 'MEDIUM' ? t('levelMedium') : t('levelHard')}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onLevelFilterChange("all")} />
            </Badge>
          )}
          {statusFilter && statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {statusFilter === 'active' ? t('active') : statusFilter === 'draft' ? t('draft') : t('archived')}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onStatusFilterChange("all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
