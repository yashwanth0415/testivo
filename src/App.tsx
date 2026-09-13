import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ExamsPage from "./pages/ExamsPage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";
import SettingsPage from "./pages/SettingsPage";
import CreateExamPage from "./pages/CreateExamPage";
import ExamInstructionsPage from "./pages/ExamInstructionsPage";
import ExamTakingPage from "./pages/ExamTakingPage";
import ExamResultPage from "./pages/ExamResultPage";
import ExamReviewPage from "./pages/ExamReviewPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAIPage from "./pages/admin/AdminAIPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams"
        element={
          <ProtectedRoute>
            <ExamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-exam"
        element={
          <ProtectedRoute>
            <CreateExamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:id/instructions"
        element={
          <ProtectedRoute>
            <ExamInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:id/start"
        element={
          <ProtectedRoute>
            <ExamTakingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:id/result"
        element={
          <ProtectedRoute>
            <ExamResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:id/review"
        element={
          <ProtectedRoute>
            <ExamReviewPage />
          </ProtectedRoute>
        }
      />
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="ai" element={<AdminAIPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
