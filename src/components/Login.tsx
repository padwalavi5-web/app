import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiLock, FiShield, FiUser, FiArrowLeft, FiUserPlus } from 'react-icons/fi';
import { addYouth, getBranches, getGuidePassword, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role, Youth } from '../types';

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
    getBranches().then(setBranches);
  }, []);

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      if (role === 'youth') {
        const youth = await getYouth();
        const existingUser = youth.find(
          (item: Youth) => item.name.trim() === name.trim() && item.personalBudgetNumber.trim() === budgetNumber.trim(),
        );

        if (youthMode === 'login') {
          if (!existingUser) return alert('לא נמצאה הרשמה.');
          setCurrentUser({ ...existingUser, role: 'youth' });
          navigate('/youth');
        } else {
            // הוספת סוג לפרמטרים במקרה הצורך
          const id = await addYouth({ name, birthDate, personalBudgetNumber: budgetNumber, totalHours: 0, lastResetHours: 0, manualHoursAdjustment: 0 });
          setCurrentUser({ id, name, birthDate, personalBudgetNumber: budgetNumber, totalHours: 0, lastResetHours: 0, manualHoursAdjustment: 0, role: 'youth' });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <img src="/favicon.svg" alt="לוגו האפליקציה" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-center mb-6">כניסה למערכת</h1>

        {/* בחירת תפקיד - הוספנו aria-label לנגישות */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button aria-label="תפקיד נוער" onClick={() => setRole('youth')} className={`p-3 rounded-xl ${role === 'youth' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><FiUser /></button>
          <button aria-label="תפקיד מנהל" onClick={() => setRole('manager')} className={`p-3 rounded-xl ${role === 'manager' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><FiBriefcase /></button>
          <button aria-label="תפקיד מדריך" onClick={() => setRole('guide')} className={`p-3 rounded-xl ${role === 'guide' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><FiShield /></button>
        </div>

        {/* טופס */}
        <div className="space-y-4">
          {role === 'youth' && (
            <>
              <input aria-label="שם מלא" placeholder="שם מלא" className="w-full p-3 border rounded-lg" onChange={(e) => setName(e.target.value)} />
              <input aria-label="מספר תקציב" placeholder="מספר תקציב" className="w-full p-3 border rounded-lg" onChange={(e) => setBudgetNumber(e.target.value)} />
            </>
          )}
          {role === 'manager' && (
             <select aria-label="בחר ענף" className="w-full p-3 border rounded-lg" onChange={(e) => setBranch(e.target.value)}>
                <option value="">בחר ענף</option>
                {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
             </select>
          )}
          {(role === 'manager' || role === 'guide') && (
            <input aria-label="סיסמה" type="password" placeholder="סיסמה" className="w-full p-3 border rounded-lg" onChange={(e) => setPassword(e.target.value)} />
          )}
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-lg">כניסה</button>
        </div>
      </div>
    </div>
  );
};

export default Login;