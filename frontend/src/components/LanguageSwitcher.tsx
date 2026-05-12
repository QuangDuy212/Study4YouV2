import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
];

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-200">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-card border border-border">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => setLang(l.value)}
            className={cn(
              "flex items-center gap-3 cursor-pointer transition-all duration-200",
              lang === l.value && "bg-primary/10 text-primary font-medium"
            )}
          >
            <span className="text-lg">{l.flag}</span>
            <span>{l.label}</span>
            {lang === l.value && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
