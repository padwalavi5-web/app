import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { finalizePaymentCycle, getCurrentUser, getRates, getReports, getYouth, logout } from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary } from '../workSummary';

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState('');
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
        getRates()
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
    () => youthList.map((youth) => ({ 
      youth, 
      summary: buildYouthWorkSummary(youth, reports, rates) 
    })),
    [youthList, reports, rates],
  );

  const totals = useMemo(
    () => summaryRows.reduce(
      (accumulator, row) => {
        accumulator.pendingHours += row.summary.payablePendingHours;
        accumulator.pendingAmount += row.summary.payablePendingAmount;
        accumulator.approvedHours += row.summary.cycleApprovedHours;
        return accumulator;
      },
      { pendingHours: 0, pendingAmount: 0, approvedHours: 0 },
    ),
    [summaryRows],
  );

  const exportCsv = () => {
    const escapeValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csvContent =
      '\uFEFF' +
      [
        ['שם', 'מספר תקציב', 'שעות לתשלום', 'תיקון ידני', 'סכום לתשלום'].map(escapeValue).join(','),
        ...summaryRows.map((row) =>
          [
            row.youth.name,
            row.youth.personalBudgetNumber,
            row.summary.payablePendingHours.toFixed(1),
            row.summary.manualAdjustmentHours.toFixed(1),
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
    // 1. בדיקה: האם יש נתונים
    if (!summaryRows.length) {
      alert('אין נתונים לייצוא.');
      return;
    }

    // 2. סינון והכנת הנתונים (מניעת נתונים ריקים/לא תקינים)
    const youthUpdates = summaryRows
      .filter((row): row is (typeof summaryRows)[number] & { youth: Youth & { id: string } } => Boolean(row.youth.id))
      .map((row) => ({
        youthId: row.youth.id,
        lastResetHours: row.summary.payableCumulativeHours,
      }));

    const paidReportIds = reports
      .filter((r): r is Report & { id: string } => r.status === 'approved' && Boolean(r.id))
      .map((r) => r.id);

    if (youthUpdates.length === 0 || paidReportIds.length === 0) {
      alert('אין נתונים תקינים לעדכון (ייתכן שאין דיווחים מאושרים).');
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
      console.error("Firebase Error:", error);
      alert('הפעולה נכשלה. ייתכן שאין הרשאות או שהפרויקט לא מוגדר נכון.');
    } finally {
      setIsExporting(false);
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
              onClick={() => { logout(); navigate('/'); }} 
              className="btn-secondary"
              aria-label="התנתקות"
            >
              <FiLogOut size={18} />
            </button>
          </div>

          {loadError ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => void fetchData()} className="btn-secondary px-3 py-2">
                נסה שוב
              </button>
            </div>
          ) : null}

          <div className="metric-grid compact-grid">
            <div className="stat-card compact-card">
              <div className="flex items-center justify-between"><span className="page-subtitle">נערים</span><span className="icon-badge"><FiUsers size={18} /></span></div>
              <div className="stat-value">{summaryRows.length}</div>
            </div>
            <div className="stat-card compact-card">
              <div className="flex items-center justify-between"><span className="page-subtitle">לתשלום</span><span className="icon-badge"><FiTrendingUp size={18} /></span></div>
              <div className="stat-value">{totals.pendingHours.toFixed(1)}</div>
            </div>
            <div className="stat-card compact-card">
              <div className="flex items-center justify-between"><span className="page-subtitle">סכום</span><span className="icon-badge">₪</span></div>
              <div className="stat-value">₪{totals.pendingAmount.toFixed(0)}</div>
            </div>
            <div className="stat-card compact-card">
              <div className="flex items-center justify-between"><span className="page-subtitle">מחזור</span><span className="icon-badge"><FiRefreshCw size={18} /></span></div>
              <div className="stat-value">{totals.approvedHours.toFixed(1)}</div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button type="button" onClick={() => navigate('/guide/youth')} className="btn-secondary">נוער</button>
            <button type="button" onClick={() => navigate('/guide/branches')} className="btn-secondary">ענפים</button>
            <button type="button" onClick={() => navigate('/guide/rates')} className="btn-secondary">תעריפים</button>
            <button type="button" onClick={handleExportAndReset} className="btn-primary" disabled={isExporting}>
              {isExporting ? 'מייצא...' : 'ייצוא + איפוס'}
            </button>
          </div>

          {summaryRows.length === 0 ? (
            <div className="empty-state py-6"><p className="page-subtitle">אין נתונים</p></div>
          ) : (
            <div className="table-shell">
              <table>
                <thead><tr><th>שם</th><th>תקציב</th><th>שעות</th><th>ידני</th><th>סכום</th></tr></thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.youth.id}>
                      <td className="font-semibold">{row.youth.name}</td>
                      <td>{row.youth.personalBudgetNumber}</td>
                      <td>{row.summary.payablePendingHours.toFixed(1)}</td>
                      <td>{row.summary.manualAdjustmentHours.toFixed(1)}</td>
                      <td className="font-semibold text-emerald-700">₪{row.summary.payablePendingAmount.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GuideSummary;
