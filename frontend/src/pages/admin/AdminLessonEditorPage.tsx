import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Video as VideoIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import courseService, { type CourseResponse } from "@/services/courseService";
import lessonService, { type LessonRequest } from "@/services/lessonService";
import { uploadImage, uploadVideo } from "@/services/fileService";
import { getMediaUrl } from "@/lib/utils";

export default function AdminLessonEditorPage() {
  const { t } = useLanguage();
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId?: string }>();
  const isEditing = Boolean(lessonId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [course, setCourse] = useState<CourseResponse | null>(null);

  const [formData, setFormData] = useState<LessonRequest>({
    title: "",
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    orderIndex: 0,
    isPreview: false,
  });

  useEffect(() => {
    if (!courseId) return;
    
    // Fetch course title for contextual header
    courseService.getCourseDetail(courseId).then(setCourse).catch(() => {});

    if (isEditing && lessonId) {
      lessonService.getLessonById(lessonId)
        .then((data) => {
          setFormData({
            title: data.title,
            description: data.description || "",
            thumbnailUrl: (data as any).thumbnailUrl || "",
            videoUrl: data.videoUrl || "",
            orderIndex: data.orderIndex,
            isPreview: data.isPreview,
          });
        })
        .catch(() => {
          toast.error("Failed to load lesson details");
          navigate(`/admin/courses/${courseId}/lessons`);
        })
        .finally(() => setLoading(false));
    }
  }, [courseId, lessonId, isEditing, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadImage(file);
      setFormData((prev) => ({ ...prev, thumbnailUrl: result.url }));
      toast.success("Thumbnail uploaded successfully");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const result = await uploadVideo(file);
      setFormData((prev) => ({ ...prev, videoUrl: result.url }));
      toast.success("Video uploaded successfully");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    setSaving(true);
    try {
      if (isEditing && lessonId) {
        await lessonService.updateLesson(lessonId, formData);
        toast.success("Lesson updated successfully");
      } else {
        await lessonService.createLesson(courseId, formData);
        toast.success("Lesson created successfully");
      }
      navigate(`/admin/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          to={`/admin/courses/${courseId}/lessons`} 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("backToCurriculum")}
        </Link>
      </div>

      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditing ? t("edit") + " " + t("lessonTitle") : t("add") + " " + t("lessonTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("courses")}: <span className="font-medium text-foreground">{course?.title || t("loading")}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("lessonContent")}</CardTitle>
              <CardDescription>{t("lessonContentDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="lesson-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("lessonTitle")} <span className="text-destructive">*</span></Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g., Lesson 1: Introduction" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Markdown Supported)</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Provide details, reading materials, or external links..." 
                    className="min-h-[150px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderIndex">Order Index</Label>
                    <Input 
                      id="orderIndex" 
                      name="orderIndex" 
                      type="number" 
                      value={formData.orderIndex} 
                      onChange={handleChange} 
                      min={0}
                      required 
                    />
                    <p className="text-xs text-muted-foreground">Used to sort lessons respectively.</p>
                  </div>
                  
                  <div className="space-y-2 mt-2 md:mt-8">
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-card">
                      <input 
                        type="checkbox" 
                        id="isPreview" 
                        checked={formData.isPreview} 
                        onChange={(e) => setFormData(prev => ({ ...prev, isPreview: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="isPreview" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {t("allowFreePreview")}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link to={`/admin/courses/${courseId}/lessons`}>Cancel</Link>
            </Button>
            <Button type="submit" form="lesson-form" disabled={saving || uploadingVideo || uploadingImage} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? t("save") : t("add")}
            </Button>
          </div>
        </div>

        {/* Sidebar for Media */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>{t("lessonThumbnail")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.thumbnailUrl ? (
                <img 
                  src={getMediaUrl(formData.thumbnailUrl)} 
                  alt="Lesson Thumbnail" 
                  className="w-full aspect-video object-cover rounded-md bg-muted border border-border"
                />
              ) : (
                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center border border-dashed border-border">
                  <span className="text-muted-foreground text-sm">No thumbnail provided</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="thumbnailFile">{t("uploadNewThumbnail")}</Label>
                <Input 
                  id="thumbnailFile" 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-xs text-primary animate-pulse">Uploading image...</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>{t("lessonVideo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.videoUrl ? (
                <div className="rounded-md overflow-hidden bg-black aspect-video border border-border">
                  {formData.videoUrl.includes("youtube.com") || formData.videoUrl.includes("youtu.be") ? (
                     <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <VideoIcon className="w-8 h-8" />
                        <span className="ml-2 text-sm">YouTube Video Linked</span>
                     </div>
                  ) : (
                    <video src={getMediaUrl(formData.videoUrl)} controls className="w-full h-full object-contain" />
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center border border-dashed border-border">
                  <span className="text-muted-foreground text-sm">No video provided</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="videoFile">{t("uploadLocalVideo")}</Label>
                <Input 
                  id="videoFile" 
                  type="file" 
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleVideoUpload} 
                  disabled={uploadingVideo}
                />
                {uploadingVideo && <p className="text-xs text-primary animate-pulse">Uploading video... This may take a while.</p>}
              </div>
              

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
