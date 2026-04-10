import { useState } from 'react';
import { getCurrentUser, addReport } from '../data';

const YouthDashboard = () => {
  const [report, setReport] = useState({ branch: '', date: '', startTime: '', endTime: '' });
  const user = getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const start = new Date(`2000-01-01T${report.startTime}`);
    const end = new Date(`2000-01-01T${report.endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    await addReport({
      youthId: user.id,
      youthName: user.name, // הוספת השדה החסר
      branch: report.branch,
      date: report.date,
      startTime: report.startTime,
      endTime: report.endTime,
      totalHours,
      status: 'pending'
    });

    alert("דיווח נשלח!");
    setReport({ branch: '', date: '', startTime: '', endTime: '' });
  };

  return (
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">דיווח שעות</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="b" className="block font-bold">ענף:</label>
          <input id="b" required className="w-full border p-2 rounded" value={report.branch} onChange={e => setReport({...report, branch: e.target.value})} />
        </div>
        <div>
          <label htmlFor="d" className="block font-bold">תאריך:</label>
          <input id="d" type="date" required className="w-full border p-2 rounded" value={report.date} onChange={e => setReport({...report, date: e.target.value})} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="s" className="block font-bold">התחלה:</label>
            <input id="s" type="time" required className="w-full border p-2 rounded" value={report.startTime} onChange={e => setReport({...report, startTime: e.target.value})} />
          </div>
          <div className="flex-1">
            <label htmlFor="e" className="block font-bold">סיום:</label>
            <input id="e" type="time" required className="w-full border p-2 rounded" value={report.endTime} onChange={e => setReport({...report, endTime: e.target.value})} />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold">שלח דיווח</button>
      </form>
    </div>
  );
};

export default YouthDashboard;