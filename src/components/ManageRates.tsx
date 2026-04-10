import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRate, getRates, deleteRate, updateRate } from '../data'; 
import type { HourlyRate } from '../types';

const ManageRates = () => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [newRate, setNewRate] = useState({ age: '', rate: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ age: '', rate: '' });
  const navigate = useNavigate();

  const loadRates = async () => {
    try {
      const data = await getRates();
      setRates(data.sort((a, b) => a.age - b.age));
    } catch (err) {
      console.error("Failed to load rates:", err);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleAdd = async () => {
    if (!newRate.age || !newRate.rate) return;
    await addRate({
      age: parseInt(newRate.age, 10),
      rate: parseFloat(newRate.rate),
    });
    setNewRate({ age: '', rate: '' });
    loadRates();
  };

  const handleDelete = async (id: string) => {
    console.log("Attempting to delete ID:", id); // לוג לבדיקה
    if (window.confirm('האם למחוק את התעריף הזה?')) {
      try {
        await deleteRate(id);
        console.log("Delete successful");
        await loadRates();
      } catch (err) {
        console.error("Delete error:", err);
        alert('שגיאה במחיקה - בדוק הרשאות ב-Firebase');
      }
    }
  };

  const startEdit = (rate: HourlyRate) => {
    setEditingId(rate.id);
    setEditValue({ age: rate.age.toString(), rate: rate.rate.toString() });
  };

  const saveEdit = async (id: string) => {
    console.log("Attempting to update ID:", id, editValue); // לוג לבדיקה
    try {
      await updateRate(id, {
        age: parseInt(editValue.age, 10),
        rate: parseFloat(editValue.rate),
      });
      console.log("Update successful");
      setEditingId(null);
      await loadRates();
    } catch (err) {
      console.error("Update error:", err);
      alert('שגיאה בעדכון');
    }
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">תמחור</div>
              <h1 className="page-title mb-2">ניהול תעריפי שכר</h1>
            </div>
            <button onClick={() => navigate('/guide')} className="btn-secondary">חזור</button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* טופס הוספה עם Labels לתיקון השגיאות בצילום מסך */}
            <div className="content-card p-5 h-fit">
              <h2 className="text-xl font-bold mb-4">הוספה</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="age-input" className="block text-sm mb-1">גיל</label>
                  <input
                    id="age-input"
                    type="number"
                    className="field-input"
                    value={newRate.age}
                    onChange={(e) => setNewRate({ ...newRate, age: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="rate-input" className="block text-sm mb-1">תעריף</label>
                  <input
                    id="rate-input"
                    type="number"
                    className="field-input"
                    value={newRate.rate}
                    onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                  />
                </div>
                <button onClick={handleAdd} className="btn-primary w-full">הוסף</button>
              </div>
            </div>

            {/* רשימת תעריפים */}
            <div className="grid gap-4 sm:grid-cols-2">
              {rates.map((rate) => (
                <div key={rate.id} className="content-card p-4">
                  {editingId === rate.id ? (
                    <div className="space-y-3">
                      <label className="sr-only" htmlFor={`edit-age-${rate.id}`}>ערוך גיל</label>
                      <input
                        id={`edit-age-${rate.id}`}
                        type="number"
                        className="field-input"
                        value={editValue.age}
                        onChange={(e) => setEditValue({ ...editValue, age: e.target.value })}
                      />
                      <label className="sr-only" htmlFor={`edit-rate-${rate.id}`}>ערוך תעריף</label>
                      <input
                        id={`edit-rate-${rate.id}`}
                        type="number"
                        className="field-input"
                        value={editValue.rate}
                        onChange={(e) => setEditValue({ ...editValue, rate: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(rate.id)} className="btn-primary flex-1">שמור</button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary flex-1">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold">₪{rate.rate}</span>
                        <span className="chip">גיל {rate.age}</span>
                      </div>
                      <div className="flex gap-4 border-t pt-3">
                        <button onClick={() => startEdit(rate)} className="text-blue-600 font-bold text-sm hover:underline">ערוך</button>
                        <button onClick={() => handleDelete(rate.id)} className="text-red-500 font-bold text-sm hover:underline">מחק</button>
                      </div>
                    </>
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

export default ManageRates;