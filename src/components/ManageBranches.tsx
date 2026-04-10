import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteBranch, getBranches, getCurrentUser, saveBranch, updateBranchPassword } from '../data';
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
    if (!user || user.role !== 'guide') { navigate('/'); return; }
    fetchBranches();
  }, [navigate]);

  const handleAdd = async () => {
    if (!newBranch.name.trim() || !newBranch.password.trim()) return;
    await saveBranch(newBranch);
    setNewBranch(emptyBranch);
    fetchBranches();
  };

  const handleSavePassword = async (name: string) => {
    await updateBranchPassword(name, editingPassword);
    setEditingBranchName(null);
    fetchBranches();
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="page-title">ניהול ענפים</h1>
            <button onClick={() => navigate('/guide')} className="btn-secondary">חזור</button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="content-card p-6">
              <h2 className="font-bold mb-4">הוספת ענף</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="new-branch-name" className="field-label">שם הענף</label>
                  <input id="new-branch-name" className="field-input" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="new-branch-pwd" className="field-label">סיסמה</label>
                  <input id="new-branch-pwd" type="password" className="field-input" value={newBranch.password} onChange={(e) => setNewBranch({ ...newBranch, password: e.target.value })} />
                </div>
                <button onClick={handleAdd} className="btn-primary w-full">שמור</button>
              </div>
            </div>

            <div className="space-y-4">
              {branches.map((b) => (
                <div key={b.name} className="content-card p-4">
                  <div className="font-bold mb-2">{b.name}</div>
                  {editingBranchName === b.name ? (
                    <div className="space-y-2">
                      <label htmlFor={`edit-pwd-${b.name}`} className="sr-only">סיסמה חדשה</label>
                      <input id={`edit-pwd-${b.name}`} type="password" className="field-input" value={editingPassword} onChange={(e) => setEditingPassword(e.target.value)} />
                      <button onClick={() => handleSavePassword(b.name)} className="btn-primary w-full">עדכן</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingBranchName(b.name); setEditingPassword(b.password); }} className="btn-secondary flex-1">ערוך</button>
                      <button onClick={async () => { if(confirm('למחוק?')) { await deleteBranch(b.name); fetchBranches(); } }} className="btn-danger flex-1">מחק</button>
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