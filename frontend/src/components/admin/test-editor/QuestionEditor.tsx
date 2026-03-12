import { useState } from "react";
import { Trash2, GripVertical, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { TestQuestion, PartType } from "./types";
import { LISTENING_PARTS } from "./types";
import ListeningMediaUploader from "./ListeningMediaUploader";

interface QuestionEditorProps {
  question: TestQuestion;
  index: number;
  partType: PartType;
  onChange: (question: TestQuestion) => void;
  onDelete: () => void;
}

export default function QuestionEditor({ question, index, partType, onChange, onDelete }: QuestionEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isListening = LISTENING_PARTS.includes(partType);
  const isPart1 = partType === "PART_1";
  const needsPassage = partType === "PART_6" || partType === "PART_7";

  const updateOption = (label: "A" | "B" | "C" | "D", content: string) => {
    onChange({
      ...question,
      options: question.options?.some(o => o.label === label) 
        ? question.options.map((o) => (o.label === label ? { ...o, content } : o))
        : [...(question.options || []), { label, content }]
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline" className="shrink-0">Q{index + 1}</Badge>
          <span className="text-sm text-muted-foreground truncate">
            {question.content || "New question..."}
          </span>
          {question.correctAnswer && (
            <Badge className="bg-success/10 text-success border-success/20 ml-auto shrink-0">
              <Check className="w-3 h-3 mr-1" />{question.correctAnswer}
            </Badge>
          )}
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Listening media (Audio for all listening parts, Image for Part 1) */}
          {isListening && (
            <ListeningMediaUploader
              hideAudio={["PART_1", "PART_2", "PART_3"].includes(partType)}
              hideImage={!isPart1}
              audioUrl={question.audioUrl}
              imageUrl={isPart1 ? question.imageUrl : null}
              onAudioChange={(audioUrl) => onChange({ ...question, audioUrl })}
              onImageChange={(imageUrl) => onChange({ ...question, imageUrl })}
            />
          )}

          {/* Passage for Part 6, 7 */}
          {needsPassage && (
            <div className="space-y-2">
              <Label>Passage</Label>
              <Textarea
                placeholder="Enter the passage text..."
                className="min-h-[120px] font-mono text-sm"
                value={question.passage || ""}
                onChange={(e) => onChange({ ...question, passage: e.target.value })}
              />
            </div>
          )}

          {/* Question content */}
          <div className="space-y-2">
            <Label>Question</Label>
            <Textarea
              placeholder={isListening ? "Enter the question or transcript..." : "Enter the sentence with ____ blank..."}
              className="min-h-[60px]"
              value={question.content}
              onChange={(e) => onChange({ ...question, content: e.target.value })}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Answer Options</Label>
            <RadioGroup
              value={question.correctAnswer}
              onValueChange={(v) => onChange({ ...question, correctAnswer: v as "A" | "B" | "C" | "D" })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((label) => {
                  const opt = question.options?.find((o) => o.label === label);
                  const isCorrect = question.correctAnswer === label;
                  return (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
                        isCorrect
                          ? "border-success/40 bg-success/5"
                          : "border-border bg-background"
                      )}
                    >
                      <RadioGroupItem value={label} id={`${question.id}-${label}`} className="shrink-0" />
                      <Label htmlFor={`${question.id}-${label}`} className="font-semibold text-sm shrink-0 w-5">
                        {label}.
                      </Label>
                      <Input
                        className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 p-0"
                        placeholder={`Option ${label}`}
                        value={opt?.content || ""}
                        onChange={(e) => updateOption(label, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
}
