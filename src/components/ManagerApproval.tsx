import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getReports, updateReport } from '../data';
import type { Report } from '../types';

const ManagerApproval = () => {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'manager') {
        navigate('/');
        return;
      }

      setUser(currentUser);
      const allReports = await getReports();
      const pendingReports = allReports.filter(
        (report) =>
          report.status === 'pending' &&
          (report.approvalTarget ?? 'manager') === 'manager' &&
          report.branch === currentUser.branch,
      );
      setReports(pendingReports);
    };

    loadData();
  }, [navigate]);

  const handleApprove = async (reportId?: string) => {
    if (!reportId) {
      return;
    }

    try {
      await updateReport(reportId, { status: 'approved' });
      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedReport?.id || !rejectNote.trim()) {
      return;
    }

    try {
      await updateReport(selectedReport.id, { status: 'rejected' });
      setReports((current) => current.filter((report) => report.id !== selectedReport.id));
      setSelectedReport(null);
      setRejectNote('');
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) {
    return <div className="app-shell flex items-center justify-center text-center">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">אישור שעות</div>
              <h1 className="page-title mb-2">ענף {user.branch}</h1>
              <p className="page-subtitle">כאן מופיעים כל הדיווחים הממתינים לאישור מנהל הענף.</p>
            </div>
            <div className="content-card px-4 py-3 text-sm">
              <div className="font-semibold">{reports.length} דיווחים ממתינים</div>
              <div className="page-subtitle">מעודכן לזמן הטעינה האחרון</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {reports.length === 0 ? (
              <div className="content-card p-6">
                <p className="page-subtitle">אין דיווחים ממתינים כרגע.</p>
              </div>
            ) : (
              reports.map((report) => (
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

                  {report.details && (
                    <div className="mb-4 rounded-2xl bg-[rgba(237,244,247,0.85)] p-4 text-sm">{report.details}</div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(report.id)} className="btn-primary flex-1">
                      אישור
                    </button>
                    <button onClick={() => setSelectedReport(report)} className="btn-danger flex-1">
                      דחייה
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/35 p-4" dir="rtl">
          <div className="content-card w-full max-w-md p-6">
            <div className="mb-4">
              <div className="chip mb-3">דחיית דיווח</div>
              <h2 className="text-2xl font-semibold">להוסיף סיבה לדחייה</h2>
            </div>
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              className="field-input mb-4 min-h-28"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button onClick={handleReject} className="btn-danger flex-1">
                שלח דחייה
              </button>
              <button onClick={() => setSelectedReport(null)} className="btn-secondary flex-1">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApproval;
