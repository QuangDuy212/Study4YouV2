import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import paymentService from "@/services/paymentService";
import { toast } from "sonner";

export default function PaymentResultPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const paymentId = searchParams.get("paymentId");
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        setStatus("failed");
        setErrorMessage("Missing payment reference");
        return;
      }

      // vnp_ResponseCode 00 means Success in VNPay
      if (vnpResponseCode && vnpResponseCode !== "00") {
        setStatus("failed");
        setErrorMessage(t("paymentFailedDesc") || "Transaction cancelled or failed");
        return;
      }

      try {
        await paymentService.confirmPayment(paymentId);
        setStatus("success");
        toast.success(t("paymentSuccess") || "Payment completed successfully!");
      } catch (error) {
        console.error("Verification failed", error);
        setStatus("failed");
        setErrorMessage(t("failedToVerify") || "Could not verify your payment");
      }
    };

    verifyPayment();
  }, [paymentId, vnpResponseCode, t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card-premium rounded-[2.5rem] p-10 border border-border/50 shadow-2xl text-center space-y-8">
          
          {status === "loading" && (
            <div className="space-y-6 py-10">
              <div className="relative mx-auto w-20 h-20">
                <Loader2 className="w-20 h-20 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">{t("processing") || "Verifying Payment..."}</h2>
                <p className="text-muted-foreground mt-2">{t("pleaseWait") || "Please don't close this window"}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground">{t("congratulations") || "Payment Successful!"}</h2>
                <p className="text-muted-foreground leading-relaxed px-4">
                  {t("paymentSuccessDesc") || "Your payment has been processed securely. You can now start learning!"}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => navigate("/my-courses")} 
                  className="w-full h-14 rounded-2xl bg-primary text-lg font-bold gap-2 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
                >
                  {t("goToMyCourses") || "Start Learning Now"} 
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/dashboard")} 
                  className="w-full h-12 rounded-2xl font-bold text-muted-foreground"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t("backToHome") || "Back to Home"}
                </Button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center mx-auto shadow-lg shadow-destructive/20"
              >
                <XCircle className="w-12 h-12 text-white" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground">{t("paymentFailed") || "Payment Failed"}</h2>
                <p className="text-muted-foreground leading-relaxed px-4 text-sm">
                  {errorMessage}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  className="w-full h-14 rounded-2xl bg-foreground text-background text-lg font-bold shadow-xl hover:-translate-y-1 transition-all"
                >
                  {t("tryAgain") || "Try Again Later"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/dashboard")} 
                  className="w-full h-12 rounded-2xl font-bold text-muted-foreground"
                >
                  {t("contactSupport") || "Need Help?"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
