import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiLogOut, FiX } from 'react-icons/fi';
import { finalizePaymentCycle, getCurrentUser, getRates, getReports, getYouth, logout, updateReport } from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary } from '../workSummary';

const reportStatusLabel: Record<Report['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
  paid: 'שולם',
};

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<Youth | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const navigate = useNavigate();

  const [currentUser] = useState<CurrentUser | null>(() => getCurrentUser() as CurrentUser | null);
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [youthResponse, reportsResponse, ratesResponse] = await Promise.all([
        getYouth(),
        getReports(),
        getRates(),
      ]);
      setYouthList(youthResponse || []);
      setReports(reportsResponse || []);
      setRates(ratesResponse || []);
    } catch (error) {
      console.error(error);
      setLoadError('טעינת הנתונים נכשלה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!guideUser) {
      navigate('/');
      return;
    }
    void fetchData();
  }, [fetchData, guideUser, navigate]);

  const summaryRows = useMemo(
    () =>
      youthList.map((youth) => ({
        youth,
        summary: buildYouthWorkSummary(youth, reports, rates),
      })),
    [youthList, reports, rates],
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

  const exportCsv = () => {
    const escapeValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csvContent =
      '\uFEFF' +
      [
        ['שם', 'מספר תקציב', 'שעות החודש', 'לתשלום', 'סכום לתשלום'].map(escapeValue).join(','),
        ...summaryRows.map((row) =>
          [
            row.youth.name,
            row.youth.personalBudgetNumber,
            row.summary.currentMonthHours.toFixed(1),
            row.summary.payablePendingHours.toFixed(1),
            row.summary.payablePendingAmount.toFixed(2),
          ].map(escapeValue).join(','),
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `guide-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAndReset = async () => {
    if (!summaryRows.length) {
      alert('אין נתונים לייצוא.');
      return;
    }

    const youthUpdates = summaryRows
      .filter((row): row is (typeof summaryRows)[number] & { youth: Youth & { id: string } } => Boolean(row.youth.id))
      .map((row) => ({
        youthId: row.youth.id,
        lastResetHours: row.summary.payableCumulativeHours,
      }));

    const paidReportIds = reports
      .filter((r): r is Report & { id: string } => r.status === 'approved' && Boolean(r.id))
      .map((r) => r.id);

    if (youthUpdates.length === 0) {
      alert('אין נתונים תקינים לעדכון.');
      return;
    }

    if (!window.confirm('לייצא ולאפס את השעות לתשלום?')) {
      return;
    }

    setIsExporting(true);
    try {
      exportCsv();
      await finalizePaymentCycle(youthUpdates, paidReportIds);
      await fetchData();
      alert('הייצוא בוצע והנתונים אופסו בהצלחה.');
    } catch (error) {
      console.error('Firebase Error:', error);
      alert('הפעולה נכשלה. ייתכן שאין הרשאות או שהפרויקט לא מוגדר נכון.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleApprove = async (reportId?: string) => {
    if (!reportId) {
      return;
    }

    try {
      await updateReport(reportId, { status: 'approved', reviewNote: '' });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('אישור הדיווח נכשל.');
    }
  };

  const handleReject = async () => {
    if (!selectedReport?.id || !rejectNote.trim()) {
      return;
    }

    try {
      await updateReport(selectedReport.id, { status: 'rejected', reviewNote: rejectNote.trim() });
      setSelectedReport(null);
      setRejectNote('');
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('דחיית הדיווח נכשלה.');
    }
  };

  if (!guideUser) {
    return null;
  }

  if (isLoading) {
    return <div className="app-shell flex items-center justify-center text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-4">
        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="chip mb-2">מדריך</div>
              <h1 className="page-title">סיכום</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn-rose"
              aria-label="התנתקות"
            >
              <FiLogOut size={18} />
            </button>
          </div>

          {loadError ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => void fetchData()} className="btn-sky px-3 py-2">
                נסה שוב
              </button>
            </div>
          ) : null}

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button type="button" onClick={() => navigate('/guide/youth')} className="btn-olive">נוער</button>
            <button type="button" onClick={() => navigate('/guide/branches')} className="btn-sky">ענפים</button>
            <button type="button" onClick={() => navigate('/guide/rates')} className="btn-sand">תעריפים</button>
            <button type="button" onClick={handleExportAndReset} className="btn-rose" disabled={isExporting}>
              {isExporting ? 'מייצא...' : 'ייצוא + איפוס'}
            </button>
          </div>

          {summaryRows.length === 0 ? (
            <div className="empty-state py-6"><p className="page-subtitle">אין נתונים</p></div>
          ) : (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>תקציב</th>
                    <th>החודש</th>
                    <th>לתשלום</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => {
                    const pendingApprovalsCount = pendingGuideApprovalsByYouthId.get(row.youth.id) ?? 0;

                    return (
                      <tr key={row.youth.id} className="cursor-pointer" onClick={() => setSelectedYouth(row.youth)}>
                        <td className="font-semibold">
                          <span className="inline-flex items-center gap-2">
                            <span>{row.youth.name}</span>
                            {pendingApprovalsCount > 0 ? (
                              <span
                                className="status-dot"
                                title={`יש ${pendingApprovalsCount} דיווחים שממתינים לאישור`}
                                aria-label={`יש ${pendingApprovalsCount} דיווחים שממתינים לאישור`}
                              />
                            ) : null}
                          </span>
                        </td>
                        <td>{row.youth.personalBudgetNumber}</td>
                        <td>{row.summary.currentMonthHours.toFixed(1)}</td>
                        <td>{row.summary.payablePendingHours.toFixed(1)}</td>
                        <td className="font-semibold text-emerald-700">₪{row.summary.payablePendingAmount.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedYouth && (
        <div className="modal-backdrop" dir="rtl">
          <div className="modal-panel max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">{selectedYouth.name}</h2>
                <div className="page-subtitle">היסטוריית עבודות</div>
              </div>
              <button type="button" onClick={() => setSelectedYouth(null)} className="btn-sand px-3 py-2">
                סגור
              </button>
            </div>

            {selectedYouthReports.length === 0 ? (
              <div className="empty-state py-6">
                <p className="page-subtitle">אין דיווחים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedYouthReports.map((report) => (
                  <div key={report.id} className="plain-card p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold">{report.branch}</div>
                        <div className="page-subtitle text-sm">{report.date} | {report.startTime}-{report.endTime}</div>
                      </div>
                      <div className="chip">{reportStatusLabel[report.status]}</div>
                    </div>

                    <div className="mb-3 text-sm text-slate-600">סה"כ {report.totalHours.toFixed(1)} שעות</div>
                    {report.details ? <div className="mb-3 rounded-3xl bg-slate-50/90 p-3 text-sm">{report.details}</div> : null}
                    {report.reviewNote ? <div className="mb-3 rounded-3xl bg-rose-50/90 p-3 text-sm text-rose-700">{report.reviewNote}</div> : null}

                    {report.status === 'pending' && report.approvalTarget === 'guide' ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void handleApprove(report.id)} className="btn-olive flex-1">
                          <FiCheck size={16} />
                          אשר
                        </button>
                        <button type="button" onClick={() => setSelectedReport(report)} className="btn-danger flex-1">
                          <FiX size={16} />
                          דחה
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="modal-backdrop" dir="rtl">
          <div className="modal-panel max-w-md">
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
              <button type="button" onClick={handleReject} className="btn-danger flex-1">
                שלח
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  setRejectNote('');
                }}
                className="btn-sand flex-1"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideSummary;
