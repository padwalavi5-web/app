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

  // טעינת ענפים מה-DB בטעינה ראשונית
  useEffect(() => {
    const loadBranches = async () => {
      const branchData = await getBranches();
      setBranches(branchData);
    };
    loadBranches();
  }, []);

  // איפוס שדות רגישים כשמחליפים תפקיד (Role)
  useEffect(() => {
    setPassword('');
    setBranch('');
    setName('');
    setBudgetNumber('');
    setBirthDate('');
    if (role !== 'youth') {
      setYouthMode('login');
    }
  }, [role]);

  const handleLogin = async () => {
    // --- לוגיקת כניסה/הרשמה לנוער ---
    if (role === 'youth') {
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
          alert('לא נמצאה הרשמה תואמת');
          return;
        }
        setCurrentUser({ ...existingUser, role: 'youth' });
        navigate('/youth');
        return;
      }

      // מצב הרשמה
      if (existingUser) {
        alert('הנער כבר רשום במערכת');
        return;
      }

      if (!birthDate) {
        alert('נא למלא תאריך לידה');
        return;
      }

      const ageNum = calculateAge(birthDate);
      if (ageNum < 14 || ageNum > 18) {
        alert('הגיל אינו בטווח המותר (14-18)');
        return;
      }

      const newYouth = { 
        name: trimmedName, 
        birthDate, 
        personalBudgetNumber: trimmedBudgetNumber, 
        totalHours: 0, 
        lastResetHours: 0 
      };
      
      const id = await addYouth(newYouth);
      setCurrentUser({ ...newYouth, id, role: 'youth' });
      navigate('/youth');
      return;
    }

    // --- לוגיקת כניסה למנהל (לפי ענף וסיסמה בלבד) ---
    if (role === 'manager') {
      if (!branch || !password) {
        alert('נא לבחור ענף ולהזין סיסמה');
        return;
      }

      const managers = await getManagers();
      // חיפוש מנהל שתואם לענף ולסיסמה
      const manager = managers.find((item) => item.branch === branch && item.password === password);

      if (!manager) {
        alert('פרטים שגויים: הענף או הסיסמה אינם נכונים');
        return;
      }

      setCurrentUser({ ...manager, role: 'manager' });
      navigate('/manager');
      return;
    }

    // --- לוגיקת כניסה למדריך ---
    if (role === 'guide') {
      if (password === 'admin') {
        setCurrentUser({ role: 'guide' });
        navigate('/guide');
      } else {
        alert('סיסמה שגויה');
      }
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
              <button onClick={() => setYouthMode('login')} className={youthMode === 'login' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
                התחברות
              </button>
              <button onClick={() => setYouthMode('register')} className={youthMode === 'register' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
                הרשמה
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* שם מלא - מוצג רק לנוער */}
            {role === 'youth' && (
              <div>
                <label htmlFor="user-name" className="field-label">שם מלא</label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                />
              </div>
            )}

            {/* פרטי נוער נוספים */}
            {role === 'youth' && (
              <>
                <div>
                  <label htmlFor="budget-num" className="field-label">מספר תקציב אישי</label>
                  <input
                    id="budget-num"
                    type="text"
                    value={budgetNumber}
                    onChange={(e) => setBudgetNumber(e.target.value)}
                    className="field-input"
                  />
                </div>
                {youthMode === 'register' && (
                  <div>
                    <label htmlFor="birth" className="field-label">תאריך לידה</label>
                    <input
                      id="birth"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="field-input"
                    />
                  </div>
                )}
              </>
            )}

            {/* בחירת ענף - מוצג רק למנהל */}
            {role === 'manager' && (
              <div>
                <label htmlFor="branch-sel" className="field-label">ענף</label>
                <select
                  id="branch-sel"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="field-input"
                >
                  <option value="">בחר ענף</option>
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* סיסמה - מוצג למנהל ולמדריך */}
            {(role === 'manager' || role === 'guide') && (
              <div>
                <label htmlFor="pwd" className="field-label">סיסמה</label>
                <input
                  id="pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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