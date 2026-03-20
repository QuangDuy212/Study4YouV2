import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldAlert className="w-16 h-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">403</h1>
          <h2 className="text-2xl font-semibold text-foreground">{t("forbidden")}</h2>
          <p className="text-muted-foreground">
            {t("forbiddenDesc")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" className="gap-2" onClick={() => navigate("/admin")}>
            {t("backToDashboard")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
