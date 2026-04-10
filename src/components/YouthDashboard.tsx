import { useState } from 'react';
import { getCurrentUser, addReport } from '../data';
import { useNavigate } from 'react-router-dom';

const YouthDashboard = () => {
  const [report, setReport] = useState({ branch: '', date: '', startTime: '', endTime: '' });
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const start = new Date(`2000-01-01T${report.startTime}`);
    const end = new Date(`2000-01-01T${report.endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (totalHours <= 0) {
      alert("זמן סיום חייב להיות אחרי זמן התחלה");
      return;
    }

    await addReport({
      youthId: user.id,
      youthName: user.name, // תיקון שגיאת ה-Missing Property
      branch: report.branch,
      date: report.date,
      startTime: report.startTime,
      endTime: report.endTime,
      totalHours,
      status: 'pending'
    });

    alert("דיווח נשלח בהצלחה!");
    setReport({ branch: '', date: '', startTime: '', endTime: '' });
  };

  if (!user) return <div className="p-4 text-right">אנא התחבר מחדש...</div>;

  return (
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <button onClick={() => navigate('/')} className="mb-4 text-blue-600 underline">התנתק</button>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">שלום, {user.name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-md border">
        <div>
          <label htmlFor="branch-input" className="block mb-1 font-bold">ענף:</label>
          <input 
            id="branch-input"
            name="branch"
            type="text" 
            required 
            className="w-full p-2 border rounded-xl" 
            value={report.branch} 
            onChange={e => setReport({...report, branch: e.target.value})} 
          />
        </div>
        <div>
          <label htmlFor="date-input" className="block mb-1 font-bold">תאריך:</label>
          <input 
            id="date-input"
            name="date"
            type="date" 
            required 
            className="w-full p-2 border rounded-xl" 
            value={report.date} 
            onChange={e => setReport({...report, date: e.target.value})} 
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="start-input" className="block mb-1 font-bold">התחלה:</label>
            <input 
              id="start-input"
              name="startTime"
              type="time" 
              required 
              className="w-full p-2 border rounded-xl" 
              value={report.startTime} 
              onChange={e => setReport({...report, startTime: e.target.value})} 
            />
          </div>
          <div>
            <label htmlFor="end-input" className="block mb-1 font-bold">סיום:</label>
            <input 
              id="end-input"
              name="endTime"
              type="time" 
              required 
              className="w-full p-2 border rounded-xl" 
              value={report.endTime} 
              onChange={e => setReport({...report, endTime: e.target.value})} 
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg mt-4 transition-transform active:scale-95">
          שלח דיווח לאישור
        </button>
      </form>
    </div>
  );
};

export default YouthDashboard;