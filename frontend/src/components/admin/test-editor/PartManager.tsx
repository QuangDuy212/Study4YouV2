import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { TestPart, PartType } from "./types";
import { PART_LABELS } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

import PartItem from "./PartItem";

interface PartManagerProps {
  parts: TestPart[];
  onChange: (parts: TestPart[]) => void;
  onOpenAIPanel: (partType: PartType) => void;
}

export default function PartManager({ parts, onChange, onOpenAIPanel }: PartManagerProps) {
  const { t } = useLanguage();
  const [addPartType, setAddPartType] = useState<PartType | "">("");


  const existingTypes = parts.map((p) => p.type);
  const availableTypes = (Object.keys(PART_LABELS) as PartType[]).filter((t) => !existingTypes.includes(t));

  const addPart = () => {
    if (!addPartType) return;
    const newPart: TestPart = {
      id: crypto.randomUUID(),
      type: addPartType as PartType,
      questions: [],
      audioUrl: null,
    };

    // Insert in correct order
    const allTypes: PartType[] = ["PART_1", "PART_2", "PART_3", "PART_4", "PART_5", "PART_6", "PART_7"];
    const updated = [...parts, newPart].sort(
      (a, b) => allTypes.indexOf(a.type) - allTypes.indexOf(b.type)
    );
    onChange(updated);
    setAddPartType("");
  };

  const updatePart = (index: number, part: TestPart) => {
    const updated = [...parts];
    updated[index] = part;
    onChange(updated);
  };

  const deletePart = (index: number) => {
    onChange(parts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">{t('partsAndQuestions')}</h2>
        {availableTypes.length > 0 && (


          <div className="flex items-center gap-2">
            <Select value={addPartType} onValueChange={(v) => setAddPartType(v as PartType)}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder={t('selectPartToAdd')} />
              </SelectTrigger>
              <SelectContent>

                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PART_LABELS[t].label} — {PART_LABELS[t].description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addPart} disabled={!addPartType}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('addPart')}
            </Button>
          </div>


        )}
      </div>

      {parts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          <p className="text-sm">{t('noPartsAdded')}</p>
          <p className="text-xs mt-1">{t('noPartsAddedHint')}</p>
        </div>
      ) : (

        <div className="space-y-3">
          {parts.map((part, i) => (
            <PartItem
              key={part.id}
              part={part}
              onChange={(p) => updatePart(i, p)}
              onDelete={() => deletePart(i)}
              onOpenAIPanel={onOpenAIPanel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
