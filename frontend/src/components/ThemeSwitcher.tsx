import { useTheme, Theme } from "@/contexts/ThemeContext";
import { Sun, Moon, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes: { value: Theme; label: string; color: string }[] = [
  { value: "light", label: "Light", color: "bg-white border border-border" },
  { value: "dark", label: "Dark", color: "bg-zinc-900" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-emerald-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const currentIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Palette;
  const Icon = currentIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-200">
          <Icon className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-card border border-border">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex items-center gap-3 cursor-pointer transition-all duration-200",
              theme === t.value && "bg-primary/10 text-primary font-medium"
            )}
          >
            <div className={cn("w-4 h-4 rounded-full shadow-sm", t.color)} />
            <span>{t.label}</span>
            {theme === t.value && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSwitcher;
