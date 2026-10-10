import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Layouts
import AuthLayout from './app/(auth)/layout'
import DashboardLayout from './app/(dashboard)/layout'
import MarketingLayout from './app/(marketing)/layout'
import OnboardingLayout from './app/(onboarding)/layout'
import TestsLayout from './app/(tests)/layout'
import AdminLayout from './app/admin/AdminLayout'

// Marketing pages
import MarketingPage from './app/(marketing)/page'
import LandingPage2 from './app/(marketing)/landing-2/page'
import AboutPage from './app/(marketing)/about/page'
import PrivacyPage from './app/(marketing)/privacy/page'
import TermsPage from './app/(marketing)/terms/page'
import PolicyRedirect from './app/(marketing)/policy/page'

// Auth pages
import LoginPage from './app/(auth)/login/page'
import SignupPage from './app/(auth)/signup/page'
import AuthCallbackPage from './app/(auth)/auth/callback/page'

// Onboarding
import OnboardingPage from './app/(onboarding)/onboarding/page'

// Dashboard pages
import DashboardPage from './app/(dashboard)/dashboard/page'
import ReadingPage from './app/(dashboard)/reading/page'
import ListeningPage from './app/(dashboard)/listening/page'
import WritingPage from './app/(dashboard)/writing/page'
import SpeakingPage from './app/(dashboard)/speaking/page'
import SpeakingLivePage from './app/(dashboard)/speaking/live/page'
import MovieShadowingPage from './app/(dashboard)/speaking/shadowing/page'
import VocabularyPage from './app/(dashboard)/vocabulary/page'
import VocabularyReviewPage from './app/(dashboard)/vocabulary/review/page'
import PracticePage from './app/(dashboard)/practice/page'
import ProgressPage from './app/(dashboard)/progress/page'
import SavedPage from './app/(dashboard)/saved/page'
import SettingsPage from './app/(dashboard)/settings/page'
import PremiumPage from './app/(dashboard)/premium/page'
import NotificationsPage from './app/(dashboard)/notifications/page'

// Test pages (self-loading)
import ReadingTestPage from './app/(tests)/reading/[id]/client-page'
import ListeningTestPage from './app/(tests)/listening/[id]/client-page'
import WritingTestPage from './app/(tests)/writing/[id]/client-page'
import SpeakingTestPage from './app/(tests)/speaking/[id]/client-page'

// Admin pages
import AdminDashboardPage from './app/admin/page'
import AdminTestsPage from './app/admin/tests/client-page'
import AdminTestCreatePage from './app/admin/tests/create/page'
import AdminTestEditPage from './app/admin/tests/[id]/edit/page'
import AdminTestPreviewPage from './app/admin/tests/[id]/preview/page'
import AdminUsersPage from './app/admin/users/client-page'
import AdminImportPage from './app/admin/import/client-page'
import AdminImportHtmlPage from './app/admin/import/html/client-page'
import AdminImportJsonPage from './app/admin/import/json/client-page'
import AdminImportPdfPage from './app/admin/import/pdf/client-page'
import AdminImportAudioPage from './app/admin/import/audio/client-page'
import AdminAttemptsPage from './app/admin/attempts/client-page'
import AdminTasksPage from './app/admin/tasks/page'
import AdminPricingPage from './app/admin/pricing/page'
import AdminVocabularyPage from './app/admin/vocabulary/page'
import AdminNotificationsPage from './app/admin/notifications/page'
import AdminShadowingPage from './app/admin/shadowing/page'

export default function AppRouter() {
  return (
    <Routes>
      {/* Marketing */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/landing-2" element={<LandingPage2 />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/policy" element={<PolicyRedirect />} />
        <Route path="/pricing" element={<Navigate to="/premium" replace />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
      </Route>

      {/* Auth callback — standalone */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Onboarding */}
      <Route element={<OnboardingLayout />}>
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Dashboard */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/speaking" element={<SpeakingPage />} />
        <Route path="/speaking/live" element={<SpeakingLivePage />} />
        <Route path="/speaking/shadowing" element={<MovieShadowingPage />} />
        <Route path="/shadowing" element={<Navigate to="/speaking/shadowing" replace />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/vocabulary/review" element={<VocabularyReviewPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Tests (self-loading, ProtectedRoute wraps layout) */}
      <Route
        element={
          <ProtectedRoute>
            <TestsLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/tests/reading/:id" element={<ReadingTestPage />} />
        <Route path="/reading/:id" element={<ReadingTestPage />} />
        <Route path="/tests/listening/:id" element={<ListeningTestPage />} />
        <Route path="/listening/:id" element={<ListeningTestPage />} />
        <Route path="/tests/writing/:id" element={<WritingTestPage />} />
        <Route path="/writing/:id" element={<WritingTestPage />} />
        <Route path="/tests/speaking/live" element={<SpeakingLivePage />} />
        <Route path="/tests/speaking/:id" element={<SpeakingTestPage />} />
        <Route path="/speaking/:id" element={<SpeakingTestPage />} />
      </Route>

      {/* Admin */}
      <Route
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/tests" element={<AdminTestsPage />} />
        <Route path="/admin/tasks" element={<AdminTasksPage />} />
        <Route path="/admin/shadowing" element={<AdminShadowingPage />} />
        <Route path="/admin/vocabulary" element={<AdminVocabularyPage />} />
        <Route path="/admin/tests/create" element={<AdminTestCreatePage />} />
        <Route path="/admin/tests/:id/edit" element={<AdminTestEditPage />} />
        <Route path="/admin/tests/:id/preview" element={<AdminTestPreviewPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/attempts" element={<AdminAttemptsPage />} />
        <Route path="/admin/results" element={<Navigate to="/admin/attempts" replace />} />
        <Route path="/admin/pricing" element={<AdminPricingPage />} />
        <Route path="/admin/plans" element={<Navigate to="/admin/pricing" replace />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/import" element={<AdminImportPage />} />
        <Route path="/admin/import/html" element={<AdminImportHtmlPage />} />
        <Route path="/admin/import/json" element={<AdminImportJsonPage />} />
        <Route path="/admin/import/pdf" element={<AdminImportPdfPage />} />
        <Route path="/admin/import/audio" element={<AdminImportAudioPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
