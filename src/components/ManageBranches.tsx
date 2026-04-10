import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBranches, saveBranch, deleteBranch, getCurrentUser } from '../data';
import type { Branch } from '../types';

const ManageBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState<Branch>({ name: '', password: '' });
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
    if (!newBranch.name || !newBranch.password) {
      alert('נא למלא שם ענף וסיסמה');
      return;
    }
    const success = await saveBranch(newBranch);
    if (success) {
      setNewBranch({ name: '', password: '' });
      await fetchBranches();
    } else {
      alert('שגיאה בשמירה ל-Firebase');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <button onClick={() => navigate('/guide')} className="mb-4 text-blue-600 font-bold underline">חזור</button>
      <h1 className="text-2xl font-bold mb-6 text-purple-700">ניהול ענפים</h1>
      <div className="bg-white p-4 shadow-lg rounded-xl mb-6 border border-purple-100">
        <input 
          id="b-name" name="b-name" placeholder="שם הענף" 
          className="w-full border p-2 mb-2 rounded text-right"
          value={newBranch.name}
          onChange={e => setNewBranch({...newBranch, name: e.target.value})}
        />
        <input 
          id="b-pass" name="b-pass" placeholder="סיסמת מנהל" 
          className="w-full border p-2 mb-4 rounded text-right"
          value={newBranch.password}
          onChange={e => setNewBranch({...newBranch, password: e.target.value})}
        />
        <button onClick={handleAdd} className="w-full bg-purple-600 text-white p-2 rounded-lg font-bold">שמור ענף</button>
      </div>
      <div className="space-y-2">
        {branches.map(b => (
          <div key={b.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
            <button onClick={async () => { await deleteBranch(b.name); fetchBranches(); }} className="text-red-500 font-bold">מחק</button>
            <div className="text-right font-bold">{b.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageBranches;