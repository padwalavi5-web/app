import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYouth, calculateAge, getBranches, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role } from '../types';

type YouthAuthMode = 'login' | 'register';

const Login = () => {
  const [role, setRole] = useState<Role>('youth');
  const [youthMode, setYouthMode] = useState<YouthAuthMode>('login');
  const [name, setName] = useState('');
  const [budgetNumber, setBudgetNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [branch, setBranch] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBranches = async () => {
      const branchData = await getBranches();
      setBranches(branchData);
    };

    loadBranches();
  }, []);

  useEffect(() => {
    setPassword('');
    setBranch('');

    if (role !== 'youth') {
      setYouthMode('login');
      setBirthDate('');
    }
  }, [role]);

  const resetYouthFields = () => {
    setName('');
    setBudgetNumber('');
    setBirthDate('');
  };

  const handleYouthAuth = async () => {
    const trimmedName = name.trim();
    const trimmedBudgetNumber = budgetNumber.trim();

    if (!trimmedName || !trimmedBudgetNumber) {
      alert('נא למלא שם ומספר תקציב אישי');
      return;
    }

    const youth = await getYouth();
    const existingUser = youth.find(
      (item) => item.name.trim() === trimmedName && item.personalBudgetNumber.trim() === trimmedBudgetNumber,
    );

    if (youthMode === 'login') {
      if (!existingUser) {
        alert('לא נמצאה הרשמה תואמת. אפשר לעבור להרשמה.');
        return;
      }

      setCurrentUser({ ...existingUser, role: 'youth' });
      navigate('/youth');
      return;
    }

    if (!birthDate.trim()) {
      alert('נא למלא תאריך לידה');
      return;
    }

    if (existingUser) {
      alert('הנער כבר רשום. אפשר להתחבר במקום להירשם שוב.');
      return;
    }

    const ageNum = calculateAge(birthDate);
    if (ageNum < 14 || ageNum > 18) {
      alert('הגיל אינו בטווח המותר');
      return;
    }

    const newYouth = {
      name: trimmedName,
      birthDate,
      personalBudgetNumber: trimmedBudgetNumber,
      totalHours: 0,
      lastResetHours: 0,
    };

    const id = await addYouth(newYouth);
    setCurrentUser({ ...newYouth, id, role: 'youth' });
    navigate('/youth');
  };

  const handleLogin = async () => {
    if (role === 'youth') {
      await handleYouthAuth();
      return;
    }

    if (role === 'manager') {
      const managers = await getManagers();
      const manager = managers.find(
        (item) => item.name === name.trim() && item.branch === branch && item.password === password,
      );

      if (!manager) {
        alert('פרטים שגויים');
        return;
      }

      setCurrentUser({ ...manager, role: 'manager' });
      navigate('/manager');
      return;
    }

    if (password === 'admin') {
      setCurrentUser({ role: 'guide' });
      navigate('/guide');
    } else {
      alert('סיסמה שגויה');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">כניסה למערכת</h1>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['youth', 'manager', 'guide'] as Role[]).map((itemRole) => (
            <button
              key={itemRole}
              onClick={() => setRole(itemRole)}
              className={`p-3 rounded-xl border-2 ${
                role === itemRole ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
              }`}
            >
              <span className="text-xs font-bold block">
                {itemRole === 'youth' ? 'נוער' : itemRole === 'manager' ? 'מנהל ענף' : 'מדריך'}
              </span>
            </button>
          ))}
        </div>

        {role === 'youth' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                setYouthMode('login');
                setBirthDate('');
              }}
              className={`p-3 rounded-xl border ${
                youthMode === 'login' ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => {
                setYouthMode('register');
                resetYouthFields();
              }}
              className={`p-3 rounded-xl border ${
                youthMode === 'register' ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'
              }`}
            >
              הרשמה
            </button>
          </div>
        )}

        <div className="space-y-4">
          {(role === 'youth' || role === 'manager') && (
            <div>
              <label htmlFor="user-name" className="block text-sm mb-1 font-bold">
                שם מלא:
              </label>
              <input
                id="user-name"
                name="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full p-3 border rounded-xl"
              />
            </div>
          )}

          {role === 'youth' && (
            <>
              <div>
                <label htmlFor="budget-num" className="block text-sm mb-1 font-bold">
                  מספר תקציב אישי:
                </label>
                <input
                  id="budget-num"
                  name="budget"
                  type="text"
                  value={budgetNumber}
                  onChange={(event) => setBudgetNumber(event.target.value)}
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              {youthMode === 'register' && (
                <div>
                  <label htmlFor="birth" className="block text-sm mb-1 font-bold">
                    תאריך לידה:
                  </label>
                  <input
                    id="birth"
                    name="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              )}
            </>
          )}

          {role === 'manager' && (
            <div>
              <label htmlFor="branch-sel" className="block text-sm mb-1 font-bold">
                ענף:
              </label>
              <select
                id="branch-sel"
                name="branch"
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className="w-full p-3 border rounded-xl"
              >
                <option value="">בחר ענף</option>
                {branches.map((itemBranch) => (
                  <option key={itemBranch.name} value={itemBranch.name}>
                    {itemBranch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(role === 'manager' || role === 'guide') && (
            <div>
              <label htmlFor="pwd" className="block text-sm mb-1 font-bold">
                סיסמה:
              </label>
              <input
                id="pwd"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full p-3 border rounded-xl"
              />
            </div>
          )}

          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
            {role === 'youth' && youthMode === 'register' ? 'הרשמה' : 'התחברות'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
