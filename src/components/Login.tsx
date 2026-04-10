import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        if (!name.trim() || !budgetNumber.trim() || !birthDate.trim()) { alert('נא למלא הכל'); return; }
        const ageNum = calculateAge(birthDate);
        if (ageNum < 14 || ageNum > 18) { alert('גיל לא תקין'); return; }
        const newYouth = { name: name.trim(), birthDate, personalBudgetNumber: budgetNumber.trim(), totalHours: 0, lastResetHours: 0 };
        await addYouth(newYouth);
        setCurrentUser({ ...newYouth, role: 'youth' });
        navigate('/youth');
      }
    } else if (role === 'manager') {
      const managers = await getManagers();
      const manager = managers.find(m => m.name === name && m.branch === branch && m.password === password);
      if (manager) { setCurrentUser({ ...manager, role: 'manager' }); navigate('/manager'); }
      else { alert('פרטים שגויים'); }
    } else if (role === 'guide') {
      if (password === 'admin') { setCurrentUser({ role: 'guide' }); navigate('/guide'); }
      else { alert('סיסמה שגויה'); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">כניסה למערכת</h1>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['youth', 'manager', 'guide'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`p-3 rounded-xl border-2 ${role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
              <span className="text-xs font-bold block">{r === 'youth' ? 'נוער' : r === 'manager' ? 'מנהל' : 'מדריך'}</span>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {(role === 'youth' || role === 'manager') && (
            <div>
              <label htmlFor="user-name" className="block text-sm mb-1 font-bold">שם מלא:</label>
              <input id="user-name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-xl" />
            </div>
          )}
          {role === 'youth' && (
            <>
              <div>
                <label htmlFor="budget-num" className="block text-sm mb-1 font-bold">מספר תקציב:</label>
                <input id="budget-num" name="budget" type="text" value={budgetNumber} onChange={(e) => setBudgetNumber(e.target.value)} className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label htmlFor="birth" className="block text-sm mb-1 font-bold">תאריך לידה:</label>
                <input id="birth" name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full p-3 border rounded-xl" />
              </div>
            </>
          )}
          {role === 'manager' && (
            <div>
              <label htmlFor="branch-sel" className="block text-sm mb-1 font-bold">ענף:</label>
              <select id="branch-sel" name="branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-3 border rounded-xl">
                <option value="">בחר ענף</option>
                {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          )}
          {(role === 'manager' || role === 'guide') && (
            <div>
              <label htmlFor="pwd" className="block text-sm mb-1 font-bold">סיסמה:</label>
              <input id="pwd" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl" />
            </div>
          )}
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">התחברות</button>
        </div>
      </div>
    </div>
  );
};

export default Login;