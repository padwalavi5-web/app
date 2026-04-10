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
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">דיווח שעות</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="b" className="block font-bold">
            ענף:
          </label>
          <select
            id="b"
            required
            className="w-full border p-2 rounded"
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
          <label htmlFor="d" className="block font-bold">
            תאריך:
          </label>
          <input
            id="d"
            type="date"
            required
            className="w-full border p-2 rounded"
            value={report.date}
            onChange={(event) => setReport({ ...report, date: event.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="s" className="block font-bold">
              התחלה:
            </label>
            <input
              id="s"
              type="time"
              required
              className="w-full border p-2 rounded"
              value={report.startTime}
              onChange={(event) => setReport({ ...report, startTime: event.target.value })}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="e" className="block font-bold">
              סיום:
            </label>
            <input
              id="e"
              type="time"
              required
              className="w-full border p-2 rounded"
              value={report.endTime}
              onChange={(event) => setReport({ ...report, endTime: event.target.value })}
            />
          </div>
        </div>

        {report.branch === OTHER_BRANCH_NAME && (
          <div>
            <label htmlFor="details" className="block font-bold">
              פירוט העבודה:
            </label>
            <textarea
              id="details"
              required
              className="w-full border p-2 rounded min-h-28"
              value={report.details}
              onChange={(event) => setReport({ ...report, details: event.target.value })}
              placeholder="מה נעשה בפועל בענף האחר?"
            />
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold">
          שלח דיווח
        </button>
      </form>
    </div>
  );
};

export default YouthDashboard;
