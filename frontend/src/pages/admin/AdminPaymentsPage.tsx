import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  MoreVertical,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import paymentService from "@/services/paymentService";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState<any | null>(null);

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

  useEffect(() => {
    setCurrentPage(1);
    setSelectedPaymentIds(new Set());
  }, [debouncedSearchTerm, filterStatus]);

  const toggleSelectAll = () => {
    const allSelected = paginatedPayments.length > 0 && paginatedPayments.every(p => selectedPaymentIds.has(p.id));
    const next = new Set(selectedPaymentIds);
    if (allSelected) {
      paginatedPayments.forEach(p => next.delete(p.id));
    } else {
      paginatedPayments.forEach(p => next.add(p.id));
    }
    setSelectedPaymentIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedPaymentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPaymentIds(next);
  };

  const handleBulkApprove = async () => {
    const pendingSelected = Array.from(selectedPaymentIds).filter(id => {
      const p = payments.find(pay => pay.id === id);
      return p && p.status === "PENDING";
    });

    if (pendingSelected.length === 0) {
      toast.warning("Không có giao dịch 'Chờ duyệt' nào được chọn!");
      return;
    }

    if (!window.confirm(`Xác nhận phê duyệt đồng loạt ${pendingSelected.length} giao dịch đang chờ?`)) return;

    setIsBulkLoading(true);
    try {
      await Promise.all(pendingSelected.map(id => paymentService.adminConfirmPayment(id)));
      toast.success("Đã phê duyệt đồng loạt thành công!");
      setSelectedPaymentIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    } catch (e) {
      toast.error("Có lỗi xảy ra khi phê duyệt một số giao dịch!");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><CheckCircle2 className="w-3 h-3"/> {t("success")}</Badge>;
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 px-3 py-1 font-bold rounded-xl"><Clock className="w-3 h-3"/> {t("pending")}</Badge>;
      default: return <Badge variant="outline" className="rounded-xl font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>{t("paymentManagement")}</CardTitle>
            <CardDescription>{t("paymentManagementDesc")}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="rounded-xl gap-2 h-10 font-bold shadow-sm"
            onClick={handleExport}
          >
            <FileDown className="w-4 h-4" />
            {t("exportAllCsv")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t("searchPaymentsPlaceholder")}
                className="pl-10 h-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
               {["ALL", "PENDING", "SUCCESS"].map(s => (
                 <Button 
                   key={s}
                   onClick={() => setFilterStatus(s)}
                   variant={filterStatus === s ? "default" : "ghost"}
                   className={`h-8 rounded-lg px-4 text-xs font-bold transition-all ${
                     filterStatus === s 
                       ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/15" 
                       : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                   }`}
                 >
                   {t(s.toLowerCase())}
                 </Button>
               ))}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedPaymentIds.size > 0 && (
            <div className="flex items-center justify-between p-4 mb-6 bg-primary/[0.03] border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">Đã chọn {selectedPaymentIds.size} giao dịch</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBulkApprove}
                  disabled={isBulkLoading}
                  className="rounded-lg font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all shadow-sm h-9 px-4"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Phê duyệt đồng loạt
                </Button>
              </div>
            </div>
          )}

          <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-6 w-12 text-center">
                      <Checkbox 
                        checked={paginatedPayments.length > 0 && paginatedPayments.every(p => selectedPaymentIds.has(p.id))}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("transactionDetail")}</th>
                    <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("courseAndAmount")}</th>
                    <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("userInfo")}</th>
                    <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("status")}</th>
                    <th className="p-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center text-sm text-muted-foreground">
                          {t("loading")}...
                        </td>
                      </tr>
                    ) : paginatedPayments.map((p) => (
                      <tr 
                        key={p.id}
                        className="group hover:bg-muted/20 transition-all"
                      >
                        <td className="p-6 w-12 text-center">
                          <Checkbox 
                            checked={selectedPaymentIds.has(p.id)}
                            onCheckedChange={() => toggleSelectOne(p.id)}
                          />
                        </td>
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 h-9 text-xs shadow-md shadow-emerald-600/20 transition-all"
                             >
                                {approveMutation.isPending ? "..." : t("approve")}
                             </Button>
                           ) : (
                             <Button 
                                variant="ghost" 
                                className="rounded-xl font-bold text-xs border border-border/50 hover:bg-primary/10 hover:text-primary h-9 transition-all px-4"
                                onClick={() => setSelectedPaymentForDetail(p)}
                             >
                                {t("viewDetails")}
                             </Button>
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
            {totalPages >= 1 && (
              <div className="p-6 bg-muted/10 border-t border-border/50 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  {t("showing")} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} {t("of")} {filteredPayments.length}
                </p>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? "default" : "ghost"}
                        size="sm"
                        className={`w-9 h-9 rounded-lg p-0 font-bold transition-all ${
                          currentPage === i + 1 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15" 
                            : "border border-border/50 hover:bg-primary/10 hover:text-primary"
                        }`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 rounded-lg p-0 font-bold transition-all hover:bg-primary/10 hover:text-primary border border-border/50 disabled:opacity-50 flex items-center justify-center"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Premium Transaction Details Dialog */}
      <Dialog open={!!selectedPaymentForDetail} onOpenChange={(open) => !open && setSelectedPaymentForDetail(null)}>
        <DialogContent className="max-w-xl rounded-[2rem] p-6 border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Chi tiết giao dịch thanh toán
            </DialogTitle>
            <DialogDescription>Thông tin chi tiết về hóa đơn khóa học và thanh toán</DialogDescription>
          </DialogHeader>
          {selectedPaymentForDetail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Mã hóa đơn</p>
                  <p className="font-mono text-sm font-bold text-primary">{selectedPaymentForDetail.referenceCode || "N/A"}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Trạng thái</p>
                  <div>{getStatusBadge(selectedPaymentForDetail.status)}</div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Thông tin khóa học & số tiền</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{selectedPaymentForDetail.courseTitle}</span>
                  </div>
                  <span className="font-black text-primary text-sm">{selectedPaymentForDetail.amount.toLocaleString()} VND</span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Thông tin khách hàng & giao dịch</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <p className="text-muted-foreground font-semibold">Mã khách hàng:</p>
                    <p className="font-mono font-bold text-foreground">{selectedPaymentForDetail.userId.slice(0, 16)}...</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Phương thức:</p>
                    <Badge variant="outline" className="font-bold text-[10px] uppercase">{selectedPaymentForDetail.paymentMethod}</Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground font-semibold">Mã tham chiếu ngân hàng (TxRef):</p>
                    <p className="font-mono text-foreground font-bold break-all">{selectedPaymentForDetail.transactionRef || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground font-semibold">Thời gian tạo:</p>
                    <p className="text-foreground font-bold">{selectedPaymentForDetail.createdAt ? format(new Date(selectedPaymentForDetail.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedPaymentForDetail.isVatRequired && (
                <div className="bg-blue-500/[0.03] border border-blue-500/10 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] uppercase font-black tracking-wider text-blue-600">Yêu cầu xuất hóa đơn VAT</p>
                  <div className="text-xs space-y-1">
                    <p className="text-foreground font-bold">🏢 {selectedPaymentForDetail.companyName}</p>
                    <p className="font-mono text-muted-foreground font-semibold">Mã số thuế: {selectedPaymentForDetail.taxCode}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
