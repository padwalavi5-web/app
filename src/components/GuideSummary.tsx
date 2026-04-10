import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getRates, 
  getReports, 
  getYouth, 
  resetPaidHours, 
  updateReport 
} from '../data';
import type { HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary, getWorkCycleStart, MANDATORY_HOURS_LIMIT } from '../workSummary';

const monthFormatter = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' });
const escapeCsvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [youth, allReports, hourlyRates] = await Promise.all([
        getYouth(), 
        getReports(), 
        getRates()
      ]);
      setYouthList(youth);
      setReports(allReports);
      setRates(hourlyRates);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'guide') {
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const summaryRows = useMemo(
    () =>
      youthList.map((youth) => ({
        youth,
        summary: buildYouthWorkSummary(youth, reports, rates),
      })),
    [youthList, reports, rates],
  );

  // כפתור 1: רק ייצוא לאקסל
  const handleExportOnly = () => {
    const rows = [
      ['שם', 'תקציב אישי', 'שעות לתשלום', 'סכום לתשלום (₪)', 'שעות חובה שבוצעו'],
      ...summaryRows.map(({ youth, summary }) => [
        youth.name,
        youth.personalBudgetNumber,
        summary.payablePendingHours.toFixed(1),
        summary.payablePendingAmount.toFixed(2),
        summary.mandatoryCompletedHours.toFixed(1)
      ]),
    ];
    downloadCsv(`summary-${new Date().toLocaleDateString('he-IL')}.csv`, rows);
  };

  // כפתור 2: איפוס שעות (כל מה שמעל 90)
  const handleResetHours = async () => {
    const confirmReset = window.confirm(
      "האם אתה בטוח שברצונך לאפס את השעות לתשלום? \nפעולה זו תעדכן את הטבלה ותחשיב את השעות הנוכחיות ככאלו ששולמו."
    );
    
    if (!confirmReset) return;

    setIsLoading(true);
    try {
      await Promise.all(
        summaryRows.map(({ youth, summary }) => 
          resetPaidHours(youth.id, summary.payableCumulativeHours)
        )
      );
      
      // השהיה קלה לסנכרון מול Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchData(); 
      alert('השעות אופסו בהצלחה.');
    } catch (error) {
      alert('אירעה שגיאה באיפוס.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center" dir="rtl">טוען נתונים...</div>;

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="page-title mb-2">סיכום מדריך</h1>
              <p className="page-subtitle">ניהול תקציבים ואיפוס שעות חודשי.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* כפתורים מפוצלים */}
              <button onClick={handleExportOnly} className="btn-secondary">
                <span className="ml-2">📊</span> ייצוא לאקסל
              </button>
              <button onClick={handleResetHours} className="btn-primary bg-red-600 hover:bg-red-700">
                <span className="ml-2">🔄</span> איפוס שעות לתשלום
              </button>
              <button onClick={() => navigate('/guide/youth')} className="btn-secondary">ניהול נוער</button>
              <button onClick={() => navigate('/guide/branches')} className="btn-secondary">ענפים</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
             <div className="content-card p-4 border-r-4 border-blue-500 text-center">
              <div className="text-xs text-slate-500 mb-1">מחזור החל ב:</div>
              <div className="text-lg font-bold">{getWorkCycleStart().toLocaleDateString('he-IL')}</div>
            </div>
            <div className="content-card p-4 border-r-4 border-amber-500 text-center">
              <div className="text-xs text-slate-500 mb-1">רף שעות חובה</div>
              <div className="text-lg font-bold">{MANDATORY_HOURS_LIMIT} שעות</div>
            </div>
            <div className="content-card p-4 border-r-4 border-emerald-500 text-center">
              <div className="text-xs text-slate-500 mb-1">חודש נוכחי</div>
              <div className="text-lg font-bold">{monthFormatter.format(new Date())}</div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-4 py-3">שם הנער/ה</th>
                  <th className="px-4 py-3 text-center">שעות החודש</th>
                  <th className="px-4 py-3 text-center bg-blue-50/50 font-bold text-blue-800">שעות לתשלום</th>
                  <th className="px-4 py-3 text-center font-bold text-emerald-800">סכום לתשלום</th>
                  <th className="px-4 py-3 text-left">התקדמות ב-90</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryRows.map(({ youth, summary }) => (
                  <tr key={youth.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700">{youth.name}</td>
                    <td className="px-4 py-4 text-center">{summary.currentMonthHours.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center font-bold text-blue-600 bg-blue-50/30">
                      {summary.payablePendingHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-emerald-600">
                      ₪{summary.payablePendingAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500">{summary.mandatoryCompletedHours.toFixed(1)} / {MANDATORY_HOURS_LIMIT}</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-amber-400" 
                            style={{ width: `${Math.min((summary.mandatoryCompletedHours / MANDATORY_HOURS_LIMIT) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GuideSummary;