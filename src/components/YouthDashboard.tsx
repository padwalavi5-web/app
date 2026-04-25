import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiLogOut, FiSend, FiTrendingUp } from 'react-icons/fi';
import { addReport, getBranches, getCurrentUser, getRates, getReports, getYouth, logout } from '../data';
import type { Branch, CurrentUser, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary, MANDATORY_HOURS_LIMIT } from '../workSummary';

const OTHER_BRANCH_NAME = 'אחר';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const statusLabels: Record<Report['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
  paid: 'שולם',
};

const statusClasses: Record<Report['status'], string> = {
  pending: 'chip',
  approved: 'chip bg-[rgba(21,128,61,0.12)] text-[var(--success)] border-[rgba(21,128,61,0.12)]',
  rejected: 'chip chip-danger',
  paid: 'chip bg-[rgba(14,116,144,0.12)] text-cyan-700 border-[rgba(14,116,144,0.12)]',
};

const YouthDashboard = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [youth, setYouth] = useState<Youth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [report, setReport] = useState({
    branch: '',
    date: getTodayDate(),
    startTime: '',
    endTime: '',
    details: '',
  });
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  const [currentUser] = useState<CurrentUser | null>(() => getCurrentUser() as CurrentUser | null);
  const youthUser = currentUser?.role === 'youth' ? currentUser : null;

  const loadData = useCallback(async () => {
    if (!youthUser) {
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      const [branchList, rateList, reportList, youthList] = await Promise.all([
        getBranches(),
        getRates(),
        getReports(),
        getYouth(),
      ]);

      const youthRecord = youthList.find((item) => item.id === youthUser.id) ?? null;
      if (!youthRecord) {
        logout();
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          navigate('/');
        }
        return;
      }

      setBranches(branchList);
      setRates(rateList);
      setReports(reportList);
      setYouth(youthRecord);
    } catch (error) {
      console.error(error);
      setLoadError('טעינת הנתונים נכשלה');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, youthUser]);

  useEffect(() => {
    if (!youthUser) {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        navigate('/');
      }
      return;
    }

    void loadData();
  }, [loadData, navigate, youthUser]);

  const branchOptions = useMemo(() => {
    const existingNames = new Set(branches.map((branch) => branch.name));
    return existingNames.has(OTHER_BRANCH_NAME) ? branches : [...branches, { name: OTHER_BRANCH_NAME, password: '' }];
  }, [branches]);

  const userReports = useMemo(
    () =>
      reports
        .filter((item) => item.youthId === (youthUser?.id ?? ''))
        .slice()
        .sort((left, right) => `${right.date}T${right.startTime}`.localeCompare(`${left.date}T${left.startTime}`)),
    [reports, youthUser?.id],
  );

  const summary = useMemo(() => (youth ? buildYouthWorkSummary(youth, reports, rates) : null), [youth, reports, rates]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!youthUser) {
      return;
    }

    if (!report.branch || !report.date || !report.startTime || !report.endTime) {
      alert('נא למלא את כל השדות.');
      return;
    }

    const isOtherBranch = report.branch === OTHER_BRANCH_NAME;
    if (isOtherBranch && !report.details.trim()) {
      alert('צריך להוסיף פירוט עבודה.');
      return;
    }

    const start = new Date(`2000-01-01T${report.startTime}`);
    const end = new Date(`2000-01-01T${report.endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (Number.isNaN(totalHours) || totalHours <= 0) {
      alert('שעת הסיום חייבת להיות אחרי שעת ההתחלה.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addReport({
        youthId: youthUser.id,
        youthName: youthUser.name,
        branch: report.branch,
        details: isOtherBranch ? report.details.trim() : '',
        date: report.date,
        startTime: report.startTime,
        endTime: report.endTime,
        totalHours,
        approvalTarget: isOtherBranch ? 'guide' : 'manager',
        status: 'pending',
      });

      setReport({ branch: '', date: getTodayDate(), startTime: '', endTime: '', details: '' });
      setIsReportFormOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert('שמירת הדיווח נכשלה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!youthUser) {
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
              <div className="chip mb-2">{youthUser.name}</div>
              <h1 className="page-title mb-0">דיווחים</h1>
            </div>
            <div className="toolbar">
              <button type="button" onClick={() => setIsReportFormOpen(true)} className="btn-primary">
                דיווח
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-secondary"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>

          {loadError ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => void loadData()} className="btn-secondary px-3 py-2">
                נסה שוב
              </button>
            </div>
          ) : null}

          {summary && (
            <div className="metric-grid compact-grid">
              <div className="stat-card stat-card-olive compact-card">
                <div className="flex items-center justify-between">
                  <span className="page-subtitle">מחזור</span>
                  <span className="icon-badge"><FiTrendingUp size={18} /></span>
                </div>
                <div className="stat-value">{summary.cycleApprovedHours.toFixed(1)}</div>
              </div>
              <div className="stat-card stat-card-sky compact-card">
                <div className="flex items-center justify-between">
                  <span className="page-subtitle">לתשלום</span>
                  <span className="icon-badge"><FiClock size={18} /></span>
                </div>
                <div className="stat-value">{summary.payablePendingHours.toFixed(1)}</div>
              </div>
              <div className="stat-card stat-card-sand compact-card">
                <div className="flex items-center justify-between">
                  <span className="page-subtitle">סכום</span>
                  <span className="icon-badge">₪</span>
                </div>
                <div className="stat-value">₪{summary.payablePendingAmount.toFixed(0)}</div>
              </div>
              <div className="stat-card stat-card-rose compact-card">
                <div className="flex items-center justify-between">
                  <span className="page-subtitle">חובה</span>
                  <span className="icon-badge"><FiCalendar size={18} /></span>
                </div>
                <div className="stat-value">
                  {Math.min(summary.mandatoryCompletedHours, MANDATORY_HOURS_LIMIT).toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">דיווחים</h2>
            <div className="chip">{userReports.length}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {userReports.length === 0 ? (
              <div className="empty-state py-6">
                <p className="page-subtitle">אין דיווחים</p>
              </div>
            ) : (
              userReports.map((item) => (
                <div key={item.id} className="content-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">{item.branch}</div>
                      <div className="page-subtitle text-sm">{item.date} | {item.startTime}-{item.endTime}</div>
                    </div>
                    <div className={statusClasses[item.status]}>{statusLabels[item.status]}</div>
                  </div>
                  <div className="mb-3 text-sm text-slate-600">סה"כ {item.totalHours.toFixed(1)} שעות</div>
                  {item.reviewNote && <div className="mb-3 rounded-3xl bg-rose-50/90 p-3 text-sm text-rose-700">{item.reviewNote}</div>}
                  {item.details && <div className="rounded-3xl bg-slate-50/90 p-3 text-sm">{item.details}</div>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {isReportFormOpen && (
        <div className="modal-backdrop" dir="rtl">
          <div className="modal-panel max-w-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="section-title">דיווח שעות</h2>
              <button type="button" onClick={() => setIsReportFormOpen(false)} className="btn-secondary px-3 py-2">
                סגור
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="branch" className="field-label">ענף</label>
                <select
                  id="branch"
                  required
                  className="field-input"
                  value={report.branch}
                  onChange={(event) =>
                    setReport((current) => ({
                      ...current,
                      branch: event.target.value,
                      details: event.target.value === OTHER_BRANCH_NAME ? current.details : '',
                    }))
                  }
                >
                  <option value="">בחר ענף</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.name} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="field-label">תאריך</label>
                <input
                  id="date"
                  type="date"
                  required
                  className="field-input"
                  value={report.date}
                  onChange={(event) => setReport({ ...report, date: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start" className="field-label">התחלה</label>
                  <input
                    id="start"
                    type="time"
                    required
                    className="field-input"
                    value={report.startTime}
                    onChange={(event) => setReport({ ...report, startTime: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="end" className="field-label">סיום</label>
                  <input
                    id="end"
                    type="time"
                    required
                    className="field-input"
                    value={report.endTime}
                    onChange={(event) => setReport({ ...report, endTime: event.target.value })}
                  />
                </div>
              </div>

              {report.branch === OTHER_BRANCH_NAME && (
                <div>
                  <label htmlFor="details" className="field-label">פירוט</label>
                  <textarea
                    id="details"
                    required
                    className="field-input min-h-28"
                    value={report.details}
                    onChange={(event) => setReport({ ...report, details: event.target.value })}
                    placeholder="מה נעשה?"
                  />
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                <FiSend size={18} />
                {isSubmitting ? 'שולח...' : 'שלח'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouthDashboard;
