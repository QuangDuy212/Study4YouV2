import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Headphones, Clock, HelpCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import testService from "@/services/testService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getMediaUrl } from "@/lib/utils";

interface TestOption {
  label: string;
  content: string;
}

interface TestQuestion {
  id: string;
  content: string;
  audioUrl: string | null;
  imageUrl: string | null;
  passage: string | null;
  correctAnswer: string;
  sortOrder: number;
  options: TestOption[];
}

interface TestPart {
  id: string;
  partType: string;
  sortOrder: number;
  questions: TestQuestion[];
}

interface TestData {
  id: string;
  name: string;
  skill: string;
  level: string;
  duration: number;
  status: string;
  audioUrl: string | null;
  createdAt: string;
  parts: TestPart[];
}

export default function TestViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<string>("PART_1");

  const PART_LABELS: Record<string, { label: string; description: string }> = {
    PART_1: { label: t("part1"), description: t("photographs") },
    PART_2: { label: t("part2"), description: t("questionResponse") },
    PART_3: { label: t("part3"), description: t("conversations") },
    PART_4: { label: t("part4"), description: t("talks") },
    PART_5: { label: t("part5"), description: t("incompleteSentences") },
    PART_6: { label: t("part6"), description: t("textCompletion") },
    PART_7: { label: t("part7"), description: t("readingComprehension") },
  };

  useEffect(() => {
    if (id) fetchTestData(id);
  }, [id]);

  const fetchTestData = async (testId: string) => {
    try {
      setLoading(true);
      const fullTest = await testService.getTestById(testId);
      
      const structuredParts: TestPart[] = (fullTest.parts || []).map((part) => ({
        id: part.id,
        partType: part.part,
        sortOrder: part.orderIndex,
        questions: (part.questions || []).map((q) => ({
          id: q.id,
          content: q.content,
          audioUrl: q.audioUrl,
          imageUrl: q.imageUrl,
          passage: q.passage,
          correctAnswer: q.correctAnswer,
          sortOrder: 0, // Not provided by backend in this DTO currently
          options: (q.options || []).map((o) => ({
            label: o.label,
            content: o.content
          })),
        })),
      }));

      setTestData({
        id: fullTest.id,
        name: fullTest.title,
        skill: fullTest.parts?.length === 4 ? (fullTest.parts[0].part.startsWith("PART_1") ? "listening" : "reading") : "full",
        level: "intermediate", 
        duration: fullTest.durationMinutes,
        status: fullTest.active ? "active" : "draft",
        audioUrl: fullTest.audioUrl || null,
        createdAt: fullTest.createdAt,
        parts: structuredParts
      });
      
      if (structuredParts.length > 0) setSelectedPart(structuredParts[0].partType);
    } catch (error: any) {
      console.error("Error fetching test data:", error);
      toast.error(t("error") || "Failed to load test data");
      navigate("/admin/tests");
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = testData?.parts.reduce((sum, part) => sum + part.questions.length, 0) || 0;

  if (loading) {
    return (
      <AdminLayout pageTitle={t("viewTest")} pageDescription={t("loadingTestData")}>
        <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
      </AdminLayout>
    );
  }

  if (!testData) {
    return (
      <AdminLayout pageTitle={t("viewTest")} pageDescription={t("testNotFound")}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("testNotFound")}</p>
          <Button onClick={() => navigate("/admin/tests")} className="mt-4">{t("backToTests")}</Button>
        </div>
      </AdminLayout>
    );
  }

  const SkillIcon = testData.skill === "listening" ? Headphones : BookOpen;

  return (
    <AdminLayout pageTitle={testData.name} pageDescription={t("fullTestPreview")}>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tests")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("backToTests")}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SkillIcon className="w-5 h-5 text-primary" />{testData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem icon={<HelpCircle className="w-4 h-4" />} label={t("totalQuestionsLabel")} value={totalQuestions} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label={t("duration")} value={`${testData.duration} ${t("minutes")}`} />
            <InfoItem icon={<BookOpen className="w-4 h-4" />} label={t("level")} value={<Badge variant="outline" className="capitalize">{t(testData.level)}</Badge>} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label={t("created")} value={new Date(testData.createdAt).toLocaleDateString()} />
          </div>
        </CardContent>
      </Card>

      {testData.audioUrl && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">{t("fullTestAudio")}</p>
            </div>
            <audio 
              controls 
              src={getMediaUrl(testData.audioUrl)} 
              className="w-full" 
              controlsList="nodownload" 
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedPart} onValueChange={setSelectedPart} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          {testData.parts.map((part) => (
            <TabsTrigger key={part.id} value={part.partType} className="whitespace-nowrap">
              {PART_LABELS[part.partType]?.label || part.partType}
              <Badge variant="secondary" className="ml-2">{part.questions.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {testData.parts.map((part) => (
          <TabsContent key={part.id} value={part.partType} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{PART_LABELS[part.partType]?.label} — {PART_LABELS[part.partType]?.description}</h3>
              <p className="text-sm text-muted-foreground">{part.questions.length} {t("questions")}</p>
            </div>


            {part.questions.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">{t("noQuestionsInPart")}</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {part.questions.map((question, index) => (
                  <QuestionCard 
                    key={question.id} 
                    question={question} 
                    questionNumber={index + 1} 
                    partType={part.partType} 
                    t={t} 
                    partLabel={PART_LABELS[part.partType]?.label}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

    </AdminLayout>
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

function QuestionCard({ 
  question, 
  questionNumber, 
  partType, 
  t,
  partLabel
}: { 
  question: any; 
  questionNumber: number; 
  partType: string; 
  t: (key: string) => string;
  partLabel?: string;
}) {
  const showPassage = partType === "PART_6" || partType === "PART_7";
  const isPart1 = partType === "PART_1";
  const showQuestionAudio = !["PART_1", "PART_2", "PART_3"].includes(partType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{t("question")} {questionNumber}</span>
          <Badge variant="outline" className="text-xs">{partLabel || partType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPassage && question.passage && (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("readingPassage")}</p>
            <p className="text-sm whitespace-pre-wrap">{question.passage}</p>
          </div>
        )}
        {isPart1 && question.imageUrl && (
          <div className="flex justify-center">
            <img src={getMediaUrl(question.imageUrl)} alt={`${t("question")} ${questionNumber}`} className="max-w-md rounded-lg border shadow-sm" />
          </div>
        )}
        {showQuestionAudio && question.audioUrl && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("audio")}</p>
            <audio controls src={getMediaUrl(question.audioUrl)} className="w-full" />
          </div>
        )}
        {question.content && <div><p className="text-sm font-medium">{question.content}</p></div>}
        <Separator />
        {question.options && question.options.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{t("answerOptionsLabel")}</p>
            <div className="grid gap-2">
              {[...question.options].sort((a: any, b: any) => a.label.localeCompare(b.label)).map((option: any) => {
                const isCorrect = option.label === question.correctAnswer;
                return (
                  <div key={option.label} className={cn("flex items-start gap-3 p-3 rounded-lg border", isCorrect && "bg-success/10 border-success/30")}>
                    <Badge variant={isCorrect ? "default" : "outline"} className={cn(isCorrect && "bg-success")}>{option.label}</Badge>
                    <p className="text-sm flex-1">{option.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2">
          <p className="text-xs text-muted-foreground">{t("correctAnswer")}:</p>
          <Badge className="bg-success">{question.correctAnswer}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
