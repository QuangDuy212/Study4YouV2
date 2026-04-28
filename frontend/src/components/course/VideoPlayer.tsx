import { useState, useRef, useEffect } from "react";
import { getMediaUrl } from "@/lib/utils";
import { Lock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
  isPreview?: boolean;
}

export function VideoPlayer({ videoUrl, title, isPreview = false }: VideoPlayerProps) {
    const { t } = useLanguage();
    const [previewEnded, setPreviewEnded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const PREVIEW_LIMIT = 30; // 30 seconds

    useEffect(() => {
      // Reset state when video changes
      setPreviewEnded(false);
    }, [videoUrl]);

    if (!videoUrl) {
      return (
        <div className="w-full aspect-video bg-muted/80 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-border shadow-inner">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
             <svg className="w-8 h-8 text-primary" viewBox="0 0 64 64" fill="none">
               <circle cx="32" cy="32" r="32" fill="currentColor" fillOpacity="0.2" />
               <path d="M26 20l20 12-20 12V20z" fill="currentColor" />
             </svg>
          </div>
          <p className="text-muted-foreground font-medium">{t("lessonPlaceholder")}</p>
        </div>
      );
    }

    const handleTimeUpdate = () => {
      if (isPreview && videoRef.current && videoRef.current.currentTime >= PREVIEW_LIMIT) {
        videoRef.current.pause();
        videoRef.current.currentTime = PREVIEW_LIMIT;
        setPreviewEnded(true);
      }
    };
  
    // YouTube embed support
    const ytMatch = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) {
      return (
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
          <iframe
            id="video-player-iframe"
            src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0${isPreview ? `&end=${PREVIEW_LIMIT}` : ""}`}
            title={title}
            className="absolute inset-0 w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {isPreview && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none uppercase tracking-widest z-10">
              {t("previewMode")}
            </div>
          )}
        </div>
      );
    }
  
    // Vimeo embed support
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return (
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
          <iframe
            id="video-player-iframe"
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
            title={title}
            className="absolute inset-0 w-full h-full border-none"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  
    // Native video fallback
    return (
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group flex items-center justify-center">
        <video
          ref={videoRef}
          id="video-player-native"
          src={getMediaUrl(videoUrl)}
          controls={!previewEnded}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full outline-none object-contain"
          aria-label={title}
        />
        
        {isPreview && !previewEnded && (
          <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none uppercase tracking-widest z-10 animate-pulse">
            {t("previewMode")}
          </div>
        )}

        {previewEnded && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center text-center p-6 z-20 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("previewEnded")}</h3>
            <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
              {t("previewEndedDesc")}
            </p>
            <Button onClick={() => window.location.href = `/courses/${window.location.pathname.split("/")[2]}`} className="gap-2">
              <ShoppingCart className="w-4 h-4" /> {t("enrollToContinue")}
            </Button>
          </div>
        )}
      </div>
    );
  }
