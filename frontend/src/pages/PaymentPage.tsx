import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import courseService, { type CourseResponse } from "@/services/courseService";
import paymentService, { type PaymentMethod } from "@/services/paymentService";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, ChevronLeft, GraduationCap, Building2, CheckCircle2, Ticket, Lock, Zap, RefreshCw, Copy, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { BANK_CONFIG } from "@/config/paymentConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

function formatPrice(price: number, t: (k: string) => string): string {
  if (price === 0) return t("free");
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function PaymentPage() {
  const { t } = useLanguage();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("MOCK");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [eduEmail, setEduEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showVat, setShowVat] = useState(false);
  const [securityChecked, setSecurityChecked] = useState(false);
  const [showVietQR, setShowVietQR] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);

  useEffect(() => {
    if (!courseId) return;
    courseService.getCourseDetail(courseId)
      .then(c => {
        if (c.enrolled) {
          toast.info("You are already enrolled in this course");
          navigate(`/learn/${courseId}`);
          return;
        }
        setCourse(c);
      })
      .catch(() => toast.error(t("noResultsFound")))
      .finally(() => setLoading(false));
  }, [courseId, navigate, t]);

  const handleVerifyStudent = () => {
    if (!eduEmail.endsWith(".edu") && !eduEmail.endsWith(".edu.vn")) {
      toast.error("Please enter a valid school email (@school.edu.vn)");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setIsStudent(true);
      setVerifying(false);
      toast.success(t("verifiedStudent"));
    }, 1500);
  };

  const finalPrice = isStudent ? 0 : (course?.price || 0);

  const handlePay = async () => {
    if (!courseId) return;
    setPaying(true);
    try {
      const payment = await paymentService.createPayment({ courseId, paymentMethod: method });
      setCurrentPayment(payment);

      if (method === "VIETQR") {
        setShowVietQR(true);
        setPaying(false);
        return;
      }
      
      if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
          return;
      }

      if (payment.status === "SUCCESS") {
        // Free or already auto-confirmed
        toast.success(t("success"));
        navigate(`/learn/${courseId}`);
        return;
      }

      // Mock confirmation
      toast.loading(t("processing"), { id: "pay" });
      const confirmed = await paymentService.confirmPayment(payment.id);
      toast.dismiss("pay");

      if (confirmed.status === "SUCCESS") {
        toast.success("Payment confirmed! You are now enrolled 🎉");
        navigate(`/learn/${courseId}`);
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-page__loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="payment-page">
        <div className="error-state">
          <h2>Course not found</h2>
          <Link to="/courses">Browse Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background premium-gradient-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link to={`/courses/${courseId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("back")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Side: Checkout Details */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-black tracking-tight text-foreground">{t("paymentCheckout")}</h1>
              
              {/* Student Discount Section */}
              {!isStudent ? (
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <GraduationCap size={80} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-2">
                       <Ticket className="w-5 h-5" />
                       {t("studentVerification")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">{t("isStudentDesc")}</p>
                    <div className="flex gap-2 max-w-sm">
                      <Input 
                        placeholder={t("academicEmailPlaceholder")} 
                        className="rounded-xl border-primary/20 bg-background/50 focus:ring-primary/20"
                        value={eduEmail}
                        onChange={(e) => setEduEmail(e.target.value)}
                      />
                      <button 
                        onClick={handleVerifyStudent}
                        disabled={verifying}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      >
                        {verifying ? t("processing") : t("verifyNow")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                         <CheckCircle2 />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-600 dark:text-emerald-400">{t("verifiedStudent")}</h3>
                        <p className="text-sm text-emerald-600/70">{eduEmail}</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="bg-emerald-500 text-white border-none px-3 py-1 font-bold">100% OFF</Badge>
                </motion.div>
              )}

              {/* Billing Info */}
              <div className="glass-card-premium rounded-[2rem] p-8 space-y-8 border border-border/50">
                <div className="flex flex-col gap-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Building2 className="w-5 h-5 text-primary" />
                    {t("billingDetails")}
                  </h3>
                  
                  <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
                    <Checkbox 
                      id="vat-check" 
                      checked={showVat}
                      onCheckedChange={(checked) => setShowVat(checked as boolean)}
                    />
                    <Label htmlFor="vat-check" className="font-medium cursor-pointer">{t("vatInvoice")}</Label>
                  </div>

                  <AnimatePresence>
                    {showVat && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>{t("companyName")}</Label>
                              <Input placeholder="Study4You Corp" className="rounded-xl" />
                           </div>
                           <div className="space-y-2">
                              <Label>{t("taxCode")}</Label>
                              <Input placeholder="0123456789" className="rounded-xl" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Secure Free Enrollment Check - Only shows if price is 0 */}
                {finalPrice === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                         <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-600 truncate text-sm">{t("secureEnrollment")}</h4>
                        <p className="text-[10px] text-emerald-600/70">{t("privacyProtected")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-background/50 rounded-xl border border-emerald-500/10">
                      <Checkbox 
                        id="security-check" 
                        checked={securityChecked}
                        onCheckedChange={(checked) => setSecurityChecked(checked as boolean)}
                      />
                      <Label htmlFor="security-check" className="text-xs font-bold text-emerald-700 cursor-pointer">{t("humanVerify")}</Label>
                    </div>

                    <div className="flex gap-4 pt-2">
                       <div className="flex items-center gap-1.5 grayscale opacity-50">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{t("identitySecurity")}</span>
                       </div>
                       <div className="flex items-center gap-1.5 grayscale opacity-50">
                          <Zap size={14} className="text-emerald-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{t("encryptedAccess")}</span>
                       </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="font-bold text-foreground">{t("paymentMethod")}</h3>
                  <div className="grid gap-3">
                    {[
                      { id: "VNPAY", title: t("vnpayGateway"), desc: t("vnpayDesc"), icon: "🏦" },
                      { id: "VIETQR", title: "VietQR", desc: t("vietqrDesc"), icon: "📲" },
                      { id: "MOMO", title: "MoMo Wallet", desc: "Pay with MoMo App", icon: "🔴" },
                      { id: "ZALOPAY", title: "ZaloPay", desc: "Quick & Secure", icon: "🟢" },
                      { id: "STRIPE", title: "Credit Card", desc: "Visa, Mastercard", icon: "💳" },
                      { id: "MOCK", title: t("testPayment"), desc: t("testPaymentDesc"), icon: <Zap className="w-4 h-4 text-amber-500" /> },
                    ].map(m => (
                      <label 
                        key={m.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          method === m.id 
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                          : "border-border hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="w-4 h-4 text-primary"
                          checked={method === m.id}
                          onChange={() => setMethod(m.id as PaymentMethod)}
                        />
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xl shadow-sm">
                           {m.icon}
                        </div>
                        <div className="flex-1">
                          <span className="block font-bold text-foreground leading-tight">{m.title}</span>
                          <span className="text-xs text-muted-foreground">{m.desc}</span>
                        </div>
                        {m.id === "VNPAY" && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] py-0">POPULAR</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Order Summary Sticky Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card-premium rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl"
              >
                <div className="p-8 space-y-8">
                  <h3 className="text-xl font-bold text-foreground">{t("orderSummary")}</h3>
                  
                  <div className="flex gap-4 p-3 bg-muted/30 rounded-2xl border border-border/30">
                    <div className="w-20 h-14 rounded-lg overflow-hidden shadow-sm bg-muted flex-shrink-0">
                       {course.thumbnailUrl && <img src={course.thumbnailUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <h4 className="font-bold text-foreground text-sm truncate leading-tight">{course.title}</h4>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">E-Learning Course</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <span>{t("course")}</span>
                      <span className={isStudent ? "line-through" : "font-bold text-foreground"}>
                        {formatPrice(course.price, t)}
                      </span>
                    </div>
                    {isStudent && (
                      <div className="flex justify-between text-emerald-500 font-bold text-sm">
                        <span>{t("studentDiscount")}</span>
                        <span>-{formatPrice(course.price, t)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-4 border-t border-border">
                       <span className="text-lg font-bold text-foreground">{t("total")}</span>
                       <span className="text-4xl font-black tracking-tighter text-primary">
                          {formatPrice(finalPrice, t)}
                       </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      id="confirm-payment-btn"
                      onClick={handlePay}
                      disabled={paying || (finalPrice === 0 && !securityChecked)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 rounded-[1.5rem] font-black text-xl transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
                    >
                      {paying ? (
                         <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                         <>
                           <Lock className="w-5 h-5 opacity-50" />
                           {finalPrice === 0 ? t("enrollFree") : t("payAmount", { amount: formatPrice(finalPrice, t) })}
                         </>
                      )}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div className="flex flex-col items-center gap-1 p-3 bg-muted/20 rounded-2xl border border-border/20">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                          <span className="text-[10px] font-bold text-center">Secure SSL</span>
                       </div>
                       <div className="flex flex-col items-center gap-1 p-3 bg-muted/20 rounded-2xl border border-border/20">
                          <RefreshCw className="w-5 h-5 text-blue-500" />
                          <span className="text-[10px] font-bold text-center">30-Day Money Back</span>
                       </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showVietQR && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/20 space-y-6"
                      >
                         <div className="text-center space-y-2">
                           <h4 className="font-bold text-lg text-primary">{t("scanToPay")}</h4>
                           <p className="text-xs text-muted-foreground">{t("vietqrInstruction")}</p>
                         </div>

                         <div className="bg-white p-4 rounded-3xl shadow-inner mx-auto w-fit">
                            <img 
                              src={`https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${finalPrice}&addInfo=${encodeURIComponent(currentPayment?.referenceCode || "S4Y")}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`}
                              className="w-56 h-56 object-contain"
                              alt="VietQR"
                            />
                         </div>

                         <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                               <div className="space-y-0.5">
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("accountHolder")}</p>
                                 <p className="text-sm font-bold">{BANK_CONFIG.accountName}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(BANK_CONFIG.accountName); toast.success("Copied!"); }}><Copy className="w-4 h-4" /></Button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                               <div className="space-y-0.5">
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("accountNumber")}</p>
                                 <p className="text-sm font-bold tracking-widest">{BANK_CONFIG.accountNo}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(BANK_CONFIG.accountNo); toast.success("Copied!"); }}><Copy className="w-4 h-4" /></Button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/30">
                               <div className="space-y-0.5">
                                 <p className="text-[10px] text-primary uppercase font-bold">{t("transferContent")}</p>
                                 <p className="text-sm font-black text-primary">{currentPayment?.referenceCode}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(currentPayment?.referenceCode || ""); toast.success("Copied!"); }} className="text-primary"><Copy className="w-4 h-4" /></Button>
                            </div>
                         </div>

                         <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-amber-700 font-bold leading-tight">{t("mustIncludeContent")}</p>
                         </div>

                         <Button 
                           variant="outline" 
                           onClick={() => setPaymentDone(true)}
                           className="w-full border-primary/30 text-primary font-bold hover:bg-primary/5 h-12"
                         >
                           {t("iHaveTransferred")}
                         </Button>
                      </motion.div>
                    )}

                    {paymentDone && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-emerald-500/10 rounded-[2rem] border-2 border-emerald-500/30 text-center space-y-4"
                       >
                          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                          <h4 className="font-bold text-emerald-700 text-lg">Hệ thống đang kiểm tra...</h4>
                          <p className="text-xs text-emerald-700/70">Cảm ơn bạn! Đơn hàng của bạn đang được duyệt. Khóa học sẽ tự động xuất hiện trong "Khóa học của tôi" sau khi Admin xác nhận tiền về túi.</p>
                          <Button onClick={() => navigate("/dashboard")} className="w-full bg-emerald-600">Quay về trang chủ</Button>
                       </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col items-center gap-4 pt-4">
                    <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed px-4">
                      By clicking Enroll, you agree to our <Link to="#" className="underline font-bold text-foreground/80">Terms of Service</Link> and <Link to="#" className="underline font-bold text-foreground/80">Refund Policy</Link>.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                 <Building2 className="w-4 h-4" />
                 <span>{t("checkoutLocked")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
