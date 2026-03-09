import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Clock, HelpCircle, Calendar, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Test } from "./AdminTestTable";

const levelConfig = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const statusConfig = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-warning/10 text-warning border-warning/20",
  archived: "bg-muted text-muted-foreground border-border",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test | null;
  onEdit: (test: Test) => void;
}

export default function ViewTestDialog({ open, onOpenChange, test, onEdit }: Props) {
  if (!test) return null;

  const SkillIcon = test.skill === "listening" ? Headphones : BookOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SkillIcon className="w-5 h-5 text-primary" />
            {test.name}
          </DialogTitle>
          <DialogDescription>Test details and information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<SkillIcon className="w-4 h-4" />} label="Skill" value={<span className="capitalize">{test.skill}</span>} />
            <InfoItem icon={<HelpCircle className="w-4 h-4" />} label="Level" value={<Badge className={cn("capitalize", levelConfig[test.level])}>{test.level}</Badge>} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Duration" value={`${test.duration} minutes`} />
            <InfoItem icon={<HelpCircle className="w-4 h-4" />} label="Questions" value={`${test.questions}`} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Last Updated" value={test.updatedAt} />
            <InfoItem icon={<HelpCircle className="w-4 h-4" />} label="Status" value={<Badge className={cn("capitalize", statusConfig[test.status])}>{test.status}</Badge>} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { onOpenChange(false); onEdit(test); }} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
