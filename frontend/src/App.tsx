import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TestsPage from "./pages/TestsPage";
import TestTakingPage from "./pages/TestTakingPage";
import ResultPage from "./pages/ResultPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <ChatbotWidget />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/tests" element={<ProtectedRoute><TestsPage /></ProtectedRoute>} />
                <Route path="/tests/:id/attempt" element={<ProtectedRoute><TestTakingPage /></ProtectedRoute>} />
                <Route path="/result/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin requiredPermission="VIEW_ADMIN_DASHBOARD"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/tests" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_TESTS"><AdminPage /></ProtectedRoute>} />
                <Route path="/admin/tests/create" element={<ProtectedRoute requireAdmin><TestEditorPage /></ProtectedRoute>} />
                <Route path="/admin/tests/:id/edit" element={<ProtectedRoute requireAdmin><TestEditorPage /></ProtectedRoute>} />
                <Route path="/admin/tests/:id/view" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_TESTS"><TestViewPage /></ProtectedRoute>} />
                <Route path="/admin/questions" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_QUESTIONS"><QuestionBankPage /></ProtectedRoute>} />
                <Route path="/admin/questions/create" element={<ProtectedRoute requireAdmin><QuestionEditorPage /></ProtectedRoute>} />
                <Route path="/admin/questions/:id/edit" element={<ProtectedRoute requireAdmin><QuestionEditorPage /></ProtectedRoute>} />
                <Route path="/admin/questions/ai-generate" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_QUESTIONS"><AIGeneratePage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_USERS"><UsersPage /></ProtectedRoute>} />
                <Route path="/admin/users/ai-generate" element={<ProtectedRoute requireAdmin><AIGenerateUsersPage /></ProtectedRoute>} />
                <Route path="/admin/users/create" element={<ProtectedRoute requireAdmin><UserEditorPage /></ProtectedRoute>} />
                <Route path="/admin/users/:id/edit" element={<ProtectedRoute requireAdmin><UserEditorPage /></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><RolesPage /></ProtectedRoute>} />
                <Route path="/admin/roles/create" element={<ProtectedRoute requireAdmin><RoleEditorPage /></ProtectedRoute>} />
                <Route path="/admin/roles/:id/edit" element={<ProtectedRoute requireAdmin requiredPermission="MANAGE_USERS"><RoleEditorPage /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin requiredPermission="VIEW_ANALYTICS"><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute requireAdmin><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettingsPage /></ProtectedRoute>} />
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
