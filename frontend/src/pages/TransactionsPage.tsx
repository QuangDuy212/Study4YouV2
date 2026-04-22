import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Download,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import paymentService, { type PaymentResponse } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await paymentService.getPaymentHistory();
      setTransactions(data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "PENDING": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "FAILED": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "PENDING": return <Clock className="w-3.5 h-3.5" />;
      case "FAILED": return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.transactionRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t("billingHistory") || "Transaction History"}</h1>
          <p className="text-muted-foreground">{t("manageInvoices") || "View and manage your course enrollments and payments"}</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl gap-2 border-border/50">
             <Download className="w-4 h-4" />
             {t("export") || "Export"}
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Spent", value: `${transactions.filter(t => t.status === "SUCCESS").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} VND`, icon: ArrowUpRight, color: "text-primary bg-primary/10" },
          { label: "Pending Orders", value: transactions.filter(t => t.status === "PENDING").length, icon: Clock, color: "text-amber-600 bg-amber-500/10" },
          { label: "Total Courses", value: transactions.filter(t => t.status === "SUCCESS").length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 glass-card-premium rounded-[2rem] border border-border/50 flex items-center gap-4"
          >
            <div className={`p-4 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("searchTransactions") || "Search by course or reference..."}
            className="pl-12 h-14 rounded-2xl border-border/50 bg-card shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 w-14 rounded-2xl border-border/50 p-0">
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="glass-card-premium rounded-[2.5rem] border border-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="p-6 text-sm font-bold text-muted-foreground">ID & Date</th>
                <th className="p-6 text-sm font-bold text-muted-foreground">Course</th>
                <th className="p-6 text-sm font-bold text-muted-foreground">Amount</th>
                <th className="p-6 text-sm font-bold text-muted-foreground">Method</th>
                <th className="p-6 text-sm font-bold text-muted-foreground">Status</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-8">
                       <div className="h-10 bg-muted rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="space-y-3">
                      <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                      <p className="text-muted-foreground font-medium">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, i) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground font-mono">{tx.transactionRef}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tx.courseTitle}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-black text-foreground">{tx.amount.toLocaleString()} VND</p>
                    </td>
                    <td className="p-6">
                       <Badge variant="outline" className="rounded-lg font-bold text-[10px] uppercase tracking-wider bg-secondary/50 border-border/50">
                          {tx.paymentMethod}
                       </Badge>
                    </td>
                    <td className="p-6">
                      <Badge className={`rounded-xl gap-1.5 px-3 py-1 font-bold border ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-6 text-right">
                       <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary rounded-xl">
                          <ExternalLink className="w-4 h-4" />
                       </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
