import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCurrentUser, calculateAge } from '../data';
import type { Youth } from '../types';

const ManageYouth = () => {
  const [user, setUser] = useState<any>(null);
  const [youth, setYouth] = useState<Youth[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Youth>>({});

  const navigate = useNavigate();

  const fetchYouth = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'youth'));
      const youthData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Youth));
      setYouth(youthData);
    } catch (error) {
      console.error("Error fetching youth:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      await fetchYouth();
    };
    loadData();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק נוער זה?')) {
      try {
        await deleteDoc(doc(db, 'youth', id));
        await fetchYouth();
      } catch (error) {
        console.error("Error deleting youth:", error);
      }
    }
  };

  const startEdit = (y: Youth) => {
    setEditingId(y.id);
    setEditFormData(y);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const youthRef = doc(db, 'youth', editingId);
      await updateDoc(youthRef, {
        name: editFormData.name,
        birthDate: editFormData.birthDate,
        personalBudgetNumber: editFormData.personalBudgetNumber
      });
      await fetchYouth();
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error("Error updating youth:", error);
    }
  };

  if (!user) return <div className="text-center p-10">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">ניהול נוער</h1>
        
        <button
          onClick={() => navigate('/guide')}
          className="w-full mb-4 bg-gray-600 text-white py-3 rounded-xl shadow-md"
        >
          חזור לסיכום
        </button>

        <div className="space-y-4">
          {youth.map(y => (
            <div key={y.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              {editingId === y.id ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`name-${y.id}`} className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                    <input
                      id={`name-${y.id}`}
                      className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.name || ''}
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor={`date-${y.id}`} className="block text-sm font-medium text-gray-700 mb-1">תאריך לידה</label>
                    <input
                      id={`date-${y.id}`}
                      className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      type="date"
                      value={editFormData.birthDate || ''}
                      onChange={e => setEditFormData({...editFormData, birthDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor={`budget-${y.id}`} className="block text-sm font-medium text-gray-700 mb-1">מספר תקציב</label>
                    <input
                      id={`budget-${y.id}`}
                      className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      type="text"
                      value={editFormData.personalBudgetNumber || ''}
                      onChange={e => setEditFormData({...editFormData, personalBudgetNumber: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold">שמור</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg">ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800">{y.name}</h3>
                    <p className="text-gray-500 text-xs">גיל: {calculateAge(y.birthDate)} | תקציב: {y.personalBudgetNumber}</p>
                    <p className="text-blue-600 text-sm font-bold">שעות: {y.totalHours?.toFixed(1) || 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(y)} className="text-blue-600 text-sm font-medium">ערוך</button>
                    <button onClick={() => handleDelete(y.id)} className="text-red-500 text-sm font-medium">מחק</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageYouth;