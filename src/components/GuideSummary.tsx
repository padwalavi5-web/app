import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiLayers, FiLogOut, FiRefreshCw, FiSettings, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { getCurrentUser, getRates, getReports, getYouth, logout, resetPaidHours } from '../data';
import type { CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary } from '../workSummary';
import AppMark from './AppMark';

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser() as CurrentUser | null;
  const guideUser = currentUser?.role === 'guide' ? currentUser : null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [youthResponse, reportsResponse, ratesResponse] = await Promise.all([getYouth(), getReports(), getRates()]);
      setYouthList(youthResponse);
      setReports(reportsResponse);
      setRates(ratesResponse);
    } catch (error) {
      console.error(error);
      alert('טעינת נתוני המדריך נכשלה. נסה שוב.');
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
    () => youthList.map((youth) => ({ youth, summary: buildYouthWorkSummary(youth, reports, rates) })),
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
    if (!summaryRows.length) {
      alert('אין כרגע נתונים לייצוא.');
      return;
    }

    const confirmed = window.confirm('הפעולה תייצא קובץ לאקסל ולאחר מכן תאפס את שעות התשלום. להמשיך?');
    if (!confirmed) {
      return;
    }

    setIsExporting(true);
    try {
      exportCsv();
      await Promise.all(summaryRows.map((row) => resetPaidHours(row.youth.id, row.summary.payableCumulativeHours)));
      await fetchData();
      alert('הקובץ יוצא והאיפוס הושלם בהצלחה.');
    } catch (error) {
      console.error(error);
      alert('הפעולה לא הושלמה. בדוק את החיבור ל-Firebase ונסה שוב.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!guideUser || isLoading) {
    return <div className="app-shell flex items-center justify-center text-center" dir="rtl">טוען נתונים...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap space-y-6">
        <section className="glass-panel p-6 sm:p-8 lg:p-10">
          <div className="hero-grid items-start">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <AppMark compact />
                <div>
                  <div className="chip mb-3">מרכז בקרה למדריך</div>
                  <h1 className="page-title mb-2">סיכום מדריך וניהול תשלומים</h1>
                  <p className="page-subtitle">מבט מרוכז על שעות לתשלום, תיקונים ידניים, ופעולת ייצוא ואיפוס מאוחדת בלחיצה אחת.</p>
                </div>
              </div>

              <div className="metric-grid">
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <span className="page-subtitle">סה"כ נערים</span>
                    <span className="icon-badge"><FiUsers size={18} /></span>
                  </div>
                  <div className="stat-value">{summaryRows.length}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <span className="page-subtitle">שעות לתשלום</span>
                    <span className="icon-badge"><FiTrendingUp size={18} /></span>
                  </div>
                  <div className="stat-value">{totals.pendingHours.toFixed(1)}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <span className="page-subtitle">סכום פתוח</span>
                    <span className="icon-badge"><FiLayers size={18} /></span>
                  </div>
                  <div className="stat-value">₪{totals.pendingAmount.toFixed(0)}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <span className="page-subtitle">שעות במחזור</span>
                    <span className="icon-badge"><FiRefreshCw size={18} /></span>
                  </div>
                  <div className="stat-value">{totals.approvedHours.toFixed(1)}</div>
                </div>
              </div>
            </div>

            <div className="content-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title">פעולות מהירות</h2>
                  <p className="page-subtitle">מעבר ישיר למסכי הניהול הראשיים.</p>
                </div>
                <span className="icon-badge"><FiSettings size={18} /></span>
              </div>
              <div className="space-y-3">
                <button type="button" onClick={() => navigate('/guide/youth')} className="btn-secondary w-full justify-between">
                  ניהול נוער
                  <FiUsers size={18} />
                </button>
                <button type="button" onClick={() => navigate('/guide/branches')} className="btn-secondary w-full justify-between">
                  ניהול ענפים וסיסמת מדריך
                  <FiLayers size={18} />
                </button>
                <button type="button" onClick={() => navigate('/guide/rates')} className="btn-secondary w-full justify-between">
                  ניהול תעריפים
                  <FiTrendingUp size={18} />
                </button>
                <button type="button" onClick={handleExportAndReset} className="btn-primary mt-4 w-full justify-between" disabled={isExporting}>
                  {isExporting ? 'מייצא ומאפס...' : 'ייצוא לאקסל + איפוס'}
                  <FiDownload size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn-secondary w-full justify-between"
                >
                  התנתק
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">פירוט תשלומים לפי נער</h2>
              <p className="page-subtitle">כולל שעות פתוחות לתשלום ותיקונים ידניים.</p>
            </div>
            <div className="chip chip-warm">CSV תואם אקסל</div>
          </div>

          {summaryRows.length === 0 ? (
            <div className="empty-state">
              <p className="page-subtitle">עדיין אין נתונים להצגה.</p>
            </div>
          ) : (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>מספר תקציב</th>
                    <th>שעות לתשלום</th>
                    <th>תיקון ידני</th>
                    <th>סכום</th>
                  </tr>
                </thead>
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
