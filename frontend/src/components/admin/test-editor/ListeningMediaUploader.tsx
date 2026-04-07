import { useRef, useState } from "react";
import { Upload as UploadIcon, Image as ImageIcon, Music, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { uploadAudio, uploadImage } from "@/services/fileService";
import { cn, getMediaUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListeningMediaUploaderProps {
  audioUrl?: string | null;
  imageUrl?: string | null;
  onAudioChange?: (url: string | null) => void;
  onImageChange?: (url: string | null) => void;
  hideImage?: boolean;
  hideAudio?: boolean;
  uploadAudioFn?: (file: File) => Promise<{ url: string }>;
  uploadImageFn?: (file: File) => Promise<{ url: string }>;
}

export default function ListeningMediaUploader({
  audioUrl,
  imageUrl,
  onAudioChange,
  onImageChange,
  hideImage,
  hideAudio,
  uploadAudioFn,
  uploadImageFn,
}: ListeningMediaUploaderProps) {
  const { t } = useLanguage();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const audioUploadProps: UploadProps = {
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      try {
        const uploader = uploadAudioFn || uploadAudio;
        const response = await uploader(file as File);
        onAudioChange?.(response.url);
        onSuccess?.("ok");
        message.success(t("uploadSuccess", { name: (file as File).name }));
      } catch (error: any) {
        onError?.(error);
        message.error(t("uploadFailed", { name: (file as File).name }));
      }
    },
    beforeUpload: (file) => {
      const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-mpeg', 'audio/x-mp3'];
      const isValidFormat = allowedAudioTypes.includes(file.type);
      if (!isValidFormat) {
        message.error(t("invalidAudioFormat"));
      }
      const isLt100M = file.size <= 100 * 1024 * 1024;
      if (!isLt100M) {
        message.error(t("audioSizeLimit"));
      }
      return isValidFormat && isLt100M;
    },
    showUploadList: false,
    accept: 'audio/mpeg, audio/wav'
  };

  const imageUploadProps: UploadProps = {
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      try {
        const uploader = uploadImageFn || uploadImage;
        const response = await uploader(file as File);
        onImageChange?.(response.url);
        onSuccess?.("ok");
        message.success(t("uploadSuccess", { name: (file as File).name }));
      } catch (error: any) {
        onError?.(error);
        message.error(t("uploadFailed", { name: (file as File).name }));
      }
    },
    beforeUpload: (file) => {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const isValidFormat = allowedImageTypes.includes(file.type);
      if (!isValidFormat) {
        message.error(t("invalidImageFormat"));
      }
      const isLt100M = file.size <= 100 * 1024 * 1024;
      if (!isLt100M) {
        message.error(t("imageSizeLimit"));
      }
      return isValidFormat && isLt100M;
    },
    showUploadList: false,
    accept: 'image/jpeg, image/png, image/webp'
  };


  return (
    <div className={cn(
      "grid grid-cols-1 gap-4",
      (!hideAudio && !hideImage) && "sm:grid-cols-2"
    )}>
      {/* Audio Upload */}
      {!hideAudio && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 mb-2">
            <Music className="w-3.5 h-3.5 text-primary" /> {t("audioFile")}
          </Label>
          
          <div className="flex flex-col gap-2">
            <Upload {...audioUploadProps}>
              <Button variant="outline" type="button" className="w-full">
                <UploadIcon className="w-4 h-4 mr-2" />
                {t("uploadAudio")}
              </Button>
            </Upload>

            {audioUrl && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate">{t("audioPreview")}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAudioChange?.(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                   <audio controls src={getMediaUrl(audioUrl)} className="w-full h-10" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Upload */}
      {!hideImage && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-primary" /> {t("image")}
          </Label>
          
          <div className="flex flex-col gap-2">
            <Upload {...imageUploadProps}>
              <Button variant="outline" type="button" className="w-full">
                <UploadIcon className="w-4 h-4 mr-2" />
                {t("uploadImage")}
              </Button>
            </Upload>

            {imageUrl && (
              <div className="rounded-lg border border-border bg-muted/50 p-2 relative group mt-2">
                <img src={getMediaUrl(imageUrl)} alt={t("questionPreviewAlt")} className="w-full h-auto object-contain max-h-[150px] rounded" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 absolute top-1 right-1 opacity-100 transition-opacity shadow-md"
                  onClick={() => onImageChange?.(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
