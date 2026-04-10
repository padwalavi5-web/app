import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUserTie, FaCrown } from 'react-icons/fa';
import { getYouth, getManagers, getBranches, setCurrentUser, addYouth, calculateAge } from '../data';
import type { Role } from '../types';

const Login = () => {
  const [role, setRole] = useState<Role>('youth');
  const [name, setName] = useState('');
  const [budgetNumber, setBudgetNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [branch, setBranch] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBranches = async () => {
      const branchData = await getBranches();
      setBranches(branchData);
    };
    loadBranches();
  }, []);

  const handleLogin = async () => {
    if (role === 'youth') {
      const youth = await getYouth();
      let user = youth.find(y => y.name === name && y.personalBudgetNumber === budgetNumber);
      if (user) {
        setCurrentUser({ ...user, role: 'youth' });
        navigate('/youth');
      } else {
        if (!name.trim() || !budgetNumber.trim() || !birthDate.trim()) {
          alert('אנא מלא את כל השדות'); return;
        }
        const ageNum = calculateAge(birthDate);
        if (isNaN(ageNum) || ageNum < 14 || ageNum > 18) {
          alert('גיל חייב להיות בין 14 ל-18'); return;
        }
        const newYouth = { name: name.trim(), birthDate, personalBudgetNumber: budgetNumber.trim(), totalHours: 0, lastResetHours: 0 };
        await addYouth(newYouth);
        setCurrentUser({ ...newYouth, role: 'youth' });
        navigate('/youth');
      }
    } else if (role === 'manager') {
      const managers = await getManagers();
      const manager = managers.find(m => m.name === name && m.branch === branch && m.password === password);
      if (manager) {
        setCurrentUser({ ...manager, role: 'manager' });
        navigate('/manager');
      } else { alert('פרטים שגויים'); }
    } else if (role === 'guide') {
      if (password === 'admin') {
        setCurrentUser({ role: 'guide' });
        navigate('/guide');
      } else { alert('סיסמה שגויה'); }
    }
  };

  const roleIcons = { youth: FaUser, manager: FaUserTie, guide: FaCrown };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">כניסה למערכת</h1>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['youth', 'manager', 'guide'] as Role[]).map((r) => {
            const Icon = roleIcons[r];
            return (
              <button key={r} onClick={() => setRole(r)} className={`p-3 rounded-xl border-2 transition-all ${role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-100 opacity-60'}`}>
                <Icon className={`mx-auto mb-1 text-xl ${role === r ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-xs font-bold block text-center">{r === 'youth' ? 'נוער' : r === 'manager' ? 'מנהל' : 'מדריך'}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          {(role === 'youth' || role === 'manager') && (
            <div>
              <label htmlFor="user-name-input" className="sr-only">שם מלא</label>
              <input id="user-name-input" name="user-name" type="text" placeholder="שם מלא" title="שם מלא" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-xl text-right" />
            </div>
          )}
          {role === 'youth' && (
            <>
              <div>
                <label htmlFor="budget-input" className="sr-only">מספר תקציב</label>
                <input id="budget-input" name="budget-number" type="text" placeholder="מספר תקציב אישי" title="מספר תקציב אישי" value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} className="w-full p-3 border rounded-xl text-right" />
              </div>
              <div>
                <label htmlFor="birth-input" className="sr-only">תאריך לידה</label>
                <input id="birth-input" name="birth-date" type="date" title="תאריך לידה" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full p-3 border rounded-xl text-right" />
              </div>
            </>
          )}
          {role === 'manager' && (
            <div>
              <label htmlFor="branch-select" className="sr-only">בחר ענף</label>
              <select id="branch-select" name="branch" title="בחר ענף" value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-3 border rounded-xl text-right">
                <option value="">בחר ענף</option>
                {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          )}
          {(role === 'manager' || role === 'guide') && (
            <div>
              <label htmlFor="pass-input" className="sr-only">סיסמה</label>
              <input id="pass-input" name="password" type="password" placeholder="סיסמה" title="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl text-right" />
            </div>
          )}
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 mt-4">התחברות</button>
        </div>
      </div>
    </div>
  );
};

export default Login;