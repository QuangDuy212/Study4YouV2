import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import AIGeneratorPanel from "@/components/admin/test-editor/AIGeneratorPanel";
import type { PartType, TestQuestion } from "@/components/admin/test-editor/types";
import { AI_QUESTION_COUNTS, PART_LABELS } from "@/components/admin/test-editor/types";
import { toast } from "sonner";

export default function AIGeneratePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedPart, setSelectedPart] = useState<PartType>("PART_5");

  const [difficulty, setDifficulty] = useState("intermediate");
  const [generatedQuestions, setGeneratedQuestions] = useState<TestQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const handleQuestionsGenerated = (partType: PartType, questions: TestQuestion[]) => {
    setGeneratedQuestions((prev) => [...prev, ...questions]);
    toast.success(t('generatedCountQuestions').replace('{count}', String(questions.length)));
  };

  return (
    <AdminLayout pageTitle={t('aiQuestionGenerator')} pageDescription={t('generateReadingQuestionsDesc')}>
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('generateReadingQuestions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('aiReadingOnlyDesc')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('part')}</Label>
                <Select value={selectedPart} onValueChange={(v) => setSelectedPart(v as PartType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PART_5">{t('part5Desc')} ({AI_QUESTION_COUNTS.PART_5} Q)</SelectItem>
                    <SelectItem value="PART_6">{t('part6Desc')} ({AI_QUESTION_COUNTS.PART_6} Q)</SelectItem>
                    <SelectItem value="PART_7">{t('part7Desc')} ({AI_QUESTION_COUNTS.PART_7} Q)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('difficulty')}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2" onClick={() => setShowPanel(true)}>
                  <Sparkles className="w-4 h-4" />
                  {t('generateQuestions')} ({AI_QUESTION_COUNTS[selectedPart]})
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t('generatedQuestionsTitle')}
                <Badge variant="secondary" className="ml-2">{generatedQuestions.length}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {generatedQuestions.map((q, i) => (
                <div key={q.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-muted-foreground mt-1">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{q.content}</p>
                      {q.passage && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.passage}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {q.options.map((opt) => (
                          <Badge
                            key={opt.label}
                            variant={opt.label === q.correctAnswer ? "default" : "outline"}
                            className="text-xs"
                          >
                            {opt.label}: {opt.content}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {showPanel && (
          <AIGeneratorPanel
            open={showPanel}
            initialPart={selectedPart}
            onClose={() => setShowPanel(false)}
            onQuestionsGenerated={handleQuestionsGenerated}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
