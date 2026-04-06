import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isNewUser, setIsNewUser] = useState(false); // מצב הרשמה או התחברות
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
      if (!name.trim() || !budgetNumber.trim()) {
        alert('אנא מלא שם ומספר תקציב');
        return;
      }

      const youth = await getYouth();
      const user = youth.find(y => y.name === name.trim() && y.personalBudgetNumber === budgetNumber.trim());

      if (user) {
        // אם נמצא משתמש - מחברים אותו ישר
        setCurrentUser({ ...user, role: 'youth' });
        navigate('/youth');
      } else {
        // אם לא נמצא משתמש
        if (!isNewUser) {
          alert('לא נמצא משתמש עם פרטים אלו. אם זו הפעם הראשונה שלך, בחר באפשרות "להרשמה"');
          return;
        }

        // לוגיקת הרשמה למשתמש חדש
        if (!birthDate.trim()) {
          alert('להרשמה חדשה חובה להזין תאריך לידה');
          return;
        }

        const ageNum = calculateAge(birthDate);
        if (isNaN(ageNum) || ageNum < 14 || ageNum > 18) {
          alert('ההרשמה מיועדת לגילאי 14 עד 18 בלבד');
          return;
        }

        if (!budgetNumber.match(/^\d+$/)) {
          alert('מספר תקציב אישי חייב להכיל ספרות בלבד');
          return;
        }

        const newYouth = {
          name: name.trim(),
          birthDate,
          personalBudgetNumber: budgetNumber.trim(),
          totalHours: 0,
          paidHours: 0,
          budget: 0,
        };

        const id = await addYouth(newYouth);
        setCurrentUser({ ...newYouth, id, role: 'youth' });
        navigate('/youth');
      }
    } else if (role === 'manager') {
      const managers = await getManagers();
      const manager = managers.find(m => m.name === name && m.branch === branch && m.password === password);
      if (manager) {
        setCurrentUser({ ...manager, role: 'manager' });
        navigate('/manager');
      } else {
        alert('פרטים שגויים');
      }
    } else if (role === 'guide') {
      if (password === 'admin') {
        setCurrentUser({ role: 'guide' });
        navigate('/guide');
      } else {
        alert('סיסמה שגויה');
      }
    }
  };

  const roleIcons = {
    youth: FaUser,
    manager: FaUserTie,
    guide: FaCrown,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-lg border border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 dark:from-slate-300 dark:to-blue-400 bg-clip-text text-transparent mb-2"
          >
            כניסה לאפליקציה
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">בחר את התפקיד שלך והתחבר</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 text-right">תפקיד</label>
          <div className="grid grid-cols-3 gap-2">
            {(['youth', 'manager', 'guide'] as Role[]).map((r) => {
              const Icon = roleIcons[r];
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setIsNewUser(false); // איפוס למצב התחברות כשמחליפים תפקיד
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    role === r
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'
                  }`}
                >
                  <Icon className={`mx-auto mb-2 text-2xl ${role === r ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-semibold block">
                    {r === 'youth' ? 'נוער' : r === 'manager' ? 'מנהל' : 'מדריך'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={role + (isNewUser ? '-new' : '-login')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* שדות משותפים לכולם חוץ ממדריך */}
          {role !== 'guide' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">שם</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="הכנס שם מלא"
              />
            </div>
          )}

          {role === 'youth' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">מספר תקציב אישי</label>
                <input
                  type="text"
                  value={budgetNumber}
                  onChange={(e) => setBudgetNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="הכנס מספר תקציב"
                />
              </div>

              <AnimatePresence>
                {isNewUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">תאריך לידה</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center mb-6">
                <button
                  type="button"
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-all"
                >
                  {isNewUser ? 'כבר רשום? לחץ כאן להתחברות' : 'פעם ראשונה באפליקציה? לחץ כאן להרשמה'}
                </button>
              </div>
            </>
          )}

          {role === 'manager' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">ענף</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר ענף</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">סיסמה</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס סיסמה"
                />
              </div>
            </>
          )}

          {role === 'guide' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 text-right">סיסמת מדריך</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="הכנס סיסמה"
              />
            </div>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700