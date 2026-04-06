import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getBranches, saveBranches } from '../data';
import type { Branch } from '../types';

const ManageBranches = () => {
  const [user, setUser] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', password: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      const branchData = await getBranches();
      setBranches(branchData);
    };
    loadData();
  }, [navigate]);

  const handleEdit = (id: string) => {
    setEditing(id);
    const branch = branches.find(b => b.name === id);
    if (branch) setNewPassword(branch.password);
  };

  const handleSave = async () => {
    const updated = branches.map(b => b.name === editing ? { ...b, password: newPassword } : b);
    await saveBranches(updated);
    setBranches(updated);
    setEditing(null);
    setNewPassword('');
  };

  const handleAdd = async () => {
    if (!newBranch.name || !newBranch.password) {
      alert('אנא מלא את כל השדות');
      return;
    }
    if (branches.some(b => b.name === newBranch.name)) {
      alert('ענף כבר קיים');
      return;
    }
    const updated = [...branches, newBranch];
    await saveBranches(updated);
    setBranches(updated);
    setNewBranch({ name: '', password: '' });
  };

  const handleDelete = async (name: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק ענף זה?')) {
      const updated = branches.filter(b => b.name !== name);
      await saveBranches(updated);
      setBranches(updated);
    }
  };

  if (!user) return <div>טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">ניהול ענפים</h1>
        
        <button
          onClick={() => navigate('/guide')}
          className="w-full mb-4 bg-gray-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          חזור לסיכום
        </button>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">הוסף ענף חדש</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="שם ענף"
              title="שם ענף חדש"
              value={newBranch.name}
              onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="סיסמה"
              title="סיסמה לענף"
              value={newBranch.password}
              onChange={(e) => setNewBranch({...newBranch, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              הוסף
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {branches.map(branch => (
            <div key={branch.name} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">{branch.name}</h3>
                <div className="flex space-x-2">
                  {editing === branch.name ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700 text-sm"
                      >
                        ביטול
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(branch.name)}
                        className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(branch.name)}
                        className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 text-sm"
                      >
                        מחק
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div>
                {editing === branch.name ? (
                  <input
                    type="password"
                    title="סיסמה חדשה לענף"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="הכנס סיסמה חדשה"
                  />
                ) : (
                  <p className="text-gray-600">סיסמה: ••••••</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageBranches;