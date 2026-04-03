import { useState } from "react";
import { Trash2, GripVertical, Check, Image as ImageIcon, Loader2 } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import { uploadImage } from "@/services/fileService";

interface QuestionEditorProps {
  question: TestQuestion;
  index: number;
  partType: PartType;
  onChange: (question: TestQuestion) => void;
  onDelete: () => void;
  hidePassageField?: boolean;
}

export default function QuestionEditor({ 
  question, 
  index, 
  partType, 
  onChange, 
  onDelete,
  hidePassageField = false 
}: QuestionEditorProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [isImageUploaderVisible, setIsImageUploaderVisible] = useState(!!question.imageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
            {question.content || t("newQuestion")}
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
            <div className="space-y-4">
              <ListeningMediaUploader
                hideAudio={true} // All listening parts now use part-level audio
                hideImage={true} // We handle image uploader separately below for more control
                audioUrl={question.audioUrl}
                onAudioChange={(audioUrl) => onChange({ ...question, audioUrl })}
              />

              {/* Image Uploader Logic */}
              {(isPart1 || partType === "PART_3" || partType === "PART_4") && (
                <div className="space-y-2">
                  {!isImageUploaderVisible ? (
                    <Upload
                      accept="image/jpeg, image/png, image/webp"
                      showUploadList={false}
                      customRequest={async (options) => {
                        const { file, onSuccess, onError } = options;
                        setIsUploadingImage(true);
                        try {
                          const response = await uploadImage(file as File);
                          onChange({ ...question, imageUrl: response.url });
                          setIsImageUploaderVisible(true);
                          onSuccess?.("ok");
                          message.success(t("uploadSuccess", { name: (file as File).name }));
                        } catch (error: any) {
                          onError?.(error);
                          message.error(t("uploadFailed", { name: (file as File).name }));
                        } finally {
                          setIsUploadingImage(false);
                        }
                      }}
                      beforeUpload={(file) => {
                        const isValidFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
                        if (!isValidFormat) message.error(t("invalidImageFormat"));
                        const isLt10M = file.size / 1024 / 1024 < 10;
                        if (!isLt10M) message.error(t("imageSizeLimit"));
                        return isValidFormat && isLt10M;
                      }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground"
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4 mr-2" />
                        )}
                        {isUploadingImage ? t("loading") : t("addImageOptional")}
                      </Button>
                    </Upload>
                  ) : (
                    <ListeningMediaUploader
                      hideAudio={true}
                      imageUrl={question.imageUrl}
                      onImageChange={(imageUrl) => {
                        onChange({ ...question, imageUrl });
                        if (!imageUrl && (partType === "PART_3" || partType === "PART_4")) {
                          setIsImageUploaderVisible(false);
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Passage for Part 6, 7 */}
          {needsPassage && !hidePassageField && (
            <div className="space-y-2">
              <Label>{t("passage")}</Label>
              <Textarea
                placeholder={t("passagePlaceholder")}
                className="min-h-[120px] font-mono text-sm"
                value={question.passage || ""}
                onChange={(e) => onChange({ ...question, passage: e.target.value })}
              />
            </div>
          )}

          {/* Question content */}
          <div className="space-y-2">
            <Label>{t("questionLabel")}</Label>
            <Textarea
              placeholder={isListening ? t("questionPlaceholderListening") : t("questionPlaceholderReading")}
              className="min-h-[60px]"
              value={question.content}
              onChange={(e) => onChange({ ...question, content: e.target.value })}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>{t("answerOptions")}</Label>
            <RadioGroup
              value={question.correctAnswer}
              onValueChange={(v) => onChange({ ...question, correctAnswer: v as "A" | "B" | "C" | "D" })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(partType === "PART_2" ? ["A", "B", "C"] : ["A", "B", "C", "D"] as const).map((label) => {
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
                        placeholder={t("optionPlaceholder", { label })}
                        value={opt?.content || ""}
                        onChange={(e) => updateOption(label as any, e.target.value)}
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
