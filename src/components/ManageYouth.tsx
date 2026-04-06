import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getYouth, saveYouth, calculateAge } from '../data';
import type { Youth } from '../types';

const ManageYouth = () => {
  const [user, setUser] = useState<any>(null);
  const [youth, setYouth] = useState<Youth[]>([]);
  // מצב חדש: שומר את ה-ID של הנער שאנחנו עורכים כרגע
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Youth>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      const youthData = await getYouth();
      setYouth(youthData);
    };
    loadData();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק נוער זה?')) {
      const updated = youth.filter(y => y.id !== id);
      await saveYouth(updated);
      setYouth(updated);
    }
  };

  // פונקציה להתחלת עריכה
  const startEdit = (y: Youth) => {
    setEditingId(y.id);
    setEditFormData(y);
  };

  // פונקציה לשמירת השינויים
  const handleSaveEdit = async () => {
    const updatedYouth = youth.map(y => 
      y.id === editingId ? { ...y, ...editFormData } : y
    );
    await saveYouth(updatedYouth as Youth[]);
    setYouth(updatedYouth as Youth[]);
    setEditingId(null); // סגירת מצב עריכה
  };

  if (!user) return <div className="text-center p-10 text-xl font-bold">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">ניהול נוער</h1>
        
        <button
          onClick={() => navigate('/guide')}
          className="w-full mb-4 bg-gray-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          חזור לסיכום
        </button>

        <div className="space-y-4">
          {youth.map(y => (
            <div key={y.id} className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
              {editingId === y.id ? (
                /* --- טופס עריכה --- */
                <div className="space-y-3">
                  <input
                    className="w-full p-2 border rounded"
                    value={editFormData.name || ''}
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="שם"
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="date"
                    value={editFormData.birthDate || ''}
                    onChange={e => setEditFormData({...editFormData, birthDate: e.target.value})}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="text"
                    value={editFormData.personalBudgetNumber || ''}
                    onChange={e => setEditFormData({...editFormData, personalBudgetNumber: e.target.value})}
                    placeholder="מספר תקציב"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
                    >
                      שמור
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                /* --- תצוגה רגילה --- */
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{y.name}</h3>
                    <p className="text-gray-500 text-sm">גיל: {calculateAge(y.birthDate)}</p>
                    <p className="text-gray-500 text-sm">תקציב: {y.personalBudgetNumber}</p>
                    <p className="text-blue-600 font-medium">שעות: {y.totalHours.toFixed(1)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startEdit(y)}
                      className="bg-blue-100 text-blue-700 py-1 px-4 rounded-md hover:bg-blue-200 text-sm font-semibold transition-colors"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(y.id)}
                      className="bg-red-50 text-red-600 py-1 px-4 rounded-md hover:bg-red-100 text-sm font-semibold transition-colors"
                    >
                      מחק
                    </button>
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