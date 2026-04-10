import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYouth, calculateAge, getBranches, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role } from '../types';

type YouthAuthMode = 'login' | 'register';

const roleLabels: Record<Role, string> = {
  youth: 'נוער',
  manager: 'מנהל ענף',
  guide: 'מדריך',
};

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
    <div className="app-shell flex items-center justify-center" dir="rtl">
      <div className="page-wrap max-w-xl relative">
        <div className="hero-orb right-0 top-4 h-28 w-28 bg-[rgba(108,168,180,0.32)] sm:h-40 sm:w-40" />
        <div className="hero-orb bottom-16 left-2 h-24 w-24 bg-[rgba(223,169,126,0.24)] sm:h-36 sm:w-36" />

        <section className="content-card p-6 sm:p-8 relative">
            <div className="mb-6 text-center">
              <h2 className="page-title text-[2rem] sm:text-[2.25rem]">כניסה למערכת</h2>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {(['youth', 'manager', 'guide'] as Role[]).map((itemRole) => (
                <button
                  key={itemRole}
                  onClick={() => setRole(itemRole)}
                  className={role === itemRole ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                >
                  {roleLabels[itemRole]}
                </button>
              ))}
            </div>

            {role === 'youth' && (
              <div className="mb-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setYouthMode('login');
                    setBirthDate('');
                  }}
                  className={youthMode === 'login' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                >
                  התחברות
                </button>
                <button
                  onClick={() => {
                    setYouthMode('register');
                    resetYouthFields();
                  }}
                  className={youthMode === 'register' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                >
                  הרשמה
                </button>
              </div>
            )}

            <div className="space-y-4">
              {role === 'youth' && (
                <div>
                  <label htmlFor="user-name" className="field-label">
                    שם מלא
                  </label>
                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              {role === 'youth' && (
                <>
                  <div>
                    <label htmlFor="budget-num" className="field-label">
                      מספר תקציב אישי
                    </label>
                    <input
                      id="budget-num"
                      name="budget"
                      type="text"
                      value={budgetNumber}
                      onChange={(event) => setBudgetNumber(event.target.value)}
                      className="field-input"
                    />
                  </div>

                  {youthMode === 'register' && (
                    <div>
                      <label htmlFor="birth" className="field-label">
                        תאריך לידה
                      </label>
                      <input
                        id="birth"
                        name="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(event) => setBirthDate(event.target.value)}
                        className="field-input"
                      />
                    </div>
                  )}
                </>
              )}

              {role === 'manager' && (
                <div>
                  <label htmlFor="branch-sel" className="field-label">
                    ענף
                  </label>
                  <select
                    id="branch-sel"
                    name="branch"
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    className="field-input"
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
                  <label htmlFor="pwd" className="field-label">
                    סיסמה
                  </label>
                  <input
                    id="pwd"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              <button onClick={handleLogin} className="btn-primary w-full">
                {role === 'youth' && youthMode === 'register' ? 'הרשמה' : 'התחברות'}
              </button>
            </div>
          </section>
      </div>
    </div>
  );
};

export default Login;
