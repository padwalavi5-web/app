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
    <div className="p-4 text-right max-w-4xl mx-auto" dir="rtl">
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => navigate('/guide/youth')} className="bg-green-600 text-white px-4 py-2 rounded-xl">
          ניהול נוער
        </button>
        <button onClick={() => navigate('/guide/branches')} className="bg-purple-600 text-white px-4 py-2 rounded-xl">
          ניהול ענפים
        </button>
        <button onClick={() => navigate('/guide/rates')} className="bg-orange-500 text-white px-4 py-2 rounded-xl">
          תעריפי שכר
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">סיכום שעות</h1>

      <div className="space-y-4 mb-10">
        {youthList.map((youth) => {
          const approvedHours = reports
            .filter((report) => report.youthId === youth.id && report.status === 'approved')
            .reduce((sum, report) => sum + report.totalHours, 0);

          const hoursToPay = approvedHours - youth.lastResetHours;

          return (
            <div
              key={youth.id}
              className="p-4 border rounded-xl shadow-sm bg-white flex justify-between items-center gap-4"
            >
              <button
                onClick={() => handleReset(youth.id, approvedHours)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
              >
                סמן כשולם
              </button>
              <div>
                <div className="font-bold">{youth.name}</div>
                <div className="text-sm text-blue-600 font-bold">שעות לתשלום: {hoursToPay.toFixed(1)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold mb-4 text-slate-700">דיווחי "אחר" שמחכים למדריך</h2>

      <div className="space-y-4">
        {guideReports.length === 0 ? (
          <p className="text-gray-500">אין כרגע דיווחים ממתינים בענף אחר.</p>
        ) : (
          guideReports.map((report) => (
            <div key={report.id} className="border p-4 rounded-xl shadow-sm bg-white">
              <div className="font-bold text-lg">{report.youthName}</div>
              <div className="text-sm text-gray-600 mb-2">
                {report.date} | {report.startTime}-{report.endTime}
              </div>
              <div className="font-bold text-blue-600 mb-2">{report.totalHours.toFixed(1)} שעות</div>
              <div className="bg-slate-50 p-3 rounded-lg mb-3 whitespace-pre-wrap">
                {report.details || 'לא הוזן פירוט עבודה'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGuideDecision(report.id, 'approved')}
                  className="flex-1 bg-green-600 text-white p-2 rounded-lg font-bold"
                >
                  אישור
                </button>
                <button
                  onClick={() => handleGuideDecision(report.id, 'rejected')}
                  className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg font-bold"
                >
                  דחייה
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GuideSummary;
