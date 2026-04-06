import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Login from './components/Login';
import YouthDashboard from './components/YouthDashboard';
import ManagerApproval from './components/ManagerApproval';
import GuideSummary from './components/GuideSummary';
import ManageYouth from './components/ManageYouth';
import ManageBranches from './components/ManageBranches';
import ManageRates from './components/ManageRates';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/youth" element={<YouthDashboard />} />
          <Route path="/manager" element={<ManagerApproval />} />
          <Route path="/guide" element={<GuideSummary />} />
          <Route path="/guide/youth" element={<ManageYouth />} />
          <Route path="/guide/branches" element={<ManageBranches />} />
          <Route path="/guide/rates" element={<ManageRates />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
