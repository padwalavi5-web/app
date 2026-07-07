import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiLogOut, FiX } from 'react-icons/fi';
import { getCurrentUser, getReports, getYouth, logout, updateReport } from '../data';
import type { CurrentUser, Report, Youth } from '../types';
import { getReportWorkPreview, type ApprovalCoverage } from '../workSummary';

const approvalCoverageLabel: Record<ApprovalCoverage, string> = {
  mandatory: 'חובה',
  payable: 'בתשלום',
  both: 'חובה + בתשלום',
};

const approvalCoverageActionLabel: Record<ApprovalCoverage, string> = {
  mandatory: 'אשר חובה',
  payable: 'אשר בתשלום',
  both: 'אשר שניהם',
};

const approvalCoverageNote: Record<ApprovalCoverage, string> = {
  mandatory: 'אושר חובה בלבד',
  payable: 'אושר בתשלום בלבד',
  both: '',
};

// Shows the branch manager screen for approving or rejecting pending reports.
const ManagerApproval = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();
  const [currentUser] = useState<CurrentUser | null>(() => getCurrentUser() as CurrentUser | null);
  const managerUser = currentUser?.role === 'manager' ? currentUser : null;

  // Loads pending reports and youth data for the manager's branch.
  const loadReports = useCallback(async () => {
    if (!managerUser) {
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      const [youthData, allReports] = await Promise.all([getYouth(), getReports()]);
      setYouthList(youthData);
      setReports(allReports);
    } catch (error) {
      console.error(error);
      setLoadError('טעינת הדיווחים נכשלה');
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

  const pendingReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.status === 'pending' &&
          (report.approvalTarget ?? 'manager') === 'manager' &&
          report.branch === managerUser?.branch,
      ),
    [managerUser?.branch, reports],
  );

  const youthById = useMemo(() => new Map(youthList.map((item) => [item.id, item])), [youthList]);

  const reportPreviewById = useMemo(
    () =>
      new Map(
        pendingReports.map((report) => {
          const youth = youthById.get(report.youthId);
          const preview = youth ? getReportWorkPreview(youth, reports, report) : { mandatoryHours: 0, payableHours: 0 };
          return [report.id ?? `${report.date}-${report.startTime}-${report.branch}`, preview] as const;
        }),
      ),
    [pendingReports, reports, youthById],
  );

  // Approves a pending report with the selected hour coverage.
  const handleApprove = async (reportId?: string, coverage: ApprovalCoverage = 'both') => {
    if (!reportId) {
      return;
    }

    try {
      await updateReport(reportId, {
        status: 'approved',
        approvalCoverage: coverage,
        reviewNote: approvalCoverageNote[coverage],
      });
      await loadReports();
    } catch (error) {
      console.error(error);
      alert('אישור הדיווח נכשל.');
    }
  };

  // Rejects the selected report and stores the manager's note.
  const handleReject = async () => {
    if (!selectedReport?.id || !rejectNote.trim()) {
      return;
    }

    try {
      await updateReport(selectedReport.id, { status: 'rejected', reviewNote: rejectNote.trim() });
      setSelectedReport(null);
      setRejectNote('');
      await loadReports();
    } catch (error) {
      console.error(error);
      alert('דחיית הדיווח נכשלה.');
    }
  };

  if (!managerUser) {
    return null;
  }

  if (isLoading) {
    return <div className="app-shell flex items-center justify-center text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-4">
        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="chip mb-2">{managerUser.branch}</div>
              <h1 className="page-title">אישורים</h1>
            </div>
            <div className="toolbar">
              <div className="chip chip-warm">{pendingReports.length}</div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-rose"
                aria-label="התנתקות"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>

          {loadError ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => void loadReports()} className="btn-sky px-3 py-2">
                נסה שוב
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {pendingReports.length === 0 ? (
              <div className="empty-state py-6">
                <p className="page-subtitle">אין דיווחים</p>
              </div>
            ) : (
              pendingReports.map((report) => {
                const preview = reportPreviewById.get(report.id ?? '') ?? { mandatoryHours: 0, payableHours: 0 };
                const isBoth = preview.mandatoryHours > 0 && preview.payableHours > 0;
                const isMandatoryOnly = preview.mandatoryHours > 0 && preview.payableHours === 0;
                const coverageLabel: ApprovalCoverage = isBoth
                  ? 'both'
                  : isMandatoryOnly
                    ? 'mandatory'
                    : 'payable';

                return (
                  <div key={report.id} className="content-card p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base font-semibold">{report.youthName}</div>
                        <div className="page-subtitle text-sm">
                          {report.date} | {report.startTime}-{report.endTime}
                        </div>
                      </div>
                      <div className="chip chip-warm">{report.totalHours.toFixed(1)}</div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <div className="chip">{approvalCoverageLabel[coverageLabel]}</div>
                      <div className="chip chip-info">שעות חובה: {preview.mandatoryHours.toFixed(1)}</div>
                      <div className="chip chip-info">שעות בתשלום: {preview.payableHours.toFixed(1)}</div>
                    </div>

                    {report.details ? <div className="mb-4 rounded-3xl bg-slate-50/90 p-3 text-sm">{report.details}</div> : null}
                    {report.reviewNote ? (
                      <div className="mb-4 rounded-3xl bg-amber-50/90 p-3 text-sm text-amber-800">
                        <div>{report.reviewNote}</div>
                      </div>
                    ) : null}

                    {isBoth ? (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <button type="button" onClick={() => void handleApprove(report.id, 'both')} className="btn-primary">
                          <FiCheck size={16} />
                          {approvalCoverageActionLabel.both}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleApprove(report.id, 'mandatory')}
                          className="btn-olive"
                        >
                          <FiCheck size={16} />
                          {approvalCoverageActionLabel.mandatory}
                        </button>
                        <button type="button" onClick={() => setSelectedReport(report)} className="btn-danger">
                          <FiX size={16} />
                          לא לאשר
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => void handleApprove(report.id, coverageLabel)} className="btn-primary">
                          <FiCheck size={16} />
                          {approvalCoverageActionLabel[coverageLabel]}
                        </button>
                        <button type="button" onClick={() => setSelectedReport(report)} className="btn-danger">
                          <FiX size={16} />
                          לא לאשר
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {selectedReport && (
        <div className="modal-backdrop" dir="rtl">
          <div className="modal-panel max-w-md">
            <div className="mb-4">
              <div className="chip chip-danger mb-3">דחייה</div>
              <h2 className="section-title">סיבה</h2>
            </div>
            <label htmlFor="manager-reject-note" className="field-label">
              סיבת הדחייה
            </label>
            <textarea
              id="manager-reject-note"
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              className="field-input mb-4 min-h-28"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleReject} className="btn-danger flex-1">
                שלח
              </button>
              <button type="button" onClick={() => setSelectedReport(null)} className="btn-sand flex-1">
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
