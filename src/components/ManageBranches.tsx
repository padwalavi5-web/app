import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiKey, FiLayers, FiLock, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import {
  deleteBranch,
  getBranches,
  getCurrentUser,
  saveBranch,
  updateBranchPassword,
  updateGuidePassword,
} from '../data';
import type { Branch, CurrentUser } from '../types';

const emptyBranch: Branch = { name: '', password: '' };

const ManageBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState<Branch>(emptyBranch);
  const [editingBranchName, setEditingBranchName] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');
  const [guidePassword, setGuidePassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = getCurrentUser() as CurrentUser | null;
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchList = await getBranches();
      setBranches(branchList.sort((left, right) => left.name.localeCompare(right.name, 'he')));
    } catch (error) {
      console.error(error);
      alert('טעינת הענפים נכשלה.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!guideUser) {
      navigate('/');
      return;
    }
    void fetchBranches();
  }, [fetchBranches, guideUser, navigate]);

  const handleAdd = async () => {
    if (!newBranch.name.trim() || !newBranch.password.trim()) {
      alert('צריך למלא שם ענף וסיסמה.');
      return;
    }

    const created = await saveBranch(newBranch);
    if (!created) {
      alert('לא ניתן היה לשמור את הענף.');
      return;
    }

    setNewBranch(emptyBranch);
    await fetchBranches();
  };

  const handleSaveBranchPassword = async (name: string) => {
    if (!editingPassword.trim()) {
      alert('צריך להכניס סיסמה חדשה.');
      return;
    }

    await updateBranchPassword(name, editingPassword);
    setEditingBranchName(null);
    setEditingPassword('');
    await fetchBranches();
  };

  const handleSaveGuidePassword = async () => {
    if (!guidePassword.trim()) {
      alert('צריך להכניס סיסמת מדריך חדשה.');
      return;
    }

    await updateGuidePassword(guidePassword);
    setGuidePassword('');
    alert('סיסמת המדריך עודכנה.');
  };

  if (!guideUser || isLoading) {
    return <div className="app-shell flex items-center justify-center text-center">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-6xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">ניהול ענפים והרשאות</div>
              <h1 className="page-title mb-2">ניהול ענפים וסיסמת מדריך</h1>
              <p className="page-subtitle">כאן אפשר לפתוח ענפים חדשים, לעדכן סיסמאות ענף, וגם לשנות את סיסמת המדריך.</p>
            </div>
            <button type="button" onClick={() => navigate('/guide')} className="btn-secondary">
              <FiArrowRight size={18} />
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="content-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="icon-badge"><FiPlus size={18} /></span>
                  <div>
                    <h2 className="section-title">הוספת ענף חדש</h2>
                    <p className="page-subtitle">יצירת כניסה חדשה למנהל ענף.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-branch-name" className="field-label">שם הענף</label>
                    <input
                      id="new-branch-name"
                      className="field-input"
                      value={newBranch.name}
                      onChange={(event) => setNewBranch({ ...newBranch, name: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-branch-password" className="field-label">סיסמת ענף</label>
                    <input
                      id="new-branch-password"
                      type="password"
                      className="field-input"
                      value={newBranch.password}
                      onChange={(event) => setNewBranch({ ...newBranch, password: event.target.value })}
                    />
                  </div>
                  <button type="button" onClick={handleAdd} className="btn-primary w-full">
                    <FiSave size={18} />
                    שמור ענף
                  </button>
                </div>
              </div>

              <div className="content-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="icon-badge"><FiKey size={18} /></span>
                  <div>
                    <h2 className="section-title">סיסמת מדריך</h2>
                    <p className="page-subtitle">עדכון סיסמת המדריך הראשית של המערכת.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="guide-password" className="field-label">סיסמה חדשה למדריך</label>
                    <input
                      id="guide-password"
                      type="password"
                      className="field-input"
                      value={guidePassword}
                      onChange={(event) => setGuidePassword(event.target.value)}
                    />
                  </div>
                  <button type="button" onClick={handleSaveGuidePassword} className="btn-primary w-full">
                    <FiLock size={18} />
                    עדכן סיסמת מדריך
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {branches.length === 0 ? (
                <div className="empty-state">
                  <p className="page-subtitle">עדיין לא הוגדרו ענפים.</p>
                </div>
              ) : (
                branches.map((branch) => (
                  <div key={branch.name} className="content-card p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="chip mb-2">ענף פעיל</div>
                        <h3 className="text-xl font-semibold">{branch.name}</h3>
                      </div>
                      <span className="icon-badge"><FiLayers size={18} /></span>
                    </div>

                    {editingBranchName === branch.name ? (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`edit-password-${branch.name}`} className="field-label">סיסמה חדשה</label>
                          <input
                            id={`edit-password-${branch.name}`}
                            type="password"
                            className="field-input"
                            value={editingPassword}
                            onChange={(event) => setEditingPassword(event.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void handleSaveBranchPassword(branch.name)} className="btn-primary flex-1">
                            שמור
                          </button>
                          <button
                            type="button"
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
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranchName(branch.name);
                            setEditingPassword(branch.password);
                          }}
                          className="btn-secondary flex-1"
                        >
                          ערוך סיסמה
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`למחוק את ענף ${branch.name}?`)) {
                              return;
                            }
                            await deleteBranch(branch.name);
                            await fetchBranches();
                          }}
                          className="btn-danger flex-1"
                        >
                          <FiTrash2 size={16} />
                          מחק
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageBranches;