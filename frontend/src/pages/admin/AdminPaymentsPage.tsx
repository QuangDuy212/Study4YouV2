import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Shield
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import paymentService from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
    staleTime: 30000,
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

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => p.status === "SUCCESS" ? acc + p.amount : acc, 0);
    const pendingCount = payments.filter(p => p.status === "PENDING").length;
    const totalCount = payments.filter(p => p.status === "SUCCESS").length;
    return { totalRevenue, pendingCount, totalCount };
  }, [payments]);

  return (
    <div className="space-y-6 pb-24">
      {/* Statistics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t("totalRevenue")}</CardDescription>
            <CardTitle className="text-3xl font-black text-primary flex items-baseline gap-1">
              {stats.totalRevenue.toLocaleString()} 
              <span className="text-sm opacity-50 font-bold">VND</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               Hoàn thành: {stats.totalCount} giao dịch
             </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">{t("pendingApprovals")}</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600 flex items-center gap-3">
              {stats.pendingCount}
              <Clock className="w-6 h-6 opacity-30" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
               Cần xử lý gấp
             </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Hệ thống</CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Cập nhật: {format(new Date(), "HH:mm")}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-border/50 bg-muted/10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="relative flex-1 max-w-md w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder={t("searchPaymentsPlaceholder")}
                  className="pl-10 h-11 rounded-xl bg-background border-border/50 focus:border-primary/50 transition-all shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
                   {["ALL", "PENDING", "SUCCESS"].map(s => (
                     <Button 
                       key={s}
                       onClick={() => setFilterStatus(s)}
                       variant={filterStatus === s ? "default" : "ghost"}
                       className={`h-9 rounded-lg px-5 text-xs font-bold transition-all ${
                         filterStatus === s 
                           ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/15" 
                           : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                       }`}
                     >
                       {t(s.toLowerCase())}
                     </Button>
                   ))}
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl gap-2 h-11 font-bold border-border/50 hover:bg-muted transition-all px-5 ml-auto lg:ml-0"
                  onClick={handleExport}
                >
                  <FileDown className="w-4 h-4 text-primary" />
                  {t("exportAllCsv")}
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar - Only show when in PENDING tab */}
          {filterStatus === "PENDING" && selectedPaymentIds.size > 0 && (
            <div className="mx-6 mt-6 flex items-center justify-between p-4 bg-primary/[0.03] border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">Đã chọn {selectedPaymentIds.size} giao dịch chờ duyệt</span>
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

          <div className="p-6">
            <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    {filterStatus === "PENDING" && (
                      <TableHead className="w-12 text-center">
                        <Checkbox 
                          checked={paginatedPayments.length > 0 && paginatedPayments.every(p => selectedPaymentIds.has(p.id))}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("courses")}</TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("price")}</TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("userInfo")}</TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("status")}</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={filterStatus === "PENDING" ? 6 : 5} className="h-40 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                             {t("loading")}...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={filterStatus === "PENDING" ? 6 : 5} className="h-60 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-muted mx-auto flex items-center justify-center">
                              <CreditCard className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground font-bold">{t("noPaymentsFound")}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedPayments.map((p) => (
                      <TableRow 
                        key={p.id}
                        className={cn(
                          "group transition-colors",
                          selectedPaymentIds.has(p.id) ? "bg-primary/[0.02]" : "hover:bg-muted/30"
                        )}
                      >
                        {filterStatus === "PENDING" && (
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedPaymentIds.has(p.id)}
                              onCheckedChange={() => toggleSelectOne(p.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 overflow-hidden border border-border/50">
                               {p.thumbnailUrl ? (
                                 <img src={p.thumbnailUrl} alt={p.courseTitle} className="w-full h-full object-cover" />
                               ) : (
                                 <BookOpen className="w-6 h-6" />
                               )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-foreground leading-none">{p.courseTitle}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground font-bold">{p.referenceCode}</span>
                                <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 uppercase">{p.paymentMethod}</Badge>
                              </div>
                              {p.isVatRequired && (
                                <p className="text-[9px] font-bold text-blue-600 flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5" /> VAT Required
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-black text-primary">{p.amount.toLocaleString()} <span className="text-[10px] opacity-70">₫</span></p>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                                 <User className="w-3.5 h-3.5 text-secondary-foreground" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">{p.userId.slice(0,8)}...</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           {getStatusBadge(p.status)}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              {p.status === "PENDING" && (
                                <Button 
                                   size="sm"
                                   variant="outline"
                                   onClick={() => approveMutation.mutate(p.id)}
                                   disabled={approveMutation.isPending}
                                   className="h-8 rounded-lg bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 transition-all px-3 font-bold gap-1 shadow-sm"
                                >
                                   <Check className="w-3.5 h-3.5" /> Duyệt
                                </Button>
                              )}
                              <Button 
                                 size="icon"
                                 variant="ghost" 
                                 className="h-8 w-8 rounded-lg hover:bg-primary/5 text-primary hover:text-primary/80 transition-all border border-transparent hover:border-primary/20"
                                 onClick={() => setSelectedPaymentForDetail(p)}
                              >
                                 <Eye className="w-4 h-4" />
                              </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages >= 1 && (
        <div className="p-6 bg-muted/10 border border-t-0 border-border/50 rounded-b-xl flex items-center justify-between">
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
                  <p className="font-mono font-bold text-primary">{selectedPaymentForDetail.referenceCode}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1 text-right">
                  <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Trạng thái</p>
                  <div className="flex justify-end">{getStatusBadge(selectedPaymentForDetail.status)}</div>
                </div>
              </div>

              <div className="border border-border/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedPaymentForDetail.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">Thanh toán khóa học</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <p className="text-muted-foreground font-semibold">Số tiền:</p>
                    <p className="text-primary font-black text-sm">{selectedPaymentForDetail.amount.toLocaleString()} VND</p>
                  </div>
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
