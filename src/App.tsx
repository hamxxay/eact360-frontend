import { Route, Routes } from 'react-router-dom';
import { RequireMenuRight } from './app/RequireMenuRight';
import { AppShell } from './components/AppShell/AppShell';
import { ClassicPage } from './pages/Classic/ClassicPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { FbrInvoicesPage } from './pages/FbrInvoices/FbrInvoicesPage';
import { JournalVoucherPage } from './pages/JournalVoucher/JournalVoucherPage';
import { LIST_DEFS } from './lists';
import { ListScreen } from './lists/ListScreen';
import { LoginPage } from './pages/Login/LoginPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { ReportPage } from './pages/Report/ReportPage';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="report/*" element={<ReportPage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="fbr/invoices" element={<RequireMenuRight route="/fbr/invoices"><FbrInvoicesPage /></RequireMenuRight>} />
        {/* Rights: the screen loads the classic JVAdjustments.aspx, which redirects without the JV right */}
        <Route path="accounts/jv/new" element={<JournalVoucherPage />} />
        {LIST_DEFS.map((d) => <Route key={d.id} path={d.route.replace(/^\//, '')} element={<ListScreen def={d} />} />)}
        <Route path="classic/*" element={<ClassicPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
