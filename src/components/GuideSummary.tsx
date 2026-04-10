import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getReports, getYouth, resetPaidHours, updateReport } from '../data';
import type { Report, Youth } from '../types';

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    const youth = await getYouth();
    const allReports = await getReports();
    setYouthList(youth);
    setReports(allReports);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'guide') {
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate]);

  const handleReset = async (youthId: string, currentTotal: number) => {
    if (window.confirm('לאפס שעות ולסמן כשולם?')) {
      await resetPaidHours(youthId, currentTotal);
      await fetchData();
    }
  };

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

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="chip mb-3">אזור מדריך</div>
              <h1 className="page-title mb-2">מרכז בקרה</h1>
              <p className="page-subtitle">תצוגה מרוכזת של שעות לתשלום, ניהול בסיס הנתונים ואישור דיווחים מיוחדים.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button onClick={() => navigate('/guide/youth')} className="btn-primary">
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

          <div className="grid-responsive">
            {youthList.map((youth) => {
              const approvedHours = reports
                .filter((report) => report.youthId === youth.id && report.status === 'approved')
                .reduce((sum, report) => sum + report.totalHours, 0);

              const hoursToPay = approvedHours - youth.lastResetHours;

              return (
                <div key={youth.id} className="stat-card flex items-center justify-between gap-4">
                  <button onClick={() => handleReset(youth.id, approvedHours)} className="btn-primary px-3 py-2 text-sm">
                    סמן כשולם
                  </button>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{youth.name}</div>
                    <div className="page-subtitle">מעקב שעות ותשלום</div>
                    <div className="mt-2 text-xl font-semibold text-[var(--accent-strong)]">
                      {hoursToPay.toFixed(1)} שעות לתשלום
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6">
            <div className="chip mb-3">בדיקות חריגים</div>
            <h2 className="page-title text-[2rem] sm:text-[2.4rem]">דיווחי "אחר" שמחכים למדריך</h2>
          </div>

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
