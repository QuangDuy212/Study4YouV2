import axios, { type AxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh_token cookie
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processPendingQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(token!);
  });
  pendingQueue = [];
}

import { toast } from "sonner";

// On 401: attempt token refresh once, then retry original request
apiClient.interceptors.response.use(
  (res) => {
    // Check for success flag in our standard response wrapper
    if (res.data && res.data.success === false) {
      const message = res.data.message || "Something went wrong";
      toast.error(message);
      return Promise.reject(new Error(message));
    }
    return res;
  },
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle standard error responses from the server if they were not caught by the success: false check above
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) {
            (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          }
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken: string = data.data?.accessToken ?? data.accessToken;
        localStorage.setItem("access_token", newToken);
        processPendingQueue(null, newToken);
        if (original.headers) {
          (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return apiClient(original);
      } catch (refreshError) {
        processPendingQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_profile");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Don't show toast for 401 since it's handled by redirect
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
