import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getReports, getYouth, updateReport } from '../data';
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

  const handleApprove = async (reportId: string) => {
    try {
      await updateReport(reportId, { status: 'approved' });
      setReports(prevReports => prevReports.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error approving report:', error);
      alert('שגיאה באישור. אנא נסה שוב.');
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectNote.trim()) {
      alert('אנא הכנס הערה');
      return;
    }
    try {
      await updateReport(selectedReport.id, { status: 'rejected', note: rejectNote });
      setReports(prevReports => prevReports.filter(r => r.id !== selectedReport.id));
      setYouthNames(prevNames => {
        const newNames = { ...prevNames };
        delete newNames[selectedReport.youthId];
        return newNames;
      });
      setSelectedReport(null);
      setRejectNote('');
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('שגיאה בדחיית הדיווח. אנא נסה שוב.');
    }
  };

  const [youthNames, setYouthNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadNames = async () => {
      const youth = await getYouth();
      const names: {[key: string]: string} = {};
      for (const report of reports) {
        if (!names[report.youthId]) {
          const youthUser = youth.find(y => y.id === report.youthId);
          names[report.youthId] = youthUser ? youthUser.name : 'לא ידוע';
        }
      }
      setYouthNames(names);
    };
    if (reports.length > 0) {
      loadNames();
    } else {
      setYouthNames({});
    }
  }, [reports]);

  if (!user) return <div>טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">מנהל ענף: {user.branch}</h1>
        
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-center text-gray-600">אין דיווחים ממתינים</p>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow-md p-4">
                <p className="font-semibold">{youthNames[report.youthId] || 'טוען...'}</p>
                <p className="text-sm text-gray-600">{report.date}</p>
                <p className="text-sm">{report.startTime} - {report.endTime}</p>
                <p className="font-medium">{report.totalHours.toFixed(1)} שעות</p>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleApprove(report.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    אישור
                  </button>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  >
                    דחייה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">דחיית דיווח</h2>
              <p className="mb-4">הכנס הערה קצרה:</p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                rows={3}
                placeholder="הערה..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  דחה
                </button>
                <button
                  onClick={() => { setSelectedReport(null); setRejectNote(''); }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerApproval;