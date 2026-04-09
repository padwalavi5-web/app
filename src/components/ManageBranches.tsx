import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBranches, saveBranch, deleteBranch, getCurrentUser } from '../data';
import type { Branch } from '../types';

const ManageBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  // הגדרת ה-State עם הטיפוס הנכון כדי למנוע שגיאות TS
  const [newBranch, setNewBranch] = useState<Branch>({ name: '', password: '' });
  const navigate = useNavigate();

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data || []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
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

    // שליחת האובייקט ל-Firebase
    const success = await saveBranch(newBranch);
    
    if (success) {
      setNewBranch({ name: '', password: '' });
      await fetchBranches();
    } else {
      alert('שגיאה בשמירה. וודא שה-Rules ב-Firebase פתוחים (allow read, write: if true).');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`האם למחוק את ענף ${name}?`)) {
      await deleteBranch(name);
      await fetchBranches();
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <button 
        onClick={() => navigate('/guide')} 
        className="mb-4 text-blue-600 font-bold hover:underline"
      >
        ← חזור לתפריט מדריך
      </button>
      
      <h1 className="text-2xl font-bold mb-6 text-purple-700">ניהול ענפים</h1>
      
      <div className="bg-white p-5 shadow-xl rounded-2xl mb-8 border border-purple-100">
        <h2 className="font-bold mb-4 text-gray-800">הוספת ענף חדש</h2>
        <div className="space-y-3">
          <input 
            id="branch-name" 
            name="branch-name"
            type="text"
            placeholder="שם הענף (למשל: רפת)" 
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            value={newBranch.name}
            onChange={e => setNewBranch({...newBranch, name: e.target.value})}
          />
          <input 
            id="branch-password" 
            name="branch-password"
            type="text" // מנהל צריך לראות מה הוא קובע כסיסמה
            placeholder="סיסמת מנהל ענף" 
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            value={newBranch.password}
            onChange={e => setNewBranch({...newBranch, password: e.target.value})}
          />
          <button 
            onClick={handleAdd} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            שמור ענף במערכת
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-gray-700">ענפים קיימים:</h2>
        {branches.length === 0 ? (
          <div className="text-gray-400 text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">
            אין ענפים רשומים כרגע
          </div>
        ) : (
          branches.map(b => (
            <div key={b.name} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <button 
                onClick={() => handleDelete(b.name)} 
                className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
              >
                מחק
              </button>
              <div className="text-right">
                <div className="font-bold text-gray-800">{b.name}</div>
                <div className="text-xs text-gray-400 font-mono">סיסמה: {b.password}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageBranches;