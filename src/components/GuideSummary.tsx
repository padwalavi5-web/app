import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRates, getReports, getYouth, resetPaidHours } from '../data';
import type { HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary, getWorkCycleStart, MANDATORY_HOURS_LIMIT } from '../workSummary';

const monthFormatter = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' });

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [y, rep, rat] = await Promise.all([getYouth(), getReports(), getRates()]);
      setYouthList(y);
      setReports(rep);
      setRates(rat);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summaryRows = useMemo(() =>
    youthList.map((y) => ({ youth: y, summary: buildYouthWorkSummary(y, reports, rates) })),
    [youthList, reports, rates]
  );

  const handleExport = () => {
    const csvContent = "\uFEFF" + [
      ['שם', 'תקציב', 'שעות לתשלום'].join(','),
      ...summaryRows.map(r => [r.youth.name, r.youth.personalBudgetNumber, r.summary.payablePendingHours].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary-${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleReset = async () => {
    if (!window.confirm('האם לאפס שעות לכולם?')) return;
    setIsLoading(true);
    try {
      await Promise.all(summaryRows.map(r => resetPaidHours(r.youth.id, r.summary.payableCumulativeHours)));
      await fetchData();
      alert('השעות אופסו');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center" dir="rtl">טוען נתונים...</div>;

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap space-y-6">
        <section className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="page-title">סיכום מדריך</h1>
              <p className="page-subtitle">{monthFormatter.format(new Date())}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn-secondary">📊 ייצוא</button>
              <button onClick={handleReset} className="btn-primary bg-red-600">🔄 איפוס שעות</button>
              <button onClick={() => navigate('/guide/youth')} className="btn-secondary">נוער</button>
              <button onClick={() => navigate('/guide/branches')} className="btn-secondary">ענפים</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="content-card p-4 text-center">מחזור החל: {getWorkCycleStart().toLocaleDateString()}</div>
            <div className="content-card p-4 text-center">רף חובה: {MANDATORY_HOURS_LIMIT}</div>
            <div className="content-card p-4 text-center">נערים: {youthList.length}</div>
          </div>
        </section>

        <section className="glass-panel p-4 overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b text-slate-500 text-sm">
                <th className="p-3">שם</th>
                <th className="p-3 text-center">שעות חודש</th>
                <th className="p-3 text-center">לתשלום</th>
                <th className="p-3 text-center">סכום</th>
                <th className="p-3 text-left">התקדמות ב-90</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map(({ youth, summary }) => (
                <tr key={youth.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold">{youth.name}</td>
                  <td className="p-3 text-center">{summary.currentMonthHours.toFixed(1)}</td>
                  <td className="p-3 text-center text-blue-600 font-bold">{summary.payablePendingHours.toFixed(1)}</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">₪{summary.payablePendingAmount.toFixed(2)}</td>
                  <td className="p-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400" 
                        style={{ width: `${Math.min((summary.mandatoryCompletedHours / MANDATORY_HOURS_LIMIT) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default GuideSummary;