import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import paymentService from "@/services/paymentService";
import enrollmentService from "@/services/enrollmentService";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentButtonProps {
  courseId: string;
  price: number;
  enrolled?: boolean;
}

function formatPrice(price: number, t: (k: string) => string): string {
  if (price === 0) return t("free");
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export function PaymentButton({ courseId, price, enrolled }: PaymentButtonProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (enrolled) {
    return (
      <button
        className="payment-btn payment-btn--enrolled"
        onClick={() => navigate(`/learn/${courseId}`)}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        {t("startLearning")}
      </button>
    );
  }

  const handleEnrollFree = async () => {
    setLoading(true);
    try {
      await enrollmentService.enrollCourse(courseId);
      toast.success(t("success"));
      navigate(`/learn/${courseId}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    navigate(`/payment/${courseId}`);
  };

  if (price === 0) {
    return (
      <button
        id="enroll-free-btn"
        className="payment-btn payment-btn--free w-full py-4 px-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
        onClick={handleEnrollFree}
        disabled={loading}
      >
        {loading ? (
          <span className="payment-btn__spinner" />
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {t("enrollFree")}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id="buy-course-btn"
      className="payment-btn payment-btn--buy w-full py-4 px-6 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg"
      onClick={handlePay}
      disabled={loading}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
        <path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
      {t("buyNowPrice", { price: formatPrice(price, t) })}
    </button>
  );
}
