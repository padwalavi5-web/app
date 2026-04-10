import { useEffect, useMemo, useState } from 'react';
import { addReport, getBranches, getCurrentUser, getRates, getReports, getYouth } from '../data';
import CircularProgress from './CircularProgress';
import type { Branch, HourlyRate, Report, Youth } from '../types';
import { buildYouthWorkSummary, MANDATORY_HOURS_LIMIT } from '../workSummary';

const OTHER_BRANCH_NAME = 'אחר';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const statusLabels: Record<Report['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
};

const statusClasses: Record<Report['status'], string> = {
  pending: 'chip',
  approved: 'chip bg-[rgba(47,140,112,0.14)] text-[var(--success)] border-[rgba(47,140,112,0.18)]',
  rejected: 'chip bg-[rgba(200,106,118,0.14)] text-[var(--danger)] border-[rgba(200,106,118,0.18)]',
};

const YouthDashboard = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [youth, setYouth] = useState<Youth | null>(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [report, setReport] = useState({
    branch: '',
    date: getTodayDate(),
    startTime: '',
    endTime: '',
    details: '',
  });
  const currentUser = getCurrentUser();

  const loadData = async () => {
    const [branchList, rateList, reportList, youthList] = await Promise.all([
      getBranches(),
      getRates(),
      getReports(),
      getYouth(),
    ]);

    setBranches(branchList);
    setRates(rateList);
    setReports(reportList);
    setYouth(youthList.find((item) => item.id === currentUser?.id) ?? null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const branchOptions = useMemo(() => {
    const existingNames = new Set(branches.map((branch) => branch.name));
    return existingNames.has(OTHER_BRANCH_NAME) ? branches : [...branches, { name: OTHER_BRANCH_NAME, password: '' }];
  }, [branches]);

  const userReports = useMemo(
    () =>
      reports
        .filter((item) => item.youthId === currentUser?.id)
        .slice()
        .sort((left, right) => `${right.date}T${right.startTime}`.localeCompare(`${left.date}T${left.startTime}`)),
    [reports, currentUser?.id],
  );

  const summary = useMemo(
    () => (youth ? buildYouthWorkSummary(youth, reports, rates) : null),
    [youth, reports, rates],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser?.id) {
      alert('צריך להתחבר מחדש לפני שליחת דיווח');
      return;
    }

    if (!report.branch || !report.date || !report.startTime || !report.endTime) {
      alert('נא למלא את כל השדות');
      return;
    }

    const isOtherBranch = report.branch === OTHER_BRANCH_NAME;
    if (isOtherBranch && !report.details.trim()) {
      alert('בדיווח על ענף אחר חייבים להוסיף פירוט עבודה');
      return;
    }

    const start = new Date(`2000-01-01T${report.startTime}`);
    const end = new Date(`2000-01-01T${report.endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (Number.isNaN(totalHours) || totalHours <= 0) {
      alert('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
      return;
    }

    await addReport({
      youthId: currentUser.id,
      youthName: currentUser.name,
      branch: report.branch,
      details: isOtherBranch ? report.details.trim() : '',
      date: report.date,
      startTime: report.startTime,
      endTime: report.endTime,
      totalHours,
      approvalTarget: isOtherBranch ? 'guide' : 'manager',
      status: 'pending',
    });

    setReport({
      branch: '',
      date: getTodayDate(),
      startTime: '',
      endTime: '',
      details: '',
    });
    setIsReportFormOpen(false);
    await loadData();
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-6xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="page-title mb-2">שלום {currentUser?.name}</h1>
              <p className="page-subtitle">דשבורד אישי עם שעות חובה, שעות לתשלום והיסטוריית דיווחים.</p>
            </div>
            <button onClick={() => setIsReportFormOpen(true)} className="btn-primary">
              דיווח חדש
            </button>
          </div>

          {summary && (
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="content-card flex flex-col items-center justify-center p-6">
                <CircularProgress
                  value={Math.min(summary.mandatoryCompletedHours, MANDATORY_HOURS_LIMIT)}
                  max={MANDATORY_HOURS_LIMIT}
                  size={170}
                  strokeWidth={12}
                  color="#3c7f88"
                />
                <div className="mt-4 text-lg font-semibold">שעות חובה שהושלמו</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="content-card p-5">
                  <div className="page-subtitle mb-2">שעות מאושרות במחזור הנוכחי</div>
                  <div className="text-3xl font-semibold">{summary.cycleApprovedHours.toFixed(1)}</div>
                </div>
                <div className="content-card p-5">
                  <div className="page-subtitle mb-2">שעות לתשלום כרגע</div>
                  <div className="text-3xl font-semibold">{summary.payablePendingHours.toFixed(1)}</div>
                </div>
                <div className="content-card p-5">
                  <div className="page-subtitle mb-2">כסף שנצבר לתשלום</div>
                  <div className="text-3xl font-semibold">₪{summary.payablePendingAmount.toFixed(2)}</div>
                </div>
                <div className="content-card p-5">
                  <div className="page-subtitle mb-2">שעות מאושרות החודש</div>
                  <div className="text-3xl font-semibold">{summary.currentMonthHours.toFixed(1)}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-4">היסטוריית דיווחים</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {userReports.length === 0 ? (
              <div className="content-card p-6">
                <p className="page-subtitle">עדיין אין דיווחים.</p>
              </div>
            ) : (
              userReports.map((item) => (
                <div key={item.id} className="content-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{item.branch}</div>
                      <div className="page-subtitle">
                        {item.date} | {item.startTime}-{item.endTime}
                      </div>
                    </div>
                    <div className={statusClasses[item.status]}>{statusLabels[item.status]}</div>
                  </div>
                  <div className="page-subtitle mb-2">סה"כ {item.totalHours.toFixed(1)} שעות</div>
                  {item.details && <div className="rounded-2xl bg-[rgba(237,244,247,0.85)] p-4 text-sm">{item.details}</div>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {isReportFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/35 p-4" dir="rtl">
          <div className="content-card w-full max-w-xl p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">דיווח חדש</h2>
              <button onClick={() => setIsReportFormOpen(false)} className="btn-secondary px-3 py-2">
                סגור
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="b" className="field-label">
                  ענף
                </label>
                <select
                  id="b"
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
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="d" className="field-label">
                  תאריך
                </label>
                <input
                  id="d"
                  type="date"
                  required
                  className="field-input"
                  value={report.date}
                  onChange={(event) => setReport({ ...report, date: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s" className="field-label">
                    שעת התחלה
                  </label>
                  <input
                    id="s"
                    type="time"
                    required
                    className="field-input"
                    value={report.startTime}
                    onChange={(event) => setReport({ ...report, startTime: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="e" className="field-label">
                    שעת סיום
                  </label>
                  <input
                    id="e"
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
                  <label htmlFor="details" className="field-label">
                    פירוט העבודה
                  </label>
                  <textarea
                    id="details"
                    required
                    className="field-input min-h-32"
                    value={report.details}
                    onChange={(event) => setReport({ ...report, details: event.target.value })}
                    placeholder="מה נעשה בפועל בענף האחר?"
                  />
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                שלח דיווח
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouthDashboard;
