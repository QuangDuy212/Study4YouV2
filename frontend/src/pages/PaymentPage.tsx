import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import courseService, { type CourseResponse } from "@/services/courseService";
import paymentService, { type PaymentMethod } from "@/services/paymentService";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

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
  }, [courseId, navigate]);

  const handlePay = async () => {
    if (!courseId) return;
    setPaying(true);
    try {
      const payment = await paymentService.createPayment({ courseId, paymentMethod: method });
      
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
    <>
      <div className="max-w-5xl mx-auto pb-12 pt-8 px-4 sm:px-6 lg:px-8">
        <Link to={`/courses/${courseId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("back")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t("orderSummary")}</h2>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex gap-4 mb-6">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>{t("course")}</span>
                    <span className="font-medium">{formatPrice(course.price, t)}</span>
                  </div>
                  <div className="flex justify-between text-foreground font-bold text-lg pt-2 border-t border-border">
                    <span>{t("total")}</span>
                    <span className="text-primary">{formatPrice(course.price, t)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">{t("paymentMethod")}</h2>

            <div className="space-y-4 mb-8">
              {(["MOCK", "VNPAY"] as PaymentMethod[]).map(m => (
                <label 
                  key={m} 
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    method === m 
                    ? "border-primary bg-primary/5" 
                    : "border-border glass-card hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="mt-1 w-4 h-4 text-primary"
                  />
                  <div className="text-2xl leading-none">
                    {m === "MOCK" ? "💳" : "🏦"}
                  </div>
                  <div>
                    <strong className="block text-foreground font-semibold mb-0.5">{m === "MOCK" ? t("testPayment") : t("vnpayGateway")}</strong>
                    <span className="text-sm text-muted-foreground">{m === "MOCK" ? t("testPaymentDesc") : t("vnpayDesc")}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-sm font-medium mb-6">
              <ShieldCheck className="w-5 h-5" />
              <span>{t("secureTransaction")}</span>
            </div>

            <button
              id="confirm-payment-btn"
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-[var(--shadow-card)]"
            >
              {paying ? (
                <>{t("processing")}</>
              ) : (
                <>{t("payAmount", { amount: formatPrice(course.price, t) })}</>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground mt-6 px-8">
              {t("termsRefund", { 
                terms: <Link to="#" className="underline hover:text-foreground hover:bg-transparent">{t("termsOfService")}</Link>,
                refund: <Link to="#" className="underline hover:text-foreground hover:bg-transparent">{t("refundPolicy")}</Link>
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
