import { useRef } from "react";
import { Upload, Image, Music, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ListeningMediaUploaderProps {
  audioUrl: string | null;
  imageUrl: string | null;
  onAudioChange: (url: string | null) => void;
  onImageChange: (url: string | null) => void;
}

export default function ListeningMediaUploader({
  audioUrl,
  imageUrl,
  onAudioChange,
  onImageChange,
}: ListeningMediaUploaderProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAudioChange(url);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageChange(url);
    }
  };

  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Audio Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-primary" /> Audio File
        </Label>
        {audioUrl ? (
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">Audio loaded</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAudioChange(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full w-0" />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-5 h-5" />
            <span className="text-xs">Upload MP3</span>
          </button>
        )}
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioSelect} />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-primary" /> Image
        </Label>
        {imageUrl ? (
          <div className="rounded-lg border border-border bg-muted/50 p-2 relative group">
            <img src={imageUrl} alt="Question" className="w-full h-20 object-cover rounded" />
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onImageChange(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Image className="w-5 h-5" />
            <span className="text-xs">Upload Image</span>
          </button>
        )}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      </div>
    </div>
  );
}
