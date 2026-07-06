import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiClock, FiEdit3, FiSave, FiTrash2, FiUser } from 'react-icons/fi';
import { calculateAge, deleteYouth, getCurrentUser, getRates, getReports, getYouth, updateYouth } from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthHoursUpdate, buildYouthWorkSummary } from '../workSummary';

interface HoursDraft {
  mandatoryHours: string;
  payableHours: string;
}

type EditableYouthField = 'name' | 'birthDate' | 'personalBudgetNumber' | 'mandatoryHours' | 'payableHours';

const reportStatusLabel: Record<Report['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
  paid: 'שולם',
};

interface EditModalState {
  youthId: string;
  field: EditableYouthField;
  label: string;
  type: 'text' | 'date' | 'number';
  value: string;
  helper: string;
  baseHours?: HoursDraft;
}

// Build the default editable hour values from the current summary.
const createHoursDraft = (summary?: ReturnType<typeof buildYouthWorkSummary>): HoursDraft => ({
  mandatoryHours: summary?.mandatoryCompletedHours.toFixed(1) ?? '0.0',
  payableHours: summary?.payablePendingHours.toFixed(1) ?? '0.0',
});

// Parse a numeric input while treating empty or invalid values as zero.
const parseHourInput = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getEditModalState = (
  youthItem: Youth,
  field: EditableYouthField,
  summary?: ReturnType<typeof buildYouthWorkSummary>,
): EditModalState => {
  const hoursDraft = createHoursDraft(summary);

  switch (field) {
    case 'name':
      return {
        youthId: youthItem.id,
        field,
        label: 'שם מלא',
        type: 'text',
        value: youthItem.name,
        helper: 'השם שיופיע בכרטיס הנוער וברשימות.',
      };
    case 'birthDate':
      return {
        youthId: youthItem.id,
        field,
        label: 'תאריך לידה',
        type: 'date',
        value: youthItem.birthDate,
        helper: 'עדכון התאריך ישפיע גם על חישוב הגיל והמסלול.',
      };
    case 'personalBudgetNumber':
      return {
        youthId: youthItem.id,
        field,
        label: 'מספר תקציב',
        type: 'text',
        value: youthItem.personalBudgetNumber,
        helper: 'מספר התקציב האישי של הנער.',
      };
    case 'mandatoryHours':
      return {
        youthId: youthItem.id,
        field,
        label: 'שעות חובה',
        type: 'number',
        value: hoursDraft.mandatoryHours,
        helper: 'הערך הזה מתעדכן דרך חלונית אחת, ובאישור הוא נשמר אוטומטית.',
        baseHours: hoursDraft,
      };
    case 'payableHours':
      return {
        youthId: youthItem.id,
        field,
        label: 'שעות לתשלום',
        type: 'number',
        value: hoursDraft.payableHours,
        helper: 'הערך הזה מתעדכן דרך חלונית אחת, ובאישור הוא נשמר אוטומטית.',
        baseHours: hoursDraft,
      };
    default:
      return {
        youthId: youthItem.id,
        field: 'name',
        label: 'שם מלא',
        type: 'text',
        value: youthItem.name,
        helper: 'השם שיופיע בכרטיס הנוער וברשימות.',
      };
  }
};

