import { useState, useEffect } from 'react';
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
      const pendingReports = allReports.filter(r => r.status === 'pending' && r.branch === currentUser.branch);
      setReports(pendingReports);
    };
    loadData();
  }, [navigate]);

  const handleApprove = async (reportId: string | undefined) => {
    if (!reportId) return; // מונע את השגיאה של TS
    try {
      await updateReport(reportId, { status: 'approved' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedReport?.id || !rejectNote.trim()) return;
    try {
      await updateReport(selectedReport.id, { status: 'rejected' });
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setRejectNote('');
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return <div className="p-4 text-center">טוען...</div>;

  return (
    <div className="p-4 max-w-md mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-green-700 text-right">אישור שעות - ענף {user.branch}</h1>
      <div className="space-y-4 text-right">
        {reports.length === 0 ? <p>אין דיווחים ממתינים</p> : reports.map(r => (
          <div key={r.id} className="border p-4 rounded-xl shadow-sm bg-white">
            <div className="font-bold text-lg">{r.youthName}</div>
            <div className="text-sm text-gray-600">{r.date} | {r.startTime}-{r.endTime}</div>
            <div className="font-bold text-blue-600 mb-3">{r.totalHours.toFixed(1)} שעות</div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(r.id)} className="flex-1 bg-green-600 text-white p-2 rounded-lg font-bold">אישור</button>
              <button onClick={() => setSelectedReport(r)} className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg font-bold">דחייה</button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-right">
            <h2 className="text-xl font-bold mb-4">דחיית דיווח</h2>
            <textarea 
              value={rejectNote} 
              onChange={e => setRejectNote(e.target.value)}
              className="w-full border p-2 rounded mb-4" 
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2">
              <button onClick={handleReject} className="flex-1 bg-red-600 text-white p-2 rounded-lg">שלח דחייה</button>
              <button onClick={() => setSelectedReport(null)} className="flex-1 bg-gray-200 p-2 rounded-lg">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApproval;