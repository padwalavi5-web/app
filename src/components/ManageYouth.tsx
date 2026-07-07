import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiSave, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import {
  calculateAge,
  deleteYouth,
  getCurrentUser,
  getRates,
  getReports,
  getYouth,
  updateReport,
  updateYouth,
} from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthHoursUpdate, buildYouthWorkSummary, getCycleVolunteerHours } from '../workSummary';

interface HoursDraft {
  mandatoryHours: string;
  payableHours: string;
  volunteerHours: string;
}

type EditableYouthField = 'mandatoryHours' | 'payableHours' | 'volunteerHours';

type YouthCardPanel = 'age' | 'pendingReports' | 'hours';

interface EditModalState {
  youthId: string;
  field: EditableYouthField;
  label: string;
  value: string;
}

const reportStatusLabel: Record<Report['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
  paid: 'שולם',
};

const GUIDE_REVIEW_NOTE = 'אושר על ידי המדריך';

// Build the editable hour values from the current summary.
const createHoursDraft = (summary?: ReturnType<typeof buildYouthWorkSummary>): HoursDraft => ({
  mandatoryHours: summary?.mandatoryCompletedHours.toFixed(1) ?? '0.0',
  payableHours: summary?.payablePendingHours.toFixed(1) ?? '0.0',
  volunteerHours: summary?.volunteerCompletedHours.toFixed(1) ?? '0.0',
});

// Parse a numeric input while treating empty or invalid values as zero.
const parseHourInput = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getAgeRate = (youthItem: Youth, rates: HourlyRate[]) => {
  const age = calculateAge(youthItem.birthDate);
  return rates.find((rate) => rate.age === age)?.rate ?? 0;
};

const ManageYouth = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<YouthCardPanel | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [rejectModalReport, setRejectModalReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
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

  const selectedYouthPendingReports = useMemo(
    () =>
      selectedYouth
        ? reports
            .filter(
              (report) =>
                report.youthId === selectedYouth.id &&
                report.status === 'pending' &&
                (report.approvalTarget ?? 'manager') === 'manager',
            )
            .slice()
            .sort((left, right) => `${right.date}T${right.startTime}`.localeCompare(`${left.date}T${left.startTime}`))
        : [],
    [reports, selectedYouth],
  );

  const pendingGuideApprovalsByYouthId = useMemo(() => {
    const counts = new Map<string, number>();

    reports.forEach((report) => {
      if (report.status !== 'pending' || (report.approvalTarget ?? 'manager') !== 'manager') {
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
      setActivePanel(null);
      await fetchYouthData();
    } catch (error) {
      console.error('Error deleting youth:', error);
      alert('מחיקת הנער נכשלה.');
    }
  };

  const closeDetailModal = () => {
    setSelectedYouthId(null);
    setActivePanel(null);
    setEditModal(null);
  };

  const closeEditModal = () => {
    setEditModal(null);
  };

  const closePendingModal = () => {
    setActivePanel(null);
    setRejectModalReport(null);
    setRejectNote('');
  };

  // Open one of the compact panels inside the youth detail modal.
  const openPanel = (panel: YouthCardPanel) => {
    setActivePanel(panel);
  };

  // Open the field editor for one editable hour value.
  const startEdit = (youthItem: Youth, field: EditableYouthField) => {
    const hoursDraft = createHoursDraft(summaryById.get(youthItem.id));

    setEditModal({
      youthId: youthItem.id,
      field,
      label:
        field === 'mandatoryHours'
          ? 'שעות חובה'
          : field === 'payableHours'
            ? 'שעות לתשלום'
            : 'שעות התנדבות',
      value: hoursDraft[field],
    });
  };

  const selectedYouthAge = selectedYouth ? calculateAge(selectedYouth.birthDate) : 0;
  const selectedYouthRate = selectedYouth ? getAgeRate(selectedYouth, rates) : 0;

  // Save one hour value from the popup editor.
  const handleSaveEdit = async () => {
    if (!editModal || !selectedYouth) {
      return;
    }

    const summary = summaryById.get(editModal.youthId);
    if (!summary) {
      return;
    }

    setSavingField(true);
    try {
      if (editModal.field === 'mandatoryHours' || editModal.field === 'payableHours') {
        const nextMandatoryHours =
          editModal.field === 'mandatoryHours' ? parseHourInput(editModal.value) : summary.mandatoryCompletedHours;
        const nextPayableHours =
          editModal.field === 'payableHours' ? parseHourInput(editModal.value) : summary.payablePendingHours;
        const hoursUpdate = buildYouthHoursUpdate(selectedYouth, reports, nextMandatoryHours, nextPayableHours);

        await updateYouth(editModal.youthId, {
          manualHoursAdjustment: hoursUpdate.manualHoursAdjustment,
        });
      } else {
        const rawVolunteerHours = getCycleVolunteerHours(editModal.youthId, reports);
        const desiredVolunteerHours = parseHourInput(editModal.value);

        await updateYouth(editModal.youthId, {
          manualVolunteerAdjustment: desiredVolunteerHours - rawVolunteerHours,
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

  const handleGuideApprove = async (reportId?: string) => {
    if (!reportId) {
      return;
    }

    try {
      await updateReport(reportId, { reviewNote: GUIDE_REVIEW_NOTE });
      await fetchYouthData();
    } catch (error) {
      console.error('Error approving report:', error);
      alert('אישור הדיווח נכשל.');
    }
  };

  const handleGuideReject = async () => {
    if (!rejectModalReport?.id || !rejectNote.trim()) {
      return;
    }

    try {
      await updateReport(rejectModalReport.id, {
        status: 'rejected',
        reviewNote: rejectNote.trim(),
      });
      await fetchYouthData();
      closePendingModal();
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('דחיית הדיווח נכשלה.');
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
            {youth.map((youthItem) => (
              <button
                key={youthItem.id}
                type="button"
                onClick={() => setSelectedYouthId(youthItem.id)}
                className="plain-card plain-card-olive w-full p-5 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-badge shrink-0">
                    <FiUser size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xl font-semibold">{youthItem.name}</div>
                    <div className="page-subtitle">תקציב {youthItem.personalBudgetNumber}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selectedYouth ? (
        <div className="modal-backdrop items-start sm:items-center" dir="rtl" onClick={closeDetailModal}>
          <div
            className="modal-panel max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto sm:w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="chip mb-3">
                  <FiUser size={12} />
                  פרטי נוער
                </div>
                <h2 className="section-title break-words">{selectedYouth.name}</h2>
                <p className="page-subtitle">תקציב {selectedYouth.personalBudgetNumber}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void handleDelete(selectedYouth.id)} className="btn-danger px-3 py-2">
                  <FiTrash2 size={16} />
                  מחיקה
                </button>
                <button type="button" onClick={closeDetailModal} className="btn-sand px-3 py-2">
                  סגור
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => openPanel('age')}
                className="plain-card plain-card-sky p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="page-subtitle text-sm">גיל</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouthAge}</div>
              </button>
              <button
                type="button"
                onClick={() => openPanel('pendingReports')}
                className="plain-card plain-card-sand p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="page-subtitle text-sm">דיווחים ממתינים</div>
                <div className="mt-2 text-lg font-semibold">{pendingGuideApprovalsByYouthId.get(selectedYouth.id) ?? 0}</div>
              </button>
              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'mandatoryHours')}
                className="plain-card plain-card-olive p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="page-subtitle text-sm">שעות חובה</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouthSummary?.mandatoryCompletedHours.toFixed(1) ?? '0.0'}</div>
              </button>
              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'payableHours')}
                className="plain-card plain-card-rose p-4 text-right transition duration-200 hover:-translate-y-0.5"
              >
                <div className="page-subtitle text-sm">שעות לתשלום</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouthSummary?.payablePendingHours.toFixed(1) ?? '0.0'}</div>
              </button>
              <button
                type="button"
                onClick={() => startEdit(selectedYouth, 'volunteerHours')}
                className="plain-card p-4 text-right transition duration-200 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-4"
              >
                <div className="page-subtitle text-sm">שעות התנדבות</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouthSummary?.volunteerCompletedHours.toFixed(1) ?? '0.0'}</div>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activePanel === 'age' && selectedYouth ? (
        <div className="modal-backdrop z-[60] items-end sm:items-center" dir="rtl" onClick={() => setActivePanel(null)}>
          <div
            className="modal-panel max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-md overflow-y-auto sm:w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="section-title">גיל ותעריף</h2>
            </div>
            <div className="space-y-3">
              <div className="plain-card p-4">
                <div className="page-subtitle text-sm">תאריך לידה</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouth.birthDate || '-'}</div>
              </div>
              <div className="plain-card p-4">
                <div className="page-subtitle text-sm">גיל</div>
                <div className="mt-2 text-lg font-semibold">{selectedYouthAge}</div>
              </div>
              <div className="plain-card p-4">
                <div className="page-subtitle text-sm">תעריף לגיל הזה</div>
                <div className="mt-2 text-lg font-semibold">₪{selectedYouthRate.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-4 flex">
              <button type="button" onClick={() => setActivePanel(null)} className="btn-sand w-full">
                סגור
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activePanel === 'pendingReports' && selectedYouth ? (
        <div className="modal-backdrop z-[60] items-end sm:items-center" dir="rtl" onClick={closePendingModal}>
          <div
            className="modal-panel max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto sm:w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">דיווחים ממתינים</h2>
                <p className="page-subtitle">רק דיווחים שמיועדים למנהל וטרם טופלו.</p>
              </div>
              <button type="button" onClick={closePendingModal} className="btn-sand px-3 py-2">
                סגור
              </button>
            </div>

            {selectedYouthPendingReports.length === 0 ? (
              <div className="empty-state py-6">
                <p className="page-subtitle">אין דיווחים ממתינים.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedYouthPendingReports.map((report) => (
                  <div key={report.id ?? `${report.date}-${report.startTime}-${report.branch}`} className="plain-card p-4">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base font-semibold">{report.branch}</div>
                        <div className="page-subtitle text-sm">
                          {report.date} | {report.startTime}-{report.endTime}
                        </div>
                      </div>
                      <div className="chip">{reportStatusLabel[report.status]}</div>
                    </div>
                    <div className="mb-3 text-sm text-slate-600">{report.totalHours.toFixed(1)} שעות</div>
                    {report.details ? <div className="mb-3 rounded-3xl bg-slate-50/90 p-3 text-sm">{report.details}</div> : null}
                    {report.reviewNote ? <div className="mb-3 rounded-3xl bg-amber-50/90 p-3 text-sm text-amber-800">{report.reviewNote}</div> : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleGuideApprove(report.id)}
                        className="btn-olive flex-1"
                      >
                        <FiCheck size={16} />
                        הוסף אישור מדריך
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalReport(report)}
                        className="btn-danger flex-1"
                      >
                        <FiX size={16} />
                        דחה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {editModal ? (
        <div className="modal-backdrop z-[70] items-end sm:items-center" dir="rtl" onClick={closeEditModal}>
          <div
            className="modal-panel max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-md overflow-y-auto sm:w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="section-title">{editModal.label}</h2>
            </div>

            <input
              value={editModal.value}
              onChange={(event) => setEditModal((current) => (current ? { ...current, value: event.target.value } : current))}
              className="field-input mb-4"
              type="number"
              step="0.5"
              min="0"
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

      {rejectModalReport ? (
        <div className="modal-backdrop z-[80]" dir="rtl" onClick={() => setRejectModalReport(null)}>
          <div className="modal-panel max-w-md" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <div className="chip chip-danger mb-3">דחייה</div>
              <h2 className="section-title">סיבה</h2>
            </div>
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              className="field-input mb-4 min-h-28"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => void handleGuideReject()} className="btn-danger flex-1">
                שלח
              </button>
              <button type="button" onClick={() => setRejectModalReport(null)} className="btn-sand flex-1">
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
