import { useEffect, useMemo, useState } from 'react';
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
      <div className="page-wrap p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="page-title">סיכום מדריך</h1>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-secondary">📊 אקסל</button>
            <button onClick={handleReset} className="btn-primary bg-red-600">🔄 איפוס</button>
          </div>
        </div>
        <table className="w-full text-right content-card">
          <thead>
            <tr className="border-b">
              <th className="p-4">שם</th>
              <th className="p-4 text-center">שעות לתשלום</th>
              <th className="p-4 text-center">סכום</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map(r => (
              <tr key={r.youth.id} className="border-b">
                <td className="p-4">{r.youth.name}</td>
                <td className="p-4 text-center font-bold text-blue-600">{r.summary.payablePendingHours.toFixed(1)}</td>
                <td className="p-4 text-center font-bold text-emerald-600">₪{r.summary.payablePendingAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuideSummary;