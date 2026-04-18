import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';
import { getCurrentUser, getReports, updateReport } from '../data';
import type { CurrentUser, Report } from '../types';

const ManagerApproval = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [currentUser] = useState<CurrentUser | null>(() => getCurrentUser() as CurrentUser | null);
  const managerUser = currentUser?.role === 'manager' ? currentUser : null;

  const loadReports = useCallback(async () => {
    if (!managerUser) {
      return;
    }

    setIsLoading(true);
    try {
      const allReports = await getReports();
      const pendingReports = allReports.filter(
        (report) =>
          report.status === 'pending' &&
          (report.approvalTarget ?? 'manager') === 'manager' &&
          report.branch === managerUser.branch,
      );
      setReports(pendingReports);
    } finally {
      setIsLoading(false);
    }
  }, [managerUser]);

  useEffect(() => {
    if (!managerUser) {
      navigate('/');
      return;
    }

    void loadReports();
  }, [loadReports, managerUser, navigate]);

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

  if (!managerUser || isLoading) {
    return <div className="app-shell flex items-center justify-center text-center">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-6xl space-y-5">
        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="chip mb-2">{managerUser.branch}</div>
              <h1 className="page-title">אישורים</h1>
            </div>
            <div className="chip chip-warm">
              <FiClock size={12} />
              {reports.length}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {reports.length === 0 ? (
              <div className="empty-state py-6">
                <p className="page-subtitle">אין דיווחים</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="content-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">{report.youthName}</div>
                      <div className="page-subtitle text-sm">{report.date} | {report.startTime}-{report.endTime}</div>
                    </div>
                    <div className="chip chip-warm">
                      <FiClock size={12} />
                      {report.totalHours.toFixed(1)}
                    </div>
                  </div>

                  {report.details && <div className="mb-4 rounded-3xl bg-slate-50/90 p-3 text-sm">{report.details}</div>}

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
              <div className="chip chip-danger mb-3">דחייה</div>
              <h2 className="section-title">סיבה</h2>
            </div>
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              className="field-input mb-4 min-h-28"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleReject} className="btn-danger flex-1">
                שלח
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
