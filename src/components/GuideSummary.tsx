import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // הוספנו חזרה
import { 
  getRates, 
  getReports, 
  getYouth, 
  resetPaidHours 
} from '../data';
import type { HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary } from '../workSummary';

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // הוספנו חזרה

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
    link.download = 'summary.csv';
    link.click();
  };

  const handleReset = async () => {
    if (!window.confirm('לאפס שעות?')) return;
    setIsLoading(true);
    try {
      await Promise.all(summaryRows.map(r => resetPaidHours(r.youth.id, r.summary.payableCumulativeHours)));
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center" dir="rtl">טוען...</div>;

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="page-title text-xl sm:text-2xl">סיכום מדריך</h1>
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn-secondary text-sm">📊 אקסל</button>
              <button onClick={handleReset} className="btn-primary bg-red-600 text-sm">🔄 איפוס</button>
            </div>
          </div>
          
          {/* כפתורי הניהול שחזרו - מותאמים לטלפון */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/guide/youth')} className="btn-secondary flex-1 text-sm py-2">👥 ניהול נוער</button>
            <button onClick={() => navigate('/guide/branches')} className="btn-secondary flex-1 text-sm py-2">🏢 ענפים</button>
            <button onClick={() => navigate('/guide/rates')} className="btn-secondary flex-1 text-sm py-2">💰 תעריפים</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right content-card">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-3 text-sm">שם</th>
                <th className="p-3 text-center text-sm">שעות</th>
                <th className="p-3 text-center text-sm">סכום</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map(r => (
                <tr key={r.youth.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium">{r.youth.name}</td>
                  <td className="p-3 text-center font-bold text-blue-600 text-sm">{r.summary.payablePendingHours.toFixed(1)}</td>
                  <td className="p-3 text-center font-bold text-emerald-600 text-sm">₪{r.summary.payablePendingAmount.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuideSummary;