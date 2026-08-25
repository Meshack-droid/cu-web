import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { RequireAnyPermission, RequirePermission } from '@/components/RequirePermission';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardOverviewPage } from '@/pages/DashboardOverviewPage';
import { AboutPage } from '@/pages/AboutPage';
import { MinistriesPage } from '@/pages/MinistriesPage';
import { MinistryDetailsPage } from '@/pages/MinistryDetailsPage';
import { EventsPage } from '@/pages/EventsPage';
import { ContactPage } from '@/pages/ContactPage';
import { MembershipPage } from '@/pages/MembershipPage';
import { AdminApplicationsPage } from '@/pages/AdminApplicationsPage';
import { AdminRolesPage } from '@/pages/AdminRolesPage';
import { FinancePage } from '@/pages/FinancePage';
import { MeetingsPage } from '@/pages/MeetingsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { PrayerPage } from '@/pages/PrayerPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes — Chapter 42 */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ministries" element={<MinistriesPage />} />
        <Route path="/ministries/:id" element={<MinistryDetailsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Authentication — Chapter 43 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard — Chapter 44 */}
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/dashboard/membership" element={<MembershipPage />} />
          <Route path="/dashboard/meetings" element={<MeetingsPage />} />
          <Route path="/dashboard/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/prayer" element={<PrayerPage />} />
          <Route path="/dashboard/finance" element={<FinancePage />} />

          {/* Admin — permission-gated (Chapter 53) */}
          <Route element={<RequirePermission permission="membership.review" />}>
            <Route path="/dashboard/admin/applications" element={<AdminApplicationsPage />} />
          </Route>
          <Route element={<RequireAnyPermission permissions={['leadership.assign', 'system.manage_roles']} />}>
            <Route path="/dashboard/admin/roles" element={<AdminRolesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
