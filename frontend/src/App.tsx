import "./course.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TestsPage from "./pages/TestsPage";
import TestTakingPage from "./pages/TestTakingPage";
import ResultPage from "./pages/ResultPage";
import TestReviewPage from "./pages/TestReviewPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import QuestionBankPage from "./pages/admin/QuestionBankPage";
import QuestionEditorPage from "./pages/admin/QuestionEditorPage";
import AIGeneratePage from "./pages/admin/AIGeneratePage";
import UsersPage from "./pages/admin/UsersPage";
import AIGenerateUsersPage from "./pages/admin/AIGenerateUsersPage";
import UserEditorPage from "./pages/admin/UserEditorPage";
import RolesPage from "./pages/admin/RolesPage";
import RoleEditorPage from "./pages/admin/RoleEditorPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import TestEditorPage from "./pages/admin/TestEditorPage";
import TestViewPage from "./pages/admin/TestViewPage";
import NotFound from "./pages/NotFound";
import ForbiddenPage from "./pages/ForbiddenPage";
import ProfilePage from "./pages/admin/ProfilePage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import NotificationManagementPage from "./pages/admin/NotificationManagementPage";
import NotificationsPage from "./pages/NotificationsPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LearnPage from "./pages/LearnPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import TransactionsPage from "./pages/TransactionsPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminCourseEditorPage from "./pages/admin/AdminCourseEditorPage";
import AdminCurriculumPage from "./pages/admin/AdminCurriculumPage";
import AdminLessonEditorPage from "./pages/admin/AdminLessonEditorPage";
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";

const queryClient = new QueryClient();

const AdminRootRedirect = () => {
  const { hasPermission, isAdmin } = useAuth();
  
  if (!isAdmin) return <Navigate to="/403" replace />;
  if (hasPermission("VIEW_ADMIN_DASHBOARD")) return <AdminDashboardPage />;
  if (hasPermission("MANAGE_TESTS") || hasPermission("MANAGE_TEST")) return <Navigate to="/admin/tests" replace />;
  if (hasPermission("MANAGE_COURSES") || hasPermission("MANAGE_COURSE")) return <Navigate to="/admin/courses" replace />;
  if (hasPermission("MANAGE_PAYMENTS") || hasPermission("MANAGE_PAYMENT")) return <Navigate to="/admin/payments" replace />;
  if (hasPermission("MANAGE_USERS") || hasPermission("MANAGE_USER")) return <Navigate to="/admin/users" replace />;
  if (hasPermission("VIEW_ANALYTICS")) return <Navigate to="/admin/analytics" replace />;
  
  // Ultimate fallback: Try to go anywhere allowed, or show Forbidden if truly empty
  return <Navigate to="/admin/users" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <BrowserRouter>
              <ChatbotWidget />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/403" element={<ForbiddenPage />} />

                {/* Dashboard Routes wrapper */}
                <Route element={<DashboardLayout />}>
                  {/* Public or partially public course routes inside dashboard */}
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  
                  {/* Protected dashboard routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tests" element={<TestsPage />} />
                    <Route path="/tests/:id/attempt" element={<TestTakingPage />} />
                    <Route path="/tests/:submissionId/review" element={<TestReviewPage />} />
                    <Route path="/result/:id" element={<ResultPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/learn/:courseId" element={<LearnPage />} />
                    <Route path="/my-courses" element={<MyCoursesPage />} />
                    <Route path="/payment/:courseId" element={<PaymentPage />} />
                    <Route path="/payment/callback" element={<PaymentResultPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                  </Route>
                </Route>

                {/* Admin Routes wrapper */}
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminRootRedirect />} />
                    <Route path="/admin/tests" element={<ProtectedRoute requiredPermission="MANAGE_TESTS"><AdminPage /></ProtectedRoute>} />
                    <Route path="/admin/tests/create" element={<TestEditorPage />} />
                    <Route path="/admin/tests/:id/edit" element={<TestEditorPage />} />
                    <Route path="/admin/tests/:id/view" element={<ProtectedRoute requiredPermission="MANAGE_TESTS"><TestViewPage /></ProtectedRoute>} />
                      <Route path="/admin/courses" element={<AdminCoursesPage />} />
                      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                      <Route path="/admin/courses/create" element={<AdminCourseEditorPage />} />
                     <Route path="/admin/courses/:id/edit" element={<AdminCourseEditorPage />} />
                     <Route path="/admin/courses/:id/lessons" element={<AdminCurriculumPage />} />
                     <Route path="/admin/courses/:id/lessons/create" element={<AdminLessonEditorPage />} />
                     <Route path="/admin/courses/:id/lessons/:lessonId/edit" element={<AdminLessonEditorPage />} />
 
                     <Route path="/admin/users" element={<ProtectedRoute requiredPermission="MANAGE_USERS"><UsersPage /></ProtectedRoute>} />
                     <Route path="/admin/users/create" element={<UserEditorPage />} />
                     <Route path="/admin/users/:id/edit" element={<UserEditorPage />} />
                     
                     <Route path="/admin/roles" element={<RolesPage />} />
                     <Route path="/admin/roles/create" element={<RoleEditorPage />} />
                     <Route path="/admin/roles/:id/edit" element={<ProtectedRoute requiredPermission="MANAGE_USERS"><RoleEditorPage /></ProtectedRoute>} />
                    
                    <Route path="/admin/analytics" element={<ProtectedRoute requiredPermission="VIEW_ANALYTICS"><AnalyticsPage /></ProtectedRoute>} />
                    <Route path="/admin/profile" element={<ProfilePage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/notifications" element={<ProtectedRoute requiredPermission="MANAGE_USERS"><NotificationManagementPage /></ProtectedRoute>} />
                  </Route>
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
