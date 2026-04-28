import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Save, Loader2, PlayCircle, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import courseService, { type CourseResponse, type CourseRequest } from "@/services/courseService";
import lessonService from "@/services/lessonService";
import { uploadImage } from "@/services/fileService";
import { getMediaUrl } from "@/lib/utils";

export default function AdminCourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [course, setCourse] = useState<CourseResponse | null>(null);

  const [formData, setFormData] = useState<CourseRequest>({
    title: "",
    description: "",
    price: 0,
    thumbnailUrl: "",
    status: "DRAFT",
  });

  useEffect(() => {
    if (isEditing && id) {
      courseService.getCourseDetail(id)
        .then((data) => {
          setCourse(data);
          setFormData({
            title: data.title,
            description: data.description || "",
            price: data.price,
            thumbnailUrl: data.thumbnailUrl || "",
            status: data.status,
          });
        })
        .catch(() => {
          toast.error("Failed to load course details");
          navigate("/admin/courses");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

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
      toast.success("Image uploaded successfully");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStatusChange = (value: "DRAFT" | "PUBLISHED") => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && id) {
        await courseService.updateCourse(id, formData);
        toast.success("Course updated successfully");
      } else {
        const newCourse = await courseService.createCourse(formData);
        toast.success("Course created successfully");
        navigate(`/admin/courses/${newCourse.id}/edit`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save course");
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
          to="/admin/courses" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Courses
        </Link>
      </div>

      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditing ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? `Editing: ${course?.title}` : "Fill in the details below to create a new course"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Setup the core details of your course</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g., Ultimate React Masterclass" 
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
                    placeholder="Describe what students will learn..." 
                    className="min-h-[150px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (VND)</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      value={formData.price} 
                      onChange={handleChange} 
                      min={0}
                      required 
                    />
                    <p className="text-xs text-muted-foreground">Set to 0 for a free course</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Publish Status</Label>
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Course Thumbnail</Label>
                  <Input 
                    id="thumbnailUrl" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-xs text-primary animate-pulse">Uploading image...</p>}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link to="/admin/courses">Cancel</Link>
            </Button>
            <Button type="submit" form="course-form" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? "Save Changes" : "Create Course"}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.thumbnailUrl ? (
                <img 
                  src={getMediaUrl(formData.thumbnailUrl)} 
                  alt="Thumbnail Preview" 
                  className="w-full aspect-video object-cover rounded-md bg-muted border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image'; }}
                />
              ) : (
                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center border border-dashed border-border">
                  <span className="text-muted-foreground text-sm">No image provided</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>Manage sections & lessons</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isEditing ? (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link to={`/admin/courses/${id}/lessons`}>
                    <PlayCircle className="w-4 h-4" /> Go to Lesson Manager
                  </Link>
                </Button>
              ) : (
                <div className="text-sm text-center text-muted-foreground p-4 bg-muted/50 rounded border border-dashed border-border flex flex-col items-center">
                  <PlayCircle className="w-8 h-8 mb-2 text-muted-foreground/50" />
                  Please complete and save the course details first to unlock curriculum management.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
