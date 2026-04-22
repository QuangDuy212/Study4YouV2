import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileDown,
  Filter,
  MoreVertical,
  User,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentService.getAllPaymentsForAdmin();
      setPayments(data);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await paymentService.adminConfirmPayment(id);
      toast.success("Payment approved! Course unlocked for user.");
      loadPayments();
    } catch (error) {
      toast.error("Failed to approve payment");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await paymentService.exportPayments();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_report_${format(new Date(), "yyyyMMdd")}.csv`;
      a.click();
    } catch (error) {
      toast.error("Failed to export payments");
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.courseTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (p.referenceCode?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.transactionRef?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><CheckCircle2 className="w-3 h-3"/> SUCCESS</Badge>;
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><Clock className="w-3 h-3"/> PENDING</Badge>;
      default: return <Badge variant="outline" className="rounded-xl font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Payment Management</h1>
          <p className="text-muted-foreground text-sm">Review, approve, and audit all transaction records.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-2xl gap-2 border-border/50 h-12"
          onClick={handleExport}
        >
          <FileDown className="w-4 h-4" />
          Export All CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Course, Ref, or User Email..."
            className="pl-12 h-14 rounded-2xl border-border/50 bg-card shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {["ALL", "PENDING", "SUCCESS"].map(s => (
             <Button 
               key={s}
               onClick={() => setFilterStatus(s)}
               variant={filterStatus === s ? "default" : "outline"}
               className="h-14 rounded-2xl px-6 font-bold"
             >
               {s}
             </Button>
           ))}
        </div>
      </div>

      <div className="glass-card-premium rounded-[2.5rem] border border-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Detail</th>
                <th className="p-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Course & Amount</th>
                <th className="p-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">User Info</th>
                <th className="p-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence>
                {paginatedPayments.map((p, i) => (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-muted/20 transition-all"
                  >
                    <td className="p-6">
                       <div className="space-y-1">
                          <p className="font-mono text-sm font-black text-primary bg-primary/5 px-2 py-0.5 rounded inline-block">{p.referenceCode || "NO-CODE"}</p>
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
                            onClick={() => handleApprove(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 py-2 text-xs"
                         >
                            Approve
                         </Button>
                       ) : (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/50">
                               <DropdownMenuItem className="rounded-xl focus:bg-primary/10 focus:text-primary font-bold cursor-pointer">
                                  View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem className="rounded-xl focus:bg-destructive/10 focus:text-destructive font-bold cursor-pointer">
                                  Refund
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredPayments.length === 0 && !isLoading && (
            <div className="p-20 text-center space-y-4">
               <div className="w-20 h-20 rounded-[2.5rem] bg-muted mx-auto flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground/30" />
               </div>
               <p className="text-muted-foreground font-bold">No payments found</p>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-muted/10 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 rounded-lg p-0 font-bold"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
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
