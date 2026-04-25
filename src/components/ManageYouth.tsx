import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiClock, FiEdit3, FiSave, FiTrash2, FiUser } from 'react-icons/fi';
import { calculateAge, deleteYouth, getCurrentUser, getRates, getReports, getYouth, updateYouth } from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary } from '../workSummary';

const ManageYouth = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Youth>>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = getCurrentUser() as CurrentUser | null;
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  const fetchYouthData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [youthData, reportData, rateData] = await Promise.all([getYouth(), getReports(), getRates()]);
      setYouth(youthData);
      setReports(reportData);
      setRates(rateData);
    } catch (error) {
      console.error('Error fetching youth:', error);
      alert('טעינת נתוני הנוער נכשלה.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!guideUser) {
      navigate('/');
      return;
    }

    void fetchYouthData();
  }, [fetchYouthData, guideUser, navigate]);

  const summaryById = useMemo(
    () => new Map(youth.map((item) => [item.id, buildYouthWorkSummary(item, reports, rates)])),
    [reports, rates, youth],
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('למחוק את הנער ואת כל הדיווחים שלו?')) {
      return;
    }

    try {
      await deleteYouth(id);
      await fetchYouthData();
    } catch (error) {
      console.error('Error deleting youth:', error);
      alert('מחיקת הנער נכשלה.');
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
      await updateYouth(editingId, {
        name: String(editFormData.name ?? '').trim(),
        birthDate: editFormData.birthDate,
        personalBudgetNumber: String(editFormData.personalBudgetNumber ?? '').trim(),
        manualHoursAdjustment: Number(editFormData.manualHoursAdjustment ?? 0),
      });
      await fetchYouthData();
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating youth:', error);
      alert('עדכון הנער נכשל.');
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
              <div className="chip mb-3">ניהול נוער</div>
              <h1 className="page-title mb-0">נוער</h1>
            </div>
            <button type="button" onClick={() => navigate('/guide')} className="btn-secondary">
              <FiArrowRight size={18} />
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {youth.map((youthItem) => {
              const summary = summaryById.get(youthItem.id);

              return (
                <div key={youthItem.id} className="content-card p-5">
                  {editingId === youthItem.id ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`name-${youthItem.id}`} className="field-label">שם מלא</label>
                        <input
                          id={`name-${youthItem.id}`}
                          className="field-input"
                          value={editFormData.name || ''}
                          onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor={`date-${youthItem.id}`} className="field-label">תאריך לידה</label>
                        <input
                          id={`date-${youthItem.id}`}
                          className="field-input"
                          type="date"
                          value={editFormData.birthDate || ''}
                          onChange={(event) => setEditFormData({ ...editFormData, birthDate: event.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor={`budget-${youthItem.id}`} className="field-label">מספר תקציב</label>
                        <input
                          id={`budget-${youthItem.id}`}
                          className="field-input"
                          type="text"
                          value={editFormData.personalBudgetNumber || ''}
                          onChange={(event) => setEditFormData({ ...editFormData, personalBudgetNumber: event.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor={`manual-hours-${youthItem.id}`} className="field-label">תיקון ידני לשעות</label>
                        <input
                          id={`manual-hours-${youthItem.id}`}
                          className="field-input"
                          type="number"
                          step="0.5"
                          value={String(editFormData.manualHoursAdjustment ?? 0)}
                          onChange={(event) => setEditFormData({ ...editFormData, manualHoursAdjustment: Number(event.target.value) })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={handleSaveEdit} className="btn-primary flex-1">
                          <FiSave size={16} />
                          שמור
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary flex-1">
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="chip mb-3">
                            <FiUser size={12} />
                            פרופיל נער
                          </div>
                          <h3 className="text-xl font-semibold">{youthItem.name}</h3>
                          <p className="page-subtitle">גיל {calculateAge(youthItem.birthDate)} | תקציב {youthItem.personalBudgetNumber}</p>
                        </div>
                        <div className="chip chip-warm">
                          <FiClock size={12} />
                          {summary?.payablePendingHours.toFixed(1) ?? '0.0'} שעות לתשלום
                        </div>
                      </div>

                      <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-3xl bg-slate-50/90 p-4">
                          <div className="text-xs text-slate-500">שעות במחזור</div>
                          <div className="mt-2 text-xl font-semibold">{summary?.cycleApprovedHours.toFixed(1) ?? '0.0'}</div>
                        </div>
                        <div className="rounded-3xl bg-slate-50/90 p-4">
                          <div className="text-xs text-slate-500">תיקון ידני</div>
                          <div className="mt-2 text-xl font-semibold">{Number(youthItem.manualHoursAdjustment ?? 0).toFixed(1)}</div>
                        </div>
                        <div className="rounded-3xl bg-slate-50/90 p-4">
                          <div className="text-xs text-slate-500">שעות חובה</div>
                          <div className="mt-2 text-xl font-semibold">{summary?.mandatoryCompletedHours.toFixed(1) ?? '0.0'}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(youthItem)} className="btn-secondary flex-1">
                          <FiEdit3 size={16} />
                          ערוך
                        </button>
                        <button type="button" onClick={() => void handleDelete(youthItem.id)} className="btn-danger flex-1">
                          <FiTrash2 size={16} />
                          מחק
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageYouth;
