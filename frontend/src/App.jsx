import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/public/HomePage';
import Dashboard from './pages/Dashboard';
import RefugeesPage from './pages/RefugeesPage';
import RefugeeDetail from './pages/RefugeeDetail';
import CasesPage from './pages/CasesPage';
import CaseDetail from './pages/CaseDetail';
import CampsPage from './pages/CampsPage';
import DistribPage from './pages/DistributionsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import FinancingsPage from './pages/FinancingsPage';
import CoursesPage from './pages/CoursesPage';
import ProfilePage from './pages/ProfilePage';
import StoriesPage from './pages/StoriesPage';
import HRPage from './pages/HRPage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app"   element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                element={<Dashboard />} />
            <Route path="refugees"      element={<RefugeesPage />} />
            <Route path="refugees/:id"  element={<RefugeeDetail />} />
            <Route path="cases"         element={<CasesPage />} />
            <Route path="cases/:id"     element={<CaseDetail />} />
            <Route path="camps"         element={<CampsPage />} />
            <Route path="distributions" element={<DistribPage />} />
            <Route path="messages"      element={<MessagesPage />} />
            <Route path="financings"    element={<FinancingsPage />} />
            <Route path="courses"       element={<CoursesPage />} />
            <Route path="stories"       element={<StoriesPage />} />
            <Route path="reports"       element={<ReportsPage />} />
            <Route path="profile"       element={<ProfilePage />} />
            <Route path="hr"            element={<PrivateRoute roles={['admin']}><HRPage /></PrivateRoute>} />
            <Route path="users"         element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LangProvider>
  );
}
