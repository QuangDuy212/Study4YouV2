import { motion } from "framer-motion";
import { FileText, CheckCircle, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SummaryCard {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
  color: "primary" | "success" | "warning";
}

interface AdminSummaryCardsProps {
  tests: {
    status: "active" | "draft" | "archived";
  }[];
}

const colorStyles = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "border-primary/20",
  },
  success: {
    bg: "bg-success/10",
    icon: "text-success",
    border: "border-success/20",
  },
  warning: {
    bg: "bg-warning/10",
    icon: "text-warning",
    border: "border-warning/20",
  },
};

export default function AdminSummaryCards({ tests }: AdminSummaryCardsProps) {
  const { t } = useLanguage();

  const totalTests = tests.length;
  const activeTests = tests.filter(t => t.status === "active").length;
  const draftTests = tests.filter(t => t.status === "draft" || t.status === "archived").length;

  const summaryCards: SummaryCard[] = [
    {
      icon: FileText,
      title: t('totalTests'),
      value: totalTests,
      description: t('allCreatedTests'),
      color: "primary",
    },
    {
      icon: CheckCircle,
      title: t('activeTests'),
      value: activeTests,
      description: t('publishedAvailable'),
      color: "success",
    },
    {
      icon: FileEdit,
      title: t('draftTests'),
      value: draftTests,
      description: t('workInProgress'),
      color: "warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {summaryCards.map((card, index) => {
        const styles = colorStyles[card.color];
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className={cn("border", styles.border, "hover:shadow-card-hover transition-shadow duration-300")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2.5 rounded-xl", styles.bg)}>
                    <card.icon className={cn("w-5 h-5", styles.icon)} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold font-display text-foreground">{card.value}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
