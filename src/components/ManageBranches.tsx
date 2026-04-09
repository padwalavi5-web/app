import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getCurrentUser } from '../data';
import type { Branch } from '../types';

const ManageBranches = () => {
  const [user, setUser] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', password: '' });
  const navigate = useNavigate();

  // משיכת ענפים מהענן
  const fetchBranches = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'branches'));
      const branchData = querySnapshot.docs.map(doc => doc.data() as Branch);
      setBranches(branchData);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      // בדיקת הרשאות - רק מדריך יכול לנהל ענפים
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      await fetchBranches();
    };
    loadData();
  }, [navigate]);

  const handleEdit = (name: string) => {
    setEditing(name);
    const branch = branches.find(b => b.name === name);
    if (branch) setNewPassword(branch.password);
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      const branchRef = doc(db, 'branches', editing);
      // עדכון הסיסמה בענן
      await setDoc(branchRef, { name: editing, password: newPassword }, { merge: true });
      await fetchBranches();
      setEditing(null);
      setNewPassword('');
    } catch (error) {
      console.error("Error updating branch:", error);
    }
  };

  const handleAdd = async () => {
    if (!newBranch.name || !newBranch.password) {
      alert('אנא מלא את כל השדות');
      return;
    }
    try {
      // יצירת ענף חדש בענן (שם הענף הוא ה-ID)
      await setDoc(doc(db, 'branches', newBranch.name), newBranch);
      await fetchBranches();
      setNewBranch({ name: '', password: '' });
    } catch (error) {
      console.error("Error adding branch:", error);
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את ענף ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'branches', name));
        await fetchBranches();
      } catch (error) {
        console.error("Error deleting branch:", error);
      }
    }
  };

  if (!user) return <div className="p-10 text-center">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">ניהול ענפים</h1>
        
        <button
          onClick={() => navigate('/guide')}
          className="w-full mb-6 bg-gray-600 text-white py-3 rounded-xl shadow-md font-bold"
        >
          חזור לסיכום
        </button>

        {/* טופס הוספה */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold mb-4">ענף חדש</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="שם ענף"
              value={newBranch.name}
              onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={newBranch.password}
              onChange={(e) => setNewBranch({...newBranch, password: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
            >
              הוסף למערכת
            </button>
          </div>
        </div>

        {/* רשימת ענפים */}
        <div className="space-y-4">
          {branches.map((branch) => (
            <div key={branch.name} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{branch.name}</span>
                  {!editing || editing !== branch.name ? (
                    <span className="text-gray-400 text-xs">סיסמה: {branch.password}</span>
                  ) : null}
                </div>
                <div className="flex gap-3">
                  {editing === branch.name ? (
                    <>
                      <button onClick={handleSave} className="text-green-600 font-bold">שמור</button>
                      <button onClick={() => setEditing(null)} className="text-gray-400">ביטול</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(branch.name)} className="text-blue-600 font-medium">ערוך</button>
                      <button onClick={() => handleDelete(branch.name)} className="text-red-500 font-medium">מחק</button>
                    </>
                  )}
                </div>
              </div>
              
              {editing === branch.name && (
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mr-1">עדכון סיסמה:</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full mt-1 p-2 border border-blue-200 rounded-lg bg-blue-50 outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageBranches;