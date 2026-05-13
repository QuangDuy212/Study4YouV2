import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
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
// @ts-ignore
import html2pdf from "html2pdf.js";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function docSoThienVND(number: number): string {
  if (number === 0) return "Không đồng";
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  
  function readThreeDigits(n: number, isFirstGroup: boolean): string {
    let res = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (h > 0 || !isFirstGroup) {
      res += digits[h] + " trăm ";
    }
    
    if (t > 0) {
      res += digits[t] + " mươi ";
    } else if (h > 0 && u > 0) {
      res += "lẻ ";
    }
    
    if (t > 0 && u === 1) {
      res += "mốt";
    } else if (t > 0 && u === 5) {
      res += "lăm";
    } else if (u > 0 || (h === 0 && t === 0 && isFirstGroup)) {
      res += digits[u];
    }
    
    return res.trim();
  }

  let res = "";
  let unitIdx = 0;
  let n = number;
  
  while (n > 0) {
    const group = n % 1000;
    if (group > 0) {
      const groupStr = readThreeDigits(group, n < 1000);
      res = groupStr + " " + units[unitIdx] + " " + res;
    }
    n = Math.floor(n / 1000);
    unitIdx++;
  }
  
  const final = res.trim();
  return final.charAt(0).toUpperCase() + final.slice(1) + " đồng chẵn";
}

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<PaymentResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleDownloadInvoice = (tx: PaymentResponse) => {
    setSelectedTx(tx);
    
    // Wait for state update and DOM render
    setTimeout(() => {
      const element = document.getElementById("invoice-template");
      if (!element) return;
      
      const opt = {
        margin: 10,
        filename: `Invoice_${tx.referenceCode || tx.id.slice(0,8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        setSelectedTx(null);
      });
    }, 100);
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

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    
    return pages.map((page, index) => {
      if (page === "ellipsis") {
        return (
          <PaginationItem key={`ellipsis-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={page}>
          <PaginationLink
            href="#"
            isActive={currentPage === page}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(page as number);
            }}
            className={cn(
              "cursor-pointer rounded-xl font-bold h-10 w-10 transition-all border",
              currentPage === page 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md shadow-primary/15 border-transparent" 
                : "border-border/50 hover:bg-primary/10 hover:text-primary"
            )}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

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
                currentTransactions.map((tx, i) => (
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
                       <div className="flex justify-end gap-2">
                          {(tx.status?.toUpperCase() === "SUCCESS") && (
                            <Button 
                              onClick={() => handleDownloadInvoice(tx)}
                              variant="outline" 
                              size="sm"
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl font-bold gap-2"
                            >
                               <Download className="w-4 h-4" />
                               Tải về
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary rounded-xl">
                             <ExternalLink className="w-4 h-4" />
                          </Button>
                       </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="p-6 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={cn(
                      "rounded-xl font-bold cursor-pointer border border-border/50 transition-all hover:bg-primary/10 hover:text-primary",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                
                {renderPageNumbers()}

                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={cn(
                      "rounded-xl font-bold cursor-pointer border border-border/50 transition-all hover:bg-primary/10 hover:text-primary",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Hidden Invoice Template for PDF Generation */}
      {selectedTx && (
        <div className="fixed -left-[9999px] top-0">
          <div id="invoice-template" className="w-[210mm] bg-white p-[20mm] text-black" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
             <div className="text-center mb-8" style={{ textAlign: 'center' }}>
                <h1 className="text-3xl font-bold uppercase" style={{ margin: '0 0 10px 0', fontSize: '28px' }}>HÓA ĐƠN THANH TOÁN</h1>
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', marginTop: '-30px' }}>
                   <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: '0' }}>Ký hiệu: S4Y-2026</p>
                      <p style={{ margin: '0' }}>Số: {selectedTx.referenceCode?.replace(/\s/g, '') || selectedTx.id.slice(0,8).toUpperCase()}</p>
                   </div>
                </div>
                <p style={{ fontStyle: 'italic', margin: '20px 0 0 0' }}>Ngày {format(new Date(selectedTx.createdAt), 'dd')} tháng {format(new Date(selectedTx.createdAt), 'MM')} năm {format(new Date(selectedTx.createdAt), 'yyyy')}</p>
             </div>

             <div style={{ borderTop: '2px solid black', borderBottom: '1px solid black', padding: '15px 0', marginBottom: '20px', fontSize: '14px' }}>
                <p style={{ margin: '2px 0' }}><strong>Tên người bán:</strong> CÔNG TY TNHH STUDY4YOU</p>
                <p style={{ margin: '2px 0' }}><strong>Mã số thuế:</strong> 010123456789</p>
                <p style={{ margin: '2px 0' }}><strong>Địa chỉ:</strong> Số 1, Đường Đại Cồ Việt, Quận Hai Bà Trưng, TP. Hà Nội</p>
                <p style={{ margin: '2px 0' }}><strong>Số tài khoản:</strong> 1234567890 - Ngân hàng Techcombank</p>
             </div>

             <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <p style={{ margin: '2px 0' }}><strong>Họ tên người mua hàng:</strong> Học viên Study4You</p>
                <p style={{ margin: '2px 0' }}><strong>Tên đơn vị:</strong> {selectedTx.isVatRequired ? selectedTx.companyName : "..........................................................................................."}</p>
                <p style={{ margin: '2px 0' }}><strong>Địa chỉ:</strong> .............................................................................................................................</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                   <p style={{ margin: '0', flex: '1' }}><strong>Hình thức thanh toán:</strong> {selectedTx.paymentMethod}</p>
                   <p style={{ margin: '0', flex: '1' }}><strong>MST:</strong> {selectedTx.isVatRequired ? selectedTx.taxCode : "..................................."}</p>
                   <p style={{ margin: '0', width: '100px' }}><strong>Tiền tệ:</strong> VNĐ</p>
                </div>
             </div>

             <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '14px', marginBottom: '20px' }}>
                <thead>
                   <tr style={{ backgroundColor: '#f2f2f2' }}>
                      <th style={{ border: '1px solid black', padding: '10px', width: '50px', textAlign: 'center' }}>STT</th>
                      <th style={{ border: '1px solid black', padding: '10px', textAlign: 'left' }}>Tên hàng hóa, dịch vụ</th>
                      <th style={{ border: '1px solid black', padding: '10px', width: '100px', textAlign: 'center' }}>Đơn vị</th>
                      <th style={{ border: '1px solid black', padding: '10px', width: '70px', textAlign: 'center' }}>SL</th>
                      <th style={{ border: '1px solid black', padding: '10px', width: '120px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ border: '1px solid black', padding: '10px', width: '120px', textAlign: 'right' }}>Thành tiền</th>
                   </tr>
                </thead>
                <tbody>
                   <tr style={{ height: '50px' }}>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>1</td>
                      <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold' }}>{selectedTx.courseTitle}</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>Khóa học</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>1</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{selectedTx.amount.toLocaleString()}</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{selectedTx.amount.toLocaleString()}</td>
                   </tr>
                </tbody>
             </table>

             <div style={{ fontSize: '15px', marginTop: '20px' }}>
                <p style={{ margin: '5px 0' }}><strong>Tổng tiền thanh toán:</strong> <span style={{ fontSize: '18px' }}>{selectedTx.amount.toLocaleString()} VNĐ</span></p>
                <p style={{ margin: '5px 0', fontStyle: 'italic' }}><strong>Số tiền viết bằng chữ:</strong> {docSoThienVND(selectedTx.amount)}</p>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '14px' }}>
                <div style={{ textAlign: 'center', width: '250px' }}>
                   <p style={{ fontWeight: 'bold', margin: '0' }}>Người mua hàng</p>
                   <p style={{ fontStyle: 'italic', fontSize: '12px', margin: '0' }}>(Ký, ghi rõ họ tên)</p>
                </div>
                <div style={{ textAlign: 'center', width: '250px', position: 'relative' }}>
                   <p style={{ fontWeight: 'bold', margin: '0' }}>Người bán hàng</p>
                   <p style={{ fontStyle: 'italic', fontSize: '12px', margin: '0' }}>(Ký, đóng dấu, ghi rõ họ tên)</p>
                   
                   {/* Giả lập dấu mộc Study4You */}
                   <div style={{ 
                      marginTop: '20px', 
                      color: 'red', 
                      border: '3px solid red', 
                      padding: '5px 15px', 
                      display: 'inline-block', 
                      borderRadius: '10px',
                      transform: 'rotate(-5deg)',
                      fontWeight: 'black',
                      fontSize: '16px',
                      opacity: '0.8'
                   }}>
                      STUDY4YOU
                   </div>
                </div>
             </div>

             <div style={{ textAlign: 'center', marginTop: '80px', fontSize: '11px', fontStyle: 'italic', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                <p>(Cần kiểm tra, đối chiếu khi lập, nhận hóa đơn)</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
