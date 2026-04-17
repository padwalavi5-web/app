import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';
import { getCurrentUser, getReports, updateReport } from '../data';
import type { CurrentUser, Report } from '../types';

const ManagerApproval = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const navigate = useNavigate();

  const loadReports = useCallback(async (currentUser: CurrentUser) => {
    const allReports = await getReports();
    if (currentUser.role !== 'manager') {
      return;
    }

    const pendingReports = allReports.filter(
      (report) =>
        report.status === 'pending' &&
        (report.approvalTarget ?? 'manager') === 'manager' &&
        report.branch === currentUser.branch,
    );
    setReports(pendingReports);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'manager') {
      navigate('/');
      return;
    }

    setUser(currentUser);
    void loadReports(currentUser);
  }, [loadReports, navigate]);

  const handleApprove = async (reportId?: string) => {
    if (!reportId) {
      return;
    }

    try {
      await updateReport(reportId, { status: 'approved', reviewNote: '' });
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
      await updateReport(selectedReport.id, { status: 'rejected', reviewNote: rejectNote.trim() });
      setReports((current) => current.filter((report) => report.id !== selectedReport.id));
      setSelectedReport(null);
      setRejectNote('');
    } catch (error) {
      console.error(error);
    }
  };

  if (!user || user.role !== 'manager') {
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
              <p className="page-subtitle">כל הדיווחים שממתינים לאישור מרוכזים כאן עם פעולה מהירה ונוחה.</p>
            </div>
            <div className="content-card px-4 py-3 text-sm">
              <div className="font-semibold">{reports.length} דיווחים ממתינים</div>
              <div className="page-subtitle">המסך מתעדכן מול Firebase</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {reports.length === 0 ? (
              <div className="empty-state">
                <p className="page-subtitle">אין דיווחים ממתינים כרגע.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="content-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{report.youthName}</div>
                      <div className="page-subtitle">{report.date} | {report.startTime}-{report.endTime}</div>
                    </div>
                    <div className="chip chip-warm">
                      <FiClock size={12} />
                      {report.totalHours.toFixed(1)} שעות
                    </div>
                  </div>

                  {report.details && <div className="mb-4 rounded-3xl bg-slate-50/90 p-4 text-sm">{report.details}</div>}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => void handleApprove(report.id)} className="btn-primary flex-1">
                      <FiCheck size={16} />
                      אשר
                    </button>
                    <button type="button" onClick={() => setSelectedReport(report)} className="btn-danger flex-1">
                      <FiX size={16} />
                      דחה
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedReport && (
        <div className="modal-backdrop" dir="rtl">
          <div className="content-card w-full max-w-md p-6">
            <div className="mb-4">
              <div className="chip chip-danger mb-3">דחיית דיווח</div>
              <h2 className="section-title">להוסיף סיבה לדחייה</h2>
            </div>
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              className="field-input mb-4 min-h-28"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleReject} className="btn-danger flex-1">
                שלח דחייה
              </button>
              <button type="button" onClick={() => setSelectedReport(null)} className="btn-secondary flex-1">
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