const ManageYouth = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const [currentUser] = useState<CurrentUser | null>(() => getCurrentUser() as CurrentUser | null);
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  // Load youth, reports, and rates for the guide management screen.
  const fetchYouthData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

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
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!guideUser) {
      navigate('/');
      return;
    }

    void fetchYouthData(true);
  }, [fetchYouthData, guideUser, navigate]);

  const summaryById = useMemo(
    () => new Map(youth.map((item) => [item.id, buildYouthWorkSummary(item, reports, rates)])),
    [reports, rates, youth],
  );

  const selectedYouth = useMemo(
    () => youth.find((item) => item.id === selectedYouthId) ?? null,
    [selectedYouthId, youth],
  );

  const selectedYouthSummary = useMemo(
    () => (selectedYouth ? summaryById.get(selectedYouth.id) : undefined),
    [selectedYouth, summaryById],
  );

  const selectedYouthReports = useMemo(
    () =>
      selectedYouth
        ? reports
            .filter((report) => report.youthId === selectedYouth.id)
            .slice()
            .sort((left, right) => `${right.date}T${right.startTime}`.localeCompare(`${left.date}T${left.startTime}`))
        : [],
    [reports, selectedYouth],
  );

  const pendingGuideApprovalsByYouthId = useMemo(() => {
    const counts = new Map<string, number>();

    reports.forEach((report) => {
      if (report.status !== 'pending' || report.approvalTarget !== 'guide') {
        return;
      }

      counts.set(report.youthId, (counts.get(report.youthId) ?? 0) + 1);
    });

    return counts;
  }, [reports]);

  // Delete a youth and all related reports after confirmation.
  const handleDelete = async (id: string) => {
    if (!window.confirm('למחוק את הנער ואת כל הדיווחים שלו?')) {
      return;
    }

    try {
      await deleteYouth(id);
      setSelectedYouthId(null);
      await fetchYouthData();
    } catch (error) {
      console.error('Error deleting youth:', error);
      alert('מחיקת הנער נכשלה.');
    }
  };

  // Open the field editor for one youth datum.
  const startEdit = (youthItem: Youth, field: EditableYouthField) => {
    setEditModal(getEditModalState(youthItem, field, summaryById.get(youthItem.id)));
  };

  const closeDetailModal = () => {
    setSelectedYouthId(null);
  };

  const closeEditModal = () => {
    setEditModal(null);
  };

  // Save one datum from the popup editor.
  const handleSaveEdit = async () => {
    if (!editModal) {
      return;
    }

    const youthItem = youth.find((item) => item.id === editModal.youthId);
    if (!youthItem) {
      return;
    }

    setSavingField(true);
    try {
      if (editModal.field === 'name' || editModal.field === 'birthDate' || editModal.field === 'personalBudgetNumber') {
        const updates: Partial<Youth> = {};

        if (editModal.field === 'name') {
          updates.name = String(editModal.value ?? '').trim();
        }

        if (editModal.field === 'birthDate') {
          updates.birthDate = editModal.value;
        }

        if (editModal.field === 'personalBudgetNumber') {
          updates.personalBudgetNumber = String(editModal.value ?? '').trim();
        }

        await updateYouth(editModal.youthId, updates);
      } else {
        const baseHours = editModal.baseHours ?? createHoursDraft(summaryById.get(editModal.youthId));
        const nextMandatoryHours =
          editModal.field === 'mandatoryHours' ? parseHourInput(editModal.value) : parseHourInput(baseHours.mandatoryHours);
        const nextPayableHours =
          editModal.field === 'payableHours' ? parseHourInput(editModal.value) : parseHourInput(baseHours.payableHours);
        const hoursUpdate = buildYouthHoursUpdate(youthItem, reports, nextMandatoryHours, nextPayableHours);

        await updateYouth(editModal.youthId, {
          manualHoursAdjustment: hoursUpdate.manualHoursAdjustment,
        });
      }

      await fetchYouthData();
      setEditModal(null);
    } catch (error) {
      console.error('Error updating youth:', error);
      alert('עדכון הנער נכשל.');
    } finally {
      setSavingField(false);
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
        <section className="plain-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">ניהול נוער</div>
              <h1 className="page-title mb-0">נוער</h1>
            </div>
            <div className="toolbar">
              {isRefreshing ? <div className="chip chip-info">מרענן...</div> : null}
              <button type="button" onClick={() => navigate('/guide')} className="btn-sky">
                <FiArrowRight size={18} />
                חזור לסיכום
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {youth.map((youthItem) => {
              const summary = summaryById.get(youthItem.id);
              const pendingApprovalsCount = pendingGuideApprovalsByYouthId.get(youthItem.id) ?? 0;

              return (
                <button
                  key={youthItem.id}
                  type="button"
                  onClick={() => setSelectedYouthId(youthItem.id)}
                  className="plain-card plain-card-olive w-full p-5 text-right transition duration-200 hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="chip mb-2">
                        <FiUser size={12} />
                        פרופיל נוער
                      </div>
                      <h3 className="inline-flex items-center gap-2 text-xl font-semibold">
                        <span>{youthItem.name}</span>
                        {pendingApprovalsCount > 0 ? (
                          <span
                            className="status-dot"
                            title={`יש ${pendingApprovalsCount} דיווחים שממתינים לאישור`}
                            aria-label={`יש ${pendingApprovalsCount} דיווחים שממתינים לאישור`}
                          />
                        ) : null}
                      </h3>
                      <p className="page-subtitle">גיל {calculateAge(youthItem.birthDate)} | תקציב {youthItem.personalBudgetNumber}</p>
                    </div>
                    <div className="chip chip-warm">
                      <FiClock size={12} />
                      {summary?.payablePendingHours.toFixed(1) ?? '0.0'} שעות לתשלום
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="chip chip-info">
                      <FiEdit3 size={12} />
                      לחיצה תפתח פרטים ועריכה
                    </div>
                    {pendingApprovalsCount > 0 ? <div className="chip chip-danger">{pendingApprovalsCount} לאישור</div> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {selectedYouth ? (
        <div className="modal-backdrop" dir="rtl" onClick={closeDetailModal}>
          <div className="modal-panel max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="chip mb-3">
                  <FiUser size={12} />
                  פרטי נוער
                </div>
                <h2 className="section-title">{selectedYouth.name}</h2>
                <p className="page-subtitle">
                  גיל {calculateAge(selectedYouth.birthDate)} | תקציב {selectedYouth.personalBudgetNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void handleDelete(selectedYouth.id)} className="btn-danger px-3 py-2">
                  <FiTrash2 size={16} />
                  מחיקה
                </button>
                <button type="button" onClick={closeDetailModal} className="btn-sand px-3 py-2">
                  סגור
                </button>
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="plain-card plain-card-sky p-4">
                <div className="page-subtitle text-sm">דיווחים שממתינים</div>
                <div className="mt-2 text-2xl font-semibold">
                  {pendingGuideApprovalsByYouthId.get(selectedYouth.id) ?? 0}
                </div>
              </div>
              <div className="plain-card plain-card-sand p-4">
                <div className="page-subtitle text-sm">שעות לתשלום</div>
                <div className="mt-2 text-2xl font-semibold">{selectedYouthSummary?.payablePendingHours.toFixed(1) ?? '0.0'}</div>
              </div>
              <div className="plain-card plain-card-olive p-4">
                <div className="page-subtitle text-sm">שעות החודש</div>
                <div className="mt-2 text-2xl font-semibold">{selectedYouthSummary?.currentMonthHours.toFixed(1) ?? '0.0'}</div>
              </div>
              <div className="plain-card plain-card-rose p-4">
                <div className="page-subtitle text-sm">שעות התנדבות</div>
                <div className="mt-2 text-2xl font-semibold">
                  {selectedYouthSummary?.volunteerCompletedHours.toFixed(1) ?? '0.0'}
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">נתונים לעריכה</h3>
                <p className="page-subtitle">לחיצה על כל נתון פותחת חלונית עריכה עם אישור או ביטול.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'name')}
                className="plain-card plain-card-olive p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="field-label">שם מלא</div>
                <div className="text-lg font-semibold">{selectedYouth.name}</div>
                <div className="page-subtitle mt-1 text-sm">לחיצה לעריכה</div>
              </button>

              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'birthDate')}
                className="plain-card plain-card-sky p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="field-label">תאריך לידה</div>
                <div className="text-lg font-semibold">{selectedYouth.birthDate}</div>
                <div className="page-subtitle mt-1 text-sm">לחיצה לעריכה</div>
              </button>

              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'personalBudgetNumber')}
                className="plain-card plain-card-sand p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="field-label">מספר תקציב</div>
                <div className="text-lg font-semibold">{selectedYouth.personalBudgetNumber}</div>
                <div className="page-subtitle mt-1 text-sm">לחיצה לעריכה</div>
              </button>

              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'mandatoryHours')}
                className="plain-card p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="field-label">שעות חובה</div>
                <div className="text-lg font-semibold">
                  {createHoursDraft(selectedYouthSummary).mandatoryHours}
                </div>
                <div className="page-subtitle mt-1 text-sm">לחיצה לעריכה</div>
              </button>

              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'payableHours')}
                className="plain-card plain-card-rose p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="field-label">שעות לתשלום</div>
                <div className="text-lg font-semibold">
                  {createHoursDraft(selectedYouthSummary).payableHours}
                </div>
                <div className="page-subtitle mt-1 text-sm">לחיצה לעריכה</div>
              </button>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">דיווחים אחרונים</h3>
              {selectedYouthReports.length === 0 ? (
                <div className="empty-state py-6">
                  <p className="page-subtitle">אין דיווחים לנער הזה.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedYouthReports.slice(0, 5).map((report) => (
                    <div key={report.id ?? `${report.date}-${report.startTime}-${report.branch}`} className="plain-card p-4">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold">{report.branch}</div>
                          <div className="page-subtitle text-sm">
                            {report.date} | {report.startTime}-{report.endTime}
                          </div>
                        </div>
                        <div className="chip">{reportStatusLabel[report.status]}</div>
                      </div>
                      <div className="text-sm text-slate-600">{report.totalHours.toFixed(1)} שעות</div>
                      {report.details ? <div className="mt-2 rounded-3xl bg-slate-50/90 p-3 text-sm">{report.details}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editModal ? (
        <div className="modal-backdrop z-[60]" dir="rtl" onClick={closeEditModal}>
          <div className="modal-panel max-w-md" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <div className="chip chip-info mb-3">עריכת נתון</div>
              <h2 className="section-title">{editModal.label}</h2>
              <p className="page-subtitle mt-1">{editModal.helper}</p>
            </div>

            <input
              value={editModal.value}
              onChange={(event) => setEditModal((current) => (current ? { ...current, value: event.target.value } : current))}
              className="field-input mb-4"
              type={editModal.type}
              step={editModal.type === 'number' ? '0.5' : undefined}
              min={editModal.type === 'number' ? '0' : undefined}
              autoFocus
            />

            <div className="flex gap-2">
              <button type="button" onClick={() => void handleSaveEdit()} className="btn-olive flex-1" disabled={savingField}>
                <FiSave size={16} />
                {savingField ? 'שומר...' : 'אישור'}
              </button>
              <button type="button" onClick={closeEditModal} className="btn-sand flex-1" disabled={savingField}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageYouth;
