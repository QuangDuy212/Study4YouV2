import apiClient from "./apiClient";

export type PaymentMethod = "VNPAY" | "MOCK" | "MOMO" | "ZALOPAY" | "STRIPE" | "VIETQR";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentRequest {
  courseId: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  referenceCode: string;
  paymentUrl?: string;
  createdAt: string;
}

const paymentService = {
  createPayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post("/payments", data);
    return res.data.data;
  },

  confirmPayment: async (paymentId: string): Promise<PaymentResponse> => {
    const res = await apiClient.post(`/payments/${paymentId}/confirm`);
    return res.data.data;
  },

  getPaymentHistory: async (): Promise<PaymentResponse[]> => {
    const res = await apiClient.get("/payments/history");
    return res.data.data;
  },

  getAllPaymentsForAdmin: async (): Promise<PaymentResponse[]> => {
    const res = await apiClient.get("/payments/admin/all");
    return res.data.data;
  },

  adminConfirmPayment: async (paymentId: string): Promise<PaymentResponse> => {
    const res = await apiClient.post(`/payments/admin/${paymentId}/confirm`);
    return res.data.data;
  },

  exportPayments: async (): Promise<Blob> => {
    const res = await apiClient.get("/payments/export", { responseType: "blob" });
    return res.data;
  },
};

export default paymentService;
