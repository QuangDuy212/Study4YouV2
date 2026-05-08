import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  MoreVertical,
  User,
  BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import paymentService, { type PaymentResponse } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch payments with React Query
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: paymentService.getAllPaymentsForAdmin,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentService.adminConfirmPayment(id),
    onSuccess: () => {
      toast.success(t("paymentApproved"));
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: () => toast.error(t("failedToApprove")),
  });

  const handleExport = async () => {
    try {
      const blob = await paymentService.exportPayments();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_report_${format(new Date(), "yyyyMMdd")}.csv`;
      a.click();
    } catch (error) {
      toast.error(t("failedToExport"));
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        (p.courseTitle?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) || 
        (p.referenceCode?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (p.transactionRef?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [payments, debouncedSearchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPayments, currentPage]);

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><CheckCircle2 className="w-3 h-3"/> {t("success")}</Badge>;
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><Clock className="w-3 h-3"/> {t("pending")}</Badge>;
      default: return <Badge variant="outline" className="rounded-xl font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{t("paymentManagement")}</h1>
          <p className="text-muted-foreground text-sm">{t("paymentManagementDesc")}</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-2xl gap-2 border-border/50 h-12 font-bold shadow-sm"
          onClick={handleExport}
        >
          <FileDown className="w-4 h-4" />
          {t("exportAllCsv")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("searchPaymentsPlaceholder")}
            className="pl-12 h-14 rounded-2xl border-border/50 bg-card shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl border border-border/50">
           {["ALL", "PENDING", "SUCCESS"].map(s => (
             <Button 
               key={s}
               onClick={() => setFilterStatus(s)}
               variant={filterStatus === s ? "default" : "ghost"}
               className={`h-12 rounded-xl px-6 font-bold transition-all ${filterStatus === s ? "shadow-md" : ""}`}
             >
               {t(s.toLowerCase())}
             </Button>
           ))}
        </div>
      </div>

      <div className="glass-card-premium rounded-[2.5rem] border border-border/50 overflow-hidden shadow-xl bg-card/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("transactionDetail")}</th>
                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("courseAndAmount")}</th>
                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("userInfo")}</th>
                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("status")}</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
                {paginatedPayments.map((p) => (
                  <tr 
                    key={p.id}
                    className="group hover:bg-muted/20 transition-all"
                  >
                    <td className="p-6">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-black text-primary bg-primary/5 px-2 py-0.5 rounded inline-block">{p.referenceCode || "NO-CODE"}</p>
                            {p.isVatRequired && (
                              <Badge className="bg-blue-500 text-white border-none text-[8px] px-1 py-0 font-black">VAT</Badge>
                            )}
                          </div>
                          {p.isVatRequired && (
                            <div className="bg-blue-500/5 border border-blue-500/10 p-2 rounded-lg space-y-0.5 mb-2">
                               <p className="text-[9px] font-bold text-blue-600 line-clamp-1">🏢 {p.companyName}</p>
                               <p className="text-[9px] text-blue-500/70 font-mono">MST: {p.taxCode}</p>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground block">{(p.transactionRef || "").slice(0, 8)}...</p>
                          <p className="text-[10px] text-muted-foreground">{p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</p>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{p.paymentMethod}</Badge>
                       </div>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground line-clamp-1">{p.courseTitle}</p>
                            <p className="text-sm font-black text-primary">{p.amount.toLocaleString()} VND</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                             <User className="w-4 h-4 text-secondary-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">{p.userId.slice(0,8)}...</p>
                       </div>
                    </td>
                    <td className="p-6">
                       {getStatusBadge(p.status)}
                    </td>
                    <td className="p-6 text-right">
                       {p.status === "PENDING" ? (
                         <Button 
                            onClick={() => approveMutation.mutate(p.id)}
                            disabled={approveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-md shadow-emerald-600/20"
                         >
                            {approveMutation.isPending ? "..." : t("approve")}
                         </Button>
                       ) : (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/50 shadow-xl">
                               <DropdownMenuItem className="rounded-xl focus:bg-primary/10 focus:text-primary font-bold cursor-pointer">
                                  {t("viewDetails")}
                               </DropdownMenuItem>
                               <DropdownMenuItem className="rounded-xl focus:bg-destructive/10 focus:text-destructive font-bold cursor-pointer text-destructive">
                                  {t("refund")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && !isLoading && (
            <div className="p-20 text-center space-y-4">
               <div className="w-20 h-20 rounded-[2.5rem] bg-muted mx-auto flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground/30" />
               </div>
               <p className="text-muted-foreground font-bold">{t("noPaymentsFound")}</p>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-muted/10 border-t border-border/50 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold h-9 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    className={`w-9 h-9 rounded-xl p-0 font-bold transition-all ${
                      currentPage === i + 1 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15" 
                        : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold h-9 transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
