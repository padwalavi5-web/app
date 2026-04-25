import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEdit3, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { addRate, getCurrentUser, deleteRate, getRates, updateRate } from '../data';
import type { CurrentUser, HourlyRate } from '../types';

const ManageRates = () => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [newRate, setNewRate] = useState({ age: '', rate: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ age: '', rate: '' });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = getCurrentUser() as CurrentUser | null;
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRates();
      setRates(data.sort((a, b) => a.age - b.age));
    } catch (error) {
      console.error('Failed to load rates:', error);
      alert('טעינת התעריפים נכשלה.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!guideUser) {
      navigate('/');
      return;
    }

    void loadRates();
  }, [guideUser, loadRates, navigate]);

  const handleAdd = async () => {
    const parsedAge = parseInt(newRate.age, 10);
    const parsedRate = parseFloat(newRate.rate);
    if (!Number.isFinite(parsedAge) || !Number.isFinite(parsedRate)) {
      alert('צריך להזין גיל ותעריף תקינים.');
      return;
    }

    await addRate({ age: parsedAge, rate: parsedRate });
    setNewRate({ age: '', rate: '' });
    await loadRates();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('למחוק את התעריף הזה?')) {
      return;
    }

    try {
      await deleteRate(id);
      await loadRates();
    } catch (error) {
      console.error('Delete error:', error);
      alert('שגיאה במחיקה. בדוק הרשאות ב-Firebase.');
    }
  };

  const startEdit = (rate: HourlyRate) => {
    setEditingId(rate.id);
    setEditValue({ age: rate.age.toString(), rate: rate.rate.toString() });
  };

  const saveEdit = async (id: string) => {
    const parsedAge = parseInt(editValue.age, 10);
    const parsedRate = parseFloat(editValue.rate);
    if (!Number.isFinite(parsedAge) || !Number.isFinite(parsedRate)) {
      alert('צריך להזין גיל ותעריף תקינים.');
      return;
    }

    try {
      await updateRate(id, { age: parsedAge, rate: parsedRate });
      setEditingId(null);
      await loadRates();
    } catch (error) {
      console.error('Update error:', error);
      alert('שגיאה בעדכון התעריף.');
    }
  };

  if (!guideUser) {
    return null;
  }

  if (isLoading) {
    return <div className="app-shell flex items-center justify-center text-center">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-4">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">תמחור</div>
              <h1 className="page-title mb-0">תעריפים</h1>
            </div>
            <button type="button" onClick={() => navigate('/guide')} className="btn-secondary">
              <FiArrowRight size={18} />
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="content-card p-6 h-fit">
              <div className="mb-4 flex items-center gap-3">
                <span className="icon-badge"><FiPlus size={18} /></span>
                <div>
                  <h2 className="section-title">הוספת תעריף</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="age-input" className="field-label">גיל</label>
                  <input
                    id="age-input"
                    type="number"
                    className="field-input"
                    value={newRate.age}
                    onChange={(event) => setNewRate({ ...newRate, age: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="rate-input" className="field-label">תעריף לשעה</label>
                  <input
                    id="rate-input"
                    type="number"
                    className="field-input"
                    value={newRate.rate}
                    onChange={(event) => setNewRate({ ...newRate, rate: event.target.value })}
                  />
                </div>
                <button type="button" onClick={handleAdd} className="btn-primary w-full">
                  <FiSave size={18} />
                  הוסף תעריף
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {rates.map((rate) => (
                <div key={rate.id} className="content-card p-5">
                  {editingId === rate.id ? (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor={`edit-age-${rate.id}`} className="field-label">גיל</label>
                        <input
                          id={`edit-age-${rate.id}`}
                          type="number"
                          className="field-input"
                          value={editValue.age}
                          onChange={(event) => setEditValue({ ...editValue, age: event.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-rate-${rate.id}`} className="field-label">תעריף</label>
                        <input
                          id={`edit-rate-${rate.id}`}
                          type="number"
                          className="field-input"
                          value={editValue.rate}
                          onChange={(event) => setEditValue({ ...editValue, rate: event.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void saveEdit(rate.id)} className="btn-primary flex-1">
                          שמור
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary flex-1">
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-3xl font-semibold">₪{rate.rate}</span>
                        <span className="chip">גיל {rate.age}</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(rate)} className="btn-secondary flex-1">
                          <FiEdit3 size={16} />
                          ערוך
                        </button>
                        <button type="button" onClick={() => void handleDelete(rate.id)} className="btn-danger flex-1">
                          <FiTrash2 size={16} />
                          מחק
                        </button>
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
