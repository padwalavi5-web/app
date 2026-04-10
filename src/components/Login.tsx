import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYouth, getBranches, getManagers, getYouth, setCurrentUser, getGuidePassword } from '../data';
import type { Branch, Role } from '../types';

const roleLabels: Record<Role, string> = {
  youth: 'נוער',
  manager: 'מנהל ענף',
  guide: 'מדריך',
};

const Login = () => {
  const [role, setRole] = useState<Role>('youth');
  const [youthMode, setYouthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [budgetNumber, setBudgetNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [branch, setBranch] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  const handleLogin = async () => {
    if (role === 'youth') {
      const youth = await getYouth();
      const existingUser = youth.find(
        (item: any) => item.name.trim() === name.trim() && item.personalBudgetNumber.trim() === budgetNumber.trim(),
      );

      if (youthMode === 'login') {
        if (!existingUser) return alert('לא נמצאה הרשמה');
        setCurrentUser({ ...existingUser, role: 'youth' });
        navigate('/youth');
      } else {
        if (existingUser) return alert('כבר רשום');
        const id = await addYouth({ name, birthDate, personalBudgetNumber: budgetNumber, totalHours: 0, lastResetHours: 0 });
        setCurrentUser({ name, id, role: 'youth' });
        navigate('/youth');
      }
    } else if (role === 'manager') {
      const managers = await getManagers();
      const manager = managers.find((item: any) => item.branch === branch && item.password === password);
      if (!manager) return alert('פרטים שגויים');
      setCurrentUser({ ...manager, role: 'manager' });
      navigate('/manager');
    } else if (role === 'guide') {
      const savedPass = await getGuidePassword();
      if (password === savedPass) {
        setCurrentUser({ role: 'guide' });
        navigate('/guide');
      } else {
        alert('סיסמה שגויה');
      }
    }
  };

  return (
    <div className="app-shell flex items-center justify-center" dir="rtl">
      <div className="page-wrap max-w-xl content-card p-8">
        <h2 className="page-title text-center mb-6">כניסה למערכת</h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['youth', 'manager', 'guide'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={role === r ? 'btn-primary' : 'btn-secondary'}>
              {roleLabels[r]}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {role === 'youth' && (
            <>
              <input placeholder="שם מלא" className="field-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="שם מלא" />
              <input placeholder="מספר תקציב" className="field-input" value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} aria-label="מספר תקציב" />
              {youthMode === 'register' && <input type="date" className="field-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} aria-label="תאריך לידה" />}
              <div className="flex gap-2">
                <button onClick={() => setYouthMode('login')} className={youthMode === 'login' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>התחברות</button>
                <button onClick={() => setYouthMode('register')} className={youthMode === 'register' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}>הרשמה</button>
              </div>
            </>
          )}
          {role === 'manager' && (
            <select className="field-input" value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="בחר ענף">
              <option value="">בחר ענף</option>
              {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          )}
          {(role === 'manager' || role === 'guide') && (
            <input type="password" placeholder="סיסמה" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="סיסמה" />
          )}
          <button onClick={handleLogin} className="btn-primary w-full">כניסה</button>
        </div>
      </div>
    </div>
  );
};

export default Login;