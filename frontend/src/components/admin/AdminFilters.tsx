import { Search, Filter, Plus, X } from "lucide-react";
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
}: AdminFiltersProps) {
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
            placeholder="Search by test name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Filters:</span>
          </div>

          <Select value={skillFilter} onValueChange={onSkillFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Skill Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">All Skills</SelectItem>
              <SelectItem value="listening">Listening</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={onLevelFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
              Clear ({activeFilters})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 lg:ml-auto">
          <Button onClick={onCreateTest} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create New Test</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {skillFilter && skillFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {skillFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onSkillFilterChange("all")} />
            </Badge>
          )}
          {levelFilter && levelFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {levelFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onLevelFilterChange("all")} />
            </Badge>
          )}
          {statusFilter && statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {statusFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onStatusFilterChange("all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
