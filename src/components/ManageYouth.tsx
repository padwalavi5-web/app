import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { calculateAge, getCurrentUser } from '../data';
import { db } from '../firebase';
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
      const youthData = querySnapshot.docs.map(
        (youthDoc) =>
          ({
            id: youthDoc.id,
            ...youthDoc.data(),
          }) as Youth,
      );
      setYouth(youthData);
    } catch (error) {
      console.error('Error fetching youth:', error);
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
    if (window.confirm('האם למחוק את הנער מהרשימה?')) {
      try {
        await deleteDoc(doc(db, 'youth', id));
        await fetchYouth();
      } catch (error) {
        console.error('Error deleting youth:', error);
      }
    }
  };

  const startEdit = (youthItem: Youth) => {
    setEditingId(youthItem.id);
    setEditFormData(youthItem);
  };

  const handleSaveEdit = async () => {
    if (!editingId) {
      return;
    }

    try {
      const youthRef = doc(db, 'youth', editingId);
      await updateDoc(youthRef, {
        name: editFormData.name,
        birthDate: editFormData.birthDate,
        personalBudgetNumber: editFormData.personalBudgetNumber,
      });
      await fetchYouth();
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating youth:', error);
    }
  };

  if (!user) {
    return <div className="app-shell flex items-center justify-center text-center">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">ניהול משתמשים</div>
              <h1 className="page-title mb-2">ניהול נוער</h1>
              <p className="page-subtitle">עריכה מהירה של פרטי נערים, תצוגת שעות כוללת ופעולות ישירות מתוך הכרטיס.</p>
            </div>
            <button onClick={() => navigate('/guide')} className="btn-secondary">
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {youth.map((youthItem) => (
              <div key={youthItem.id} className="content-card p-5">
                {editingId === youthItem.id ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor={`name-${youthItem.id}`} className="field-label">
                        שם מלא
                      </label>
                      <input
                        id={`name-${youthItem.id}`}
                        className="field-input"
                        value={editFormData.name || ''}
                        onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor={`date-${youthItem.id}`} className="field-label">
                        תאריך לידה
                      </label>
                      <input
                        id={`date-${youthItem.id}`}
                        className="field-input"
                        type="date"
                        value={editFormData.birthDate || ''}
                        onChange={(event) => setEditFormData({ ...editFormData, birthDate: event.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor={`budget-${youthItem.id}`} className="field-label">
                        מספר תקציב
                      </label>
                      <input
                        id={`budget-${youthItem.id}`}
                        className="field-input"
                        type="text"
                        value={editFormData.personalBudgetNumber || ''}
                        onChange={(event) =>
                          setEditFormData({ ...editFormData, personalBudgetNumber: event.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="btn-primary flex-1">
                        שמור
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary flex-1">
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">{youthItem.name}</h3>
                        <p className="page-subtitle">
                          גיל: {calculateAge(youthItem.birthDate)} | תקציב: {youthItem.personalBudgetNumber}
                        </p>
                      </div>
                      <div className="chip">{youthItem.totalHours?.toFixed(1) || 0} שעות</div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(youthItem)} className="btn-secondary flex-1">
                        ערוך
                      </button>
                      <button onClick={() => handleDelete(youthItem.id)} className="btn-danger flex-1">
                        מחק
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageYouth;
