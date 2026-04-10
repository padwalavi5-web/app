import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteBranch, getBranches, getCurrentUser, saveBranch } from '../data';
import type { Branch } from '../types';

const emptyBranch: Branch = { name: '', password: '' };

const ManageBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState<Branch>(emptyBranch);
  const [editingBranchName, setEditingBranchName] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');
  const navigate = useNavigate();

  const fetchBranches = async () => {
    const data = await getBranches();
    setBranches(data);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'guide') {
      navigate('/');
      return;
    }

    fetchBranches();
  }, [navigate]);

  const handleAdd = async () => {
    if (!newBranch.name.trim() || !newBranch.password.trim()) {
      alert('נא למלא שם ענף וסיסמה');
      return;
    }

    const success = await saveBranch({
      name: newBranch.name.trim(),
      password: newBranch.password.trim(),
    });

    if (!success) {
      alert('שגיאה בשמירה ל-Firebase');
      return;
    }

    setNewBranch(emptyBranch);
    await fetchBranches();
  };

  const handleStartEdit = (branch: Branch) => {
    setEditingBranchName(branch.name);
    setEditingPassword(branch.password);
  };

  const handleSavePassword = async (branchName: string) => {
    if (!editingPassword.trim()) {
      alert('נא למלא סיסמה חדשה');
      return;
    }

    const success = await saveBranch({ name: branchName, password: editingPassword.trim() });
    if (!success) {
      alert('שגיאה בעדכון הסיסמה');
      return;
    }

    setEditingBranchName(null);
    setEditingPassword('');
    await fetchBranches();
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">ניהול הרשאות</div>
              <h1 className="page-title mb-2">ניהול ענפים</h1>
              <p className="page-subtitle">יצירת ענפים חדשים, שינוי סיסמאות מנהלים וניהול מסודר מתוך מסך אחד.</p>
            </div>
            <button onClick={() => navigate('/guide')} className="btn-secondary">
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="content-card p-5 sm:p-6">
              <div className="mb-4">
                <div className="chip mb-3">ענף חדש</div>
                <h2 className="text-2xl font-semibold">הוספת ענף</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="b-name" className="field-label">
                    שם הענף
                  </label>
                  <input
                    id="b-name"
                    name="b-name"
                    placeholder="למשל: רפת"
                    className="field-input"
                    value={newBranch.name}
                    onChange={(event) => setNewBranch({ ...newBranch, name: event.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="b-pass" className="field-label">
                    סיסמת מנהל הענף
                  </label>
                  <input
                    id="b-pass"
                    name="b-pass"
                    type="password"
                    placeholder="הגדר סיסמה"
                    className="field-input"
                    value={newBranch.password}
                    onChange={(event) => setNewBranch({ ...newBranch, password: event.target.value })}
                  />
                </div>

                <button onClick={handleAdd} className="btn-primary w-full">
                  שמור ענף
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {branches.map((branch) => (
                <div key={branch.name} className="content-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xl font-semibold">{branch.name}</div>
                      <div className="page-subtitle">מנהל ענף פעיל במערכת</div>
                    </div>
                    <div className="chip">ענף</div>
                  </div>

                  {editingBranchName === branch.name ? (
                    <div className="space-y-3">
                      <input
                        type="password"
                        className="field-input"
                        value={editingPassword}
                        onChange={(event) => setEditingPassword(event.target.value)}
                        placeholder="סיסמה חדשה"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSavePassword(branch.name)} className="btn-primary flex-1">
                          שמור סיסמה
                        </button>
                        <button
                          onClick={() => {
                            setEditingBranchName(null);
                            setEditingPassword('');
                          }}
                          className="btn-secondary flex-1"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleStartEdit(branch)} className="btn-secondary flex-1">
                        שינוי סיסמה
                      </button>
                      <button
                        onClick={async () => {
                          await deleteBranch(branch.name);
                          await fetchBranches();
                        }}
                        className="btn-danger flex-1"
                      >
                        מחק
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageBranches;
