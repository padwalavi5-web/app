import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getRates, getReports, getYouth, resetPaidHours, updateReport } from '../data';
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
  const navigate = useNavigate();

  const fetchData = async () => {
    const [youth, allReports, hourlyRates] = await Promise.all([getYouth(), getReports(), getRates()]);
    setYouthList(youth);
    setReports(allReports);
    setRates(hourlyRates);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'guide') {
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate]);

  const handleGuideDecision = async (reportId: string | undefined, status: 'approved' | 'rejected') => {
    if (!reportId) {
      return;
    }

    await updateReport(reportId, { status });
    await fetchData();
  };

  const guideReports = reports.filter(
    (report) => report.status === 'pending' && (report.approvalTarget ?? 'manager') === 'guide',
  );

  const summaryRows = useMemo(
    () =>
      youthList.map((youth) => {
        const summary = buildYouthWorkSummary(youth, reports, rates);
        return {
          youth,
          summary,
        };
      }),
    [youthList, reports, rates],
  );

  const handleExport = async () => {
    const rows = [
      ['שם', 'תקציב אישי', 'שעות עבודה החודש', 'שעות לתשלום', 'סכום לתשלום'],
      ...summaryRows.map(({ youth, summary }) => [
        youth.name,
        youth.personalBudgetNumber,
        summary.currentMonthHours.toFixed(1),
        summary.currentMonthPayableHours.toFixed(1),
        summary.currentMonthPayableAmount.toFixed(2),
      ]),
    ];

    downloadCsv(`work-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows);

    await Promise.all(
      summaryRows.map(({ youth, summary }) => resetPaidHours(youth.id, summary.payableCumulativeHours)),
    );
    await fetchData();
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="page-title mb-2">סיכום מדריך</h1>
              <p className="page-subtitle">
                90 שעות חובה מתאפסות בכל 1 ביולי. שעות לתשלום מתאפסות לאחר ייצוא.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <button onClick={handleExport} className="btn-primary">
                ייצוא לאקסל ואיפוס תשלום
              </button>
              <button onClick={() => navigate('/guide/youth')} className="btn-secondary">
                ניהול נוער
              </button>
              <button onClick={() => navigate('/guide/branches')} className="btn-secondary">
                ניהול ענפים
              </button>
              <button onClick={() => navigate('/guide/rates')} className="btn-secondary">
                תעריפי שכר
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="content-card p-5">
              <div className="page-subtitle mb-2">מחזור שעות חובה נוכחי</div>
              <div className="text-2xl font-semibold">{getWorkCycleStart().toLocaleDateString('he-IL')}</div>
            </div>
            <div className="content-card p-5">
              <div className="page-subtitle mb-2">שעות חובה נדרשות</div>
              <div className="text-2xl font-semibold">{MANDATORY_HOURS_LIMIT}</div>
            </div>
            <div className="content-card p-5">
              <div className="page-subtitle mb-2">החודש הנוכחי</div>
              <div className="text-2xl font-semibold">{monthFormatter.format(new Date())}</div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right">
              <thead>
                <tr className="border-b border-[rgba(122,161,169,0.2)] text-sm">
                  <th className="px-3 py-3">שם</th>
                  <th className="px-3 py-3">תקציב אישי</th>
                  <th className="px-3 py-3">שעות עבודה החודש</th>
                  <th className="px-3 py-3">שעות לתשלום</th>
                  <th className="px-3 py-3">סכום לתשלום</th>
                  <th className="px-3 py-3">התקדמות ב-90 שעות</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(({ youth, summary }) => (
                  <tr key={youth.id} className="border-b border-[rgba(122,161,169,0.12)]">
                    <td className="px-3 py-4 font-semibold">{youth.name}</td>
                    <td className="px-3 py-4">{youth.personalBudgetNumber}</td>
                    <td className="px-3 py-4">{summary.currentMonthHours.toFixed(1)}</td>
                    <td className="px-3 py-4">{summary.currentMonthPayableHours.toFixed(1)}</td>
                    <td className="px-3 py-4">₪{summary.currentMonthPayableAmount.toFixed(2)}</td>
                    <td className="px-3 py-4">
                      {Math.min(summary.mandatoryCompletedHours, MANDATORY_HOURS_LIMIT).toFixed(1)} / {MANDATORY_HOURS_LIMIT}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4">דיווחי "אחר" שמחכים למדריך</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            {guideReports.length === 0 ? (
              <div className="content-card p-6">
                <p className="page-subtitle">אין כרגע דיווחים ממתינים בענף אחר.</p>
              </div>
            ) : (
              guideReports.map((report) => (
                <div key={report.id} className="content-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{report.youthName}</div>
                      <div className="page-subtitle">
                        {report.date} | {report.startTime}-{report.endTime}
                      </div>
                    </div>
                    <div className="chip">{report.totalHours.toFixed(1)} שעות</div>
                  </div>

                  <div className="mb-4 rounded-2xl bg-[rgba(237,244,247,0.85)] p-4 whitespace-pre-wrap">
                    {report.details || 'לא הוזן פירוט עבודה'}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleGuideDecision(report.id, 'approved')} className="btn-primary flex-1">
                      אישור
                    </button>
                    <button onClick={() => handleGuideDecision(report.id, 'rejected')} className="btn-danger flex-1">
                      דחייה
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GuideSummary;
