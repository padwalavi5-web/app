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
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <button onClick={() => navigate('/guide')} className="mb-4 text-blue-600 font-bold underline">
        חזור
      </button>

      <h1 className="text-2xl font-bold mb-6 text-purple-700">ניהול ענפים</h1>

      <div className="bg-white p-4 shadow-lg rounded-xl mb-6 border border-purple-100">
        <input
          id="b-name"
          name="b-name"
          placeholder="שם הענף"
          className="w-full border p-2 mb-2 rounded text-right"
          value={newBranch.name}
          onChange={(event) => setNewBranch({ ...newBranch, name: event.target.value })}
        />
        <input
          id="b-pass"
          name="b-pass"
          type="password"
          placeholder="סיסמת מנהל הענף"
          className="w-full border p-2 mb-4 rounded text-right"
          value={newBranch.password}
          onChange={(event) => setNewBranch({ ...newBranch, password: event.target.value })}
        />
        <button onClick={handleAdd} className="w-full bg-purple-600 text-white p-2 rounded-lg font-bold">
          שמור ענף
        </button>
      </div>

      <div className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.name} className="p-3 bg-gray-50 rounded-lg border">
            <div className="font-bold mb-3">{branch.name}</div>

            {editingBranchName === branch.name ? (
              <div className="space-y-2">
                <input
                  type="password"
                  className="w-full border p-2 rounded text-right"
                  value={editingPassword}
                  onChange={(event) => setEditingPassword(event.target.value)}
                  placeholder="סיסמה חדשה"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSavePassword(branch.name)}
                    className="flex-1 bg-purple-600 text-white p-2 rounded-lg font-bold"
                  >
                    שמור סיסמה
                  </button>
                  <button
                    onClick={() => {
                      setEditingBranchName(null);
                      setEditingPassword('');
                    }}
                    className="flex-1 bg-gray-200 p-2 rounded-lg"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartEdit(branch)}
                  className="flex-1 bg-blue-50 text-blue-700 p-2 rounded-lg font-bold"
                >
                  שינוי סיסמה
                </button>
                <button
                  onClick={async () => {
                    await deleteBranch(branch.name);
                    await fetchBranches();
                  }}
                  className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg font-bold"
                >
                  מחק
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageBranches;
