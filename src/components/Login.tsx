import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiLock, FiShield, FiUser } from 'react-icons/fi';
import AppMark from './AppMark';
import { addYouth, getBranches, getGuidePassword, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role, Youth } from '../types';

const roleLabels: Record<Role, { title: string; description: string; icon: typeof FiUser }> = {
  youth: { title: 'נוער', description: 'כניסה לדיווח שעות ומעקב אישי', icon: FiUser },
  manager: { title: 'מנהל ענף', description: 'אישור דיווחים של הענף', icon: FiBriefcase },
  guide: { title: 'מדריך', description: 'ניהול מלא של המערכת והנתונים', icon: FiShield },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getBranches().then(setBranches).catch(console.error);
  }, []);

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      if (role === 'youth') {
        const youth = await getYouth();
        const existingUser = youth.find(
          (item: Youth) => item.name.trim() === name.trim() && item.personalBudgetNumber.trim() === budgetNumber.trim()
        );

        if (youthMode === 'login') {
          if (!existingUser) return alert('לא נמצאה הרשמה.');
          setCurrentUser({ ...existingUser, role: 'youth' });
          navigate('/youth');
        } else {
          if (existingUser) return alert('משתמש זה כבר קיים במערכת.');
          const id = await addYouth({
            name, birthDate, personalBudgetNumber: budgetNumber,
            totalHours: 0, lastResetHours: 0, manualHoursAdjustment: 0,
          });
          setCurrentUser({
            id, name, birthDate, personalBudgetNumber: budgetNumber,
            totalHours: 0, lastResetHours: 0, manualHoursAdjustment: 0, role: 'youth',
          });
          navigate('/youth');
        }
      } else if (role === 'manager') {
        const managers = await getManagers();
        const manager = managers.find((item: any) => item.branch === branch && item.password === password);
        if (!manager) return alert('פרטים שגויים.');
        setCurrentUser({ branch: manager.branch, role: 'manager' });
        navigate('/manager');
      } else {
        const savedPassword = await getGuidePassword();
        if (password !== savedPassword) return alert('סיסמה שגויה.');
        setCurrentUser({ role: 'guide' });
        navigate('/guide');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentIcon = roleLabels[role].icon;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-md mx-auto pt-12 px-4 pb-20">
        <div className="flex flex-col items-center mb-8">
          <AppMark />
          <h1 className="text-2xl font-bold mt-4 text-slate-900">ברוכים הבאים</h1>
        </div>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-center gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl">
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    role === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {roleLabels[r].title}
                </button>
              ))}
            </div>

            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3">
                <CurrentIcon size={24} />
              </div>
              <h2 className="text-lg font-semibold">{roleLabels[role].title}</h2>
            </div>

            <div className="space-y-4">
              {role === 'youth' && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                  <button type="button" onClick={() => setYouthMode('login')} className={`flex-1 py-2 text-sm rounded-lg ${youthMode === 'login' ? 'bg-white shadow-sm font-bold' : ''}`}>כניסה</button>
                  <button type="button" onClick={() => setYouthMode('register')} className={`flex-1 py-2 text-sm rounded-lg ${youthMode === 'register' ? 'bg-white shadow-sm font-bold' : ''}`}>הרשמה</button>
                </div>
              )}

              <div>
                <label htmlFor="name-input" className="field-label">שם מלא</label>
                <input id="name-input" type="text" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {role === 'youth' && (
                <>
                  <div>
                    <label htmlFor="budget-input" className="field-label">מספר תקציב</label>
                    <input id="budget-input" type="text" className="field-input" value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} />
                  </div>
                  {youthMode === 'register' && (
                    <div>
                      <label htmlFor="birth-input" className="field-label">תאריך לידה</label>
                      <input id="birth-input" type="date" className="field-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                  )}
                </>
              )}

              {role === 'manager' && (
                <div>
                  <label htmlFor="branch-select" className="field-label">ענף</label>
                  <select id="branch-select" className="field-input" value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">בחר ענף</option>
                    {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {(role === 'manager' || role === 'guide') && (
                <div>
                  <label htmlFor="pass-input" className="field-label flex items-center gap-1"><FiLock size={14} /> סיסמה</label>
                  <input id="pass-input" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}

              <button type="button" onClick={handleLogin} className="btn-primary w-full mt-6" disabled={isSubmitting}>
                {isSubmitting ? 'טוען...' : (youthMode === 'register' && role === 'youth' ? 'הרשמה למערכת' : 'כניסה')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;