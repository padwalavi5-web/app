import { useEffect, useMemo, useState } from 'react';
import { addReport, getBranches, getCurrentUser } from '../data';
import type { Branch } from '../types';

const OTHER_BRANCH_NAME = 'אחר';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const YouthDashboard = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [report, setReport] = useState({
    branch: '',
    date: getTodayDate(),
    startTime: '',
    endTime: '',
    details: '',
  });
  const user = getCurrentUser();

  useEffect(() => {
    const loadBranches = async () => {
      const branchList = await getBranches();
      setBranches(branchList);
    };

    loadBranches();
  }, []);

  const branchOptions = useMemo(() => {
    const existingNames = new Set(branches.map((branch) => branch.name));
    return existingNames.has(OTHER_BRANCH_NAME) ? branches : [...branches, { name: OTHER_BRANCH_NAME, password: '' }];
  }, [branches]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
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
      youthId: user.id,
      youthName: user.name,
      branch: report.branch,
      details: isOtherBranch ? report.details.trim() : '',
      date: report.date,
      startTime: report.startTime,
      endTime: report.endTime,
      totalHours,
      approvalTarget: isOtherBranch ? 'guide' : 'manager',
      status: 'pending',
    });

    alert(isOtherBranch ? 'הדיווח נשלח למדריך' : 'הדיווח נשלח למנהל הענף');
    setReport({
      branch: '',
      date: getTodayDate(),
      startTime: '',
      endTime: '',
      details: '',
    });
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-3xl">
        <div className="glass-panel p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">דיווח יומי</div>
              <h1 className="page-title mb-2">דיווח שעות</h1>
              <p className="page-subtitle">טופס ממורכז, פשוט ונעים עם זרימה מיוחדת לענף "אחר".</p>
            </div>
            <div className="content-card px-4 py-3 text-sm">
              <div className="font-semibold">{user?.name || 'משתמש'}</div>
              <div className="page-subtitle">מוכן לשליחת דיווח חדש</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="content-card space-y-5 p-5 sm:p-6">
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
    </div>
  );
};

export default YouthDashboard;
