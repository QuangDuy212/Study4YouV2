import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ListeningMediaUploader from "./ListeningMediaUploader";
import type { TestData, Skill, Difficulty, TestStatus } from "./types";

interface TestInfoSectionProps {
  data: TestData;
  onChange: (data: Partial<TestData>) => void;
}

export default function TestInfoSection({ data, onChange }: TestInfoSectionProps) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {t("testInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-name">{t("testName")}</Label>
          <Input id="test-name" placeholder={t("testNamePlaceholder")} value={data.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("skill")}</Label>
            <Select value={data.skill} onValueChange={(v) => onChange({ skill: v as Skill })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LISTENING">{t("listening")}</SelectItem>
                <SelectItem value="READING">{t("reading")}</SelectItem>
                <SelectItem value="FULL">{t("full")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("level")}</Label>
            <Select value={data.level} onValueChange={(v) => onChange({ level: v as Difficulty })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">{t("beginner")}</SelectItem>
                <SelectItem value="MEDIUM">{t("intermediate")}</SelectItem>
                <SelectItem value="HARD">{t("advanced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">{t("durationMinutes")}</Label>
            <Input id="duration" type="number" min={1} value={data.duration} onChange={(e) => onChange({ duration: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>{t("status")}</Label>
            <Select value={data.status} onValueChange={(v) => onChange({ status: v as TestStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("draft")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="archived">{t("archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(data.skill === "LISTENING" || data.skill === "FULL") && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold uppercase tracking-wider">{t("fullTestAudio")}</Label>
            </div>
            <ListeningMediaUploader
              hideImage
              audioUrl={data.audioUrl}
              onAudioChange={(url) => onChange({ audioUrl: url })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
