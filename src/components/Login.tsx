import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBriefcase, FiLock, FiShield, FiUser, FiUserPlus } from 'react-icons/fi';
import AppMark from './AppMark';
import { addYouth, getBranches, getGuidePassword, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role, Youth } from '../types';

const roleLabels: Record<Role, { title: string; description: string; icon: typeof FiUser }> = {
  youth: {
    title: 'נוער',
    description: 'כניסה לדיווח שעות ומעקב אישי',
    icon: FiUser,
  },
  manager: {
    title: 'מנהל ענף',
    description: 'אישור דיווחים של הענף',
    icon: FiBriefcase,
  },
  guide: {
    title: 'מדריך',
    description: 'ניהול מלא של המערכת והנתונים',
    icon: FiShield,
  },
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

  const loadBranches = useCallback(async () => {
    const branchList = await getBranches();
    setBranches(branchList);
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const selectedRole = useMemo(() => roleLabels[role], [role]);
  const SelectedRoleIcon = selectedRole.icon;

  const handleLogin = async () => {
    setIsSubmitting(true);

    try {
      if (role === 'youth') {
        const youth = await getYouth();
        const existingUser = youth.find(
          (item: Youth) => item.name.trim() === name.trim() && item.personalBudgetNumber.trim() === budgetNumber.trim(),
        );

        if (youthMode === 'login') {
          if (!existingUser) {
            alert('לא נמצאה הרשמה עם הפרטים האלו.');
            return;
          }

          setCurrentUser({ ...existingUser, role: 'youth' });
          navigate('/youth');
          return;
        }

        if (!name.trim() || !budgetNumber.trim() || !birthDate) {
          alert('כדי להירשם צריך למלא שם, מספר תקציב ותאריך לידה.');
          return;
        }

        if (existingUser) {
          alert('הנער כבר רשום במערכת.');
          return;
        }

        const id = await addYouth({
          name,
          birthDate,
          personalBudgetNumber: budgetNumber,
          totalHours: 0,
          lastResetHours: 0,
          manualHoursAdjustment: 0,
        });

        setCurrentUser({
          id,
          name,
          birthDate,
          personalBudgetNumber: budgetNumber,
          totalHours: 0,
          lastResetHours: 0,
          manualHoursAdjustment: 0,
          role: 'youth',
        });
        navigate('/youth');
        return;
      }

      if (role === 'manager') {
        const managers = await getManagers();
        const manager = managers.find((item) => item.branch === branch && item.password === password);

        if (!manager) {
          alert('שם ענף או סיסמה לא תקינים.');
          return;
        }

        setCurrentUser({ branch: manager.branch, role: 'manager' });
        navigate('/manager');
        return;
      }

      const savedPassword = await getGuidePassword();
      if (password !== savedPassword) {
        alert('סיסמת המדריך שגויה.');
        return;
      }

      setCurrentUser({ role: 'guide' });
      navigate('/guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center" dir="rtl">
      <div className="page-wrap max-w-6xl">
        <section className="glass-panel p-5 sm:p-8 lg:p-10">
          <div className="hero-grid items-stretch">
            <div className="content-card p-6 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-4">
                <AppMark />
                <div>
                  <div className="chip mb-3">מערכת שעות דיגיטלית</div>
                  <h1 className="page-title mb-2">כניסה חכמה ונקייה לכל תפקיד</h1>
                  <p className="page-subtitle">
                    עיצוב חדש, מהיר ונוח לשימוש עם זרימה ברורה לנוער, למנהלי ענפים ולמדריכים.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(['youth', 'manager', 'guide'] as Role[]).map((itemRole) => {
                  const roleMeta = roleLabels[itemRole];
                  const Icon = roleMeta.icon;
                  const isActive = role === itemRole;

                  return (
                    <button
                      key={itemRole}
                      type="button"
                      onClick={() => setRole(itemRole)}
                      className={isActive ? 'btn-primary flex-col items-start p-5 text-right' : 'btn-secondary flex-col items-start p-5 text-right'}
                    >
                      <span className="icon-badge bg-white/15 text-current">
                        <Icon size={18} />
                      </span>
                      <span className="mt-4 text-lg">{roleMeta.title}</span>
                      <span className={`text-sm ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{roleMeta.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="stat-card">
                  <div className="page-subtitle">דיווח שעות</div>
                  <div className="stat-value">מהיר</div>
                </div>
                <div className="stat-card">
                  <div className="page-subtitle">ניהול ואישורים</div>
                  <div className="stat-value">מרוכז</div>
                </div>
                <div className="stat-card">
                  <div className="page-subtitle">נראות כללית</div>
                  <div className="stat-value">פרימיום</div>
                </div>
              </div>
            </div>

            <div className="content-card p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="chip mb-3">{selectedRole.title}</div>
                  <h2 className="section-title">התחברות למערכת</h2>
                  <p className="page-subtitle">{selectedRole.description}</p>
                </div>
                <span className="icon-badge">
                  <SelectedRoleIcon size={20} />
                </span>
              </div>

              {role === 'youth' && (
                <div className="segmented mb-6 grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setYouthMode('login')}
                    className={youthMode === 'login' ? 'btn-primary' : 'btn-secondary'}
                  >
                    <FiArrowLeft size={16} />
                    התחברות
                  </button>
                  <button
                    type="button"
                    onClick={() => setYouthMode('register')}
                    className={youthMode === 'register' ? 'btn-primary' : 'btn-secondary'}
                  >
                    <FiUserPlus size={16} />
                    הרשמה
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {role === 'youth' && (
                  <>
                    <div>
                      <label htmlFor="name" className="field-label">שם מלא</label>
                      <input id="name" className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="budget" className="field-label">מספר תקציב</label>
                      <input
                        id="budget"
                        className="field-input"
                        value={budgetNumber}
                        onChange={(event) => setBudgetNumber(event.target.value)}
                      />
                    </div>
                    {youthMode === 'register' && (
                      <div>
                        <label htmlFor="birth-date" className="field-label">תאריך לידה</label>
                        <input
                          id="birth-date"
                          type="date"
                          className="field-input"
                          value={birthDate}
                          onChange={(event) => setBirthDate(event.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                {role === 'manager' && (
                  <div>
                    <label htmlFor="branch" className="field-label">ענף</label>
                    <select id="branch" className="field-input" value={branch} onChange={(event) => setBranch(event.target.value)}>
                      <option value="">בחר ענף</option>
                      {branches.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(role === 'manager' || role === 'guide') && (
                  <div>
                    <label htmlFor="password" className="field-label">
                      <FiLock size={14} />
                      סיסמה
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="field-input"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                )}

                <button type="button" onClick={handleLogin} className="btn-primary w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'בודק פרטים...' : 'כניסה'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
