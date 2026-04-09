import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBranches, saveBranch, deleteBranch, getCurrentUser } from '../data';
import type { Branch } from '../types';

const ManageBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState({ name: '', password: '' });
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
    if (!newBranch.name || !newBranch.password) {
      alert('נא למלא שם ענף וסיסמה');
      return;
    }
    await saveBranch(newBranch);
    setNewBranch({ name: '', password: '' });
    fetchBranches();
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`האם למחוק את ענף ${name}?`)) {
      await deleteBranch(name);
      fetchBranches();
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto" dir="rtl">
      <button onClick={() => navigate('/guide')} className="mb-4 text-blue-600 font-bold underline">חזור</button>
      <h1 className="text-2xl font-bold mb-6 text-purple-700">ניהול ענפים</h1>
      
      <div className="bg-white p-4 shadow-lg rounded-xl mb-6 border border-purple-100">
        <h2 className="font-bold mb-3">הוסף ענף חדש</h2>
        <input 
          title="שם ענף" placeholder="שם הענף (למשל: רפת)" 
          className="w-full border p-2 mb-2 rounded"
          value={newBranch.name}
          onChange={e => setNewBranch({...newBranch, name: e.target.value})}
        />
        <input 
          title="סיסמה" placeholder="סיסמת מנהל ענף" 
          className="w-full border p-2 mb-4 rounded"
          value={newBranch.password}
          onChange={e => setNewBranch({...newBranch, password: e.target.value})}
        />
        <button onClick={handleAdd} className="w-full bg-purple-600 text-white p-2 rounded-lg font-bold">שמור ענף</button>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold">ענפים קיימים:</h2>
        {branches.map(b => (
          <div key={b.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
            <div>
              <div className="font-bold">{b.name}</div>
              <div className="text-xs text-gray-500">סיסמה: {b.password}</div>
            </div>
            <button onClick={() => handleDelete(b.name)} className="text-red-500 text-sm font-bold">מחק</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageBranches;