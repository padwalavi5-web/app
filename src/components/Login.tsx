import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYouth, getBranches, getGuidePassword, getManagers, getYouth, setCurrentUser } from '../data';
import type { Branch, Role, Youth } from '../types';

const roleLabels: Record<Role, string> = {
  youth: 'נוער',
  manager: 'מנהל ענף',
  guide: 'מדריך',
};

const roleButtonClass: Record<Role, string> = {
  youth: 'segmented-olive',
  manager: 'segmented-sky',
  guide: 'segmented-sand',
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
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getBranches()
      .then(setBranches)
      .catch((error) => {
        console.error(error);
        setLoadError('טעינת הענפים נכשלה. אפשר לנסות שוב.');
      });
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
          if (!existingUser) {
            alert('לא נמצאה הרשמה.');
            return;
          }

          setCurrentUser({ ...existingUser, role: 'youth' });
          navigate('/youth');
          return;
        }

        if (existingUser) {
          alert('משתמש זה כבר קיים במערכת.');
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
          alert('פרטים שגויים.');
          return;
        }

        setCurrentUser({ branch: manager.branch, role: 'manager' });
        navigate('/manager');
        return;
      }

      const savedPassword = await getGuidePassword();
      if (password !== savedPassword) {
        alert('סיסמה שגויה.');
        return;
      }

      setCurrentUser({ role: 'guide' });
      navigate('/guide');
    } catch (error) {
      console.error(error);
      alert('הפעולה נכשלה. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell login-shell" dir="rtl">
      <div className="page-wrap max-w-md">
        <section className="glass-panel p-4 sm:p-5">
          <div className={`segmented mb-4 grid-cols-3 ${roleButtonClass[role]}`}>
            {(Object.keys(roleLabels) as Role[]).map((currentRole) => (
              <button
                key={currentRole}
                type="button"
                onClick={() => setRole(currentRole)}
                data-active={role === currentRole}
                className={role === currentRole ? '' : 'text-[var(--text-soft)]'}
              >
                {roleLabels[currentRole]}
              </button>
            ))}
          </div>

          {role === 'youth' && (
            <div className="segmented segmented-sky mb-4 grid-cols-2">
              <button
                type="button"
                onClick={() => setYouthMode('login')}
                data-active={youthMode === 'login'}
                className={youthMode === 'login' ? '' : 'text-[var(--text-soft)]'}
              >
                כניסה
              </button>
              <button
                type="button"
                onClick={() => setYouthMode('register')}
                data-active={youthMode === 'register'}
                className={youthMode === 'register' ? '' : 'text-[var(--text-soft)]'}
              >
                הרשמה
              </button>
            </div>
          )}

          {loadError ? <div className="chip chip-danger mb-4">{loadError}</div> : null}

          <div className="space-y-3">
            {role === 'youth' && (
              <>
                <div>
                  <label htmlFor="name-input" className="field-label">שם מלא</label>
                  <input id="name-input" type="text" className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="budget-input" className="field-label">מספר תקציב</label>
                  <input
                    id="budget-input"
                    type="text"
                    className="field-input"
                    value={budgetNumber}
                    onChange={(event) => setBudgetNumber(event.target.value)}
                  />
                </div>
                {youthMode === 'register' && (
                  <div>
                    <label htmlFor="birth-input" className="field-label">תאריך לידה</label>
                    <input
                      id="birth-input"
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
              <>
                <div>
                  <label htmlFor="branch-select" className="field-label">ענף</label>
                  <select id="branch-select" className="field-input" value={branch} onChange={(event) => setBranch(event.target.value)}>
                    <option value="">בחר ענף</option>
                    {branches.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pass-input" className="field-label">סיסמה</label>
                  <input
                    id="pass-input"
                    type="password"
                    className="field-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </>
            )}

            {role === 'guide' && (
              <div>
                <label htmlFor="pass-input" className="field-label">סיסמה</label>
                <input
                  id="pass-input"
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              className={`w-full mt-2 ${
                role === 'youth'
                  ? youthMode === 'register'
                    ? 'btn-sand'
                    : 'btn-olive'
                  : role === 'manager'
                    ? 'btn-sky'
                    : 'btn-rose'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'טוען...' : role === 'youth' && youthMode === 'register' ? 'הרשמה' : 'כניסה'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
