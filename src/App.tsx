import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';

const Login = lazy(() => import('./components/Login'));
const YouthDashboard = lazy(() => import('./components/YouthDashboard'));
const ManagerApproval = lazy(() => import('./components/ManagerApproval'));
const GuideSummary = lazy(() => import('./components/GuideSummary'));
const ManageYouth = lazy(() => import('./components/ManageYouth'));
const ManageBranches = lazy(() => import('./components/ManageBranches'));
const ManageRates = lazy(() => import('./components/ManageRates'));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<div className="app-shell flex items-center justify-center text-center" dir="rtl">טוען מסך...</div>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/youth" element={<YouthDashboard />} />
            <Route path="/manager" element={<ManagerApproval />} />
            <Route path="/guide" element={<GuideSummary />} />
            <Route path="/guide/youth" element={<ManageYouth />} />
            <Route path="/guide/branches" element={<ManageBranches />} />
            <Route path="/guide/rates" element={<ManageRates />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
