import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import questionService from "@/services/questionService";
import partService, { type ToeicPartResponse } from "@/services/partService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PartType, TestOption } from "@/components/admin/test-editor/types";
import { PART_LABELS, LISTENING_PARTS } from "@/components/admin/test-editor/types";
import ListeningMediaUploader from "@/components/admin/test-editor/ListeningMediaUploader";

const ANSWER_LABELS = ["A", "B", "C", "D"] as const;

export default function QuestionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isCreate = !id;

  const [partType, setPartType] = useState<PartType>("PART_5");
  const [level, setLevel] = useState("MEDIUM");
  const [content, setContent] = useState("");
  const [passage, setPassage] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<"A" | "B" | "C" | "D">("A");
  const [options, setOptions] = useState<TestOption[]>(ANSWER_LABELS.map((l) => ({ label: l, content: "" })));
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [allParts, setAllParts] = useState<ToeicPartResponse[]>([]);

  const isListeningPart = LISTENING_PARTS.includes(partType);
  const needsPassage = partType === "PART_6" || partType === "PART_7";
  const needsImage = partType === "PART_1";

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const partsData = await partService.getParts(0, 100);
        setAllParts(partsData.content);

        if (id) {
          const q = await questionService.getQuestionById(id);
          // Find part type from partId
          const part = partsData.content.find(p => p.id === q.partId);
          if (part) setPartType(part.part as PartType);
          
          setContent(q.content);
          setPassage(q.passage || "");
          setCorrectAnswer(q.correctAnswer as any);
          setLevel(q.level || "MEDIUM");
          setAudioUrl(q.audioUrl);
          setImageUrl(q.imageUrl);
          
          if (q.options && q.options.length > 0) {
            setOptions(q.options.map((o: any) => ({ label: o.label, content: o.content })));
          }
        }
      } catch (err: any) {
        toast.error("Failed to load question data");
        navigate("/admin/questions");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const updateOption = useCallback((label: string, value: string) => {
    setOptions((prev) => prev.map((o) => (o.label === label ? { ...o, content: value } : o)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim()) { toast.error("Content is required"); return; }
    if (options.some((o) => !o.content.trim())) { toast.error("All options must be filled"); return; }
    if (needsPassage && !passage.trim()) { toast.error("Passage is required"); return; }

    // Find the UUID for the selected partType
    const selectedPart = allParts.find(p => p.part === partType);
    if (!selectedPart) {
      toast.error("Valid part must be selected");
      return;
    }

    setIsSaving(true);
    try {
      const requestData = {
        partId: selectedPart.id,
        content,
        passage: needsPassage ? passage : null,
        correctAnswer,
        level,
        audioUrl: isListeningPart ? audioUrl : null,
        imageUrl: needsImage ? imageUrl : null,
        options: options.map(o => ({ label: o.label, content: o.content }))
      };

      if (isCreate) {
        await questionService.createQuestion(requestData);
        toast.success(t("success") || "Question created");
      } else if (id) {
        await questionService.updateQuestion(id, requestData);
        toast.success(t("success") || "Question updated");
      }
      navigate("/admin/questions");
    } catch (err: any) {
      toast.error(t("error") || "Error saving question", { 
        description: err?.response?.data?.message || err.message 
      });
    } finally {
      setIsSaving(false);
    }
  }, [content, options, passage, audioUrl, imageUrl, isCreate, needsPassage, isListeningPart, needsImage, navigate, partType, correctAnswer, level, id, t, allParts]);

  if (isLoadingData) {
    return (
      <>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/questions")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("back")}
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? t("saving") : isCreate ? t("addQuestion") : t("saveChanges")}
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("question")} {t("settings")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("part")}</Label>
                <Select value={partType} onValueChange={(v) => setPartType(v as PartType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PART_LABELS) as PartType[]).map((pt) => (
                      <SelectItem key={pt} value={pt}>{PART_LABELS[pt].label} – {PART_LABELS[pt].description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("level")}</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t("levelEasy")}</SelectItem>
                    <SelectItem value="MEDIUM">{t("levelMedium")}</SelectItem>
                    <SelectItem value="HARD">{t("levelHard")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Badge variant="secondary" className={cn("px-3 py-1.5",
                   isListeningPart ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                )}>
                  {isListeningPart ? `🎧 ${t("listening")}` : `📖 ${t("reading")}`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {needsPassage && (
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("passage")}</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={passage} onChange={(e) => setPassage(e.target.value)} placeholder={t("enterPassage")} className="min-h-[200px] font-mono text-sm" />
            </CardContent>
          </Card>
        )}

        {isListeningPart && (
           <Card>
             <CardHeader><CardTitle className="text-lg">{t("media") || "Media"}</CardTitle></CardHeader>
             <CardContent>
                <ListeningMediaUploader
                  hideImage={!needsImage}
                  audioUrl={audioUrl}
                  imageUrl={needsImage ? imageUrl : null}
                  onAudioChange={setAudioUrl}
                  onImageChange={setImageUrl}
                />
             </CardContent>
           </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("questionLabel")}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("questionLabel")}</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder={isListeningPart ? t("enterQuestion") : t("enterSentence")} className="min-h-[100px]" />
            </div>
            <div className="space-y-3">
              <Label>{t("answerOptions")}</Label>
              {options.map((opt) => (
                <div key={opt.label}
                  className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    correctAnswer === opt.label ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  )}
                  onClick={() => setCorrectAnswer(opt.label as any)}
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                    correctAnswer === opt.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>{opt.label}</div>
                  <Input value={opt.content} onChange={(e) => updateOption(opt.label, e.target.value)}
                    placeholder={`${t("answerOptions")} ${opt.label}...`} className="flex-1" onClick={(e) => e.stopPropagation()} />
                  {correctAnswer === opt.label && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
