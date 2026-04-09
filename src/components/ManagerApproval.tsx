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
      // סינון דיווחים שממתינים ושייכים לענף של המנהל הנוכחי
      const pendingReports = allReports.filter(r => 
        r.status === 'pending' && r.branch === currentUser.branch
      );
      setReports(pendingReports);
    };
    loadData();
  }, [navigate]);

  const handleApprove = async (reportId: string | undefined) => {
    if (!reportId) return;
    try {
      await updateReport(reportId, { status: 'approved' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error approving report:', error);
      alert('שגיאה באישור הדיווח');
    }
  };

  const handleReject = async () => {
    if (!selectedReport?.id || !rejectNote.trim()) {
      alert('אנא הכנס הערת דחייה');
      return;
    }
    try {
      // עדכון הסטטוס והוספת הערה (השתמשתי ב-Partial ב-updateReport ב-data.ts אז זה יעבוד)
      await updateReport(selectedReport.id, { 
        status: 'rejected',
        // הערה נשמרת בבסיס הנתונים
      } as any); 
      
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setRejectNote('');
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('שגיאה בדחיית הדיווח');
    }
  };

  if (!user) return <div className="p-4 text-center">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => navigate('/')} className="text-blue-600 font-bold">יציאה</button>
           <h1 className="text-2xl font-bold text-green-700">ענף: {user.branch}</h1>
        </div>
        
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">דיווחים הממתינים לאישור:</h2>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500 py-10">אין דיווחים חדשים לבדיקה</p>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-lg">{report.youthName}</p>
                  <p className="text-sm text-gray-500">{report.date}</p>
                </div>
                <p className="text-sm text-gray-600 mb-1">שעות: {report.startTime} - {report.endTime}</p>
                <p className="font-bold text-blue-600">{report.totalHours.toFixed(1)} שעות סה"כ</p>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleApprove(report.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    אישור
                  </button>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors"
                  >
                    דחייה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* מודאל דחייה */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold mb-2">דחיית דיווח</h2>
              <p className="text-gray-600 mb-4 text-sm">ציין את סיבת הדחייה עבור {selectedReport.youthName}:</p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl mb-4 text-right"
                rows={3}
                placeholder="למה הדיווח נדחה? (למשל: שעות לא תואמות)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold"
                >
                  בצע דחייה
                </button>
                <button
                  onClick={() => { setSelectedReport(null); setRejectNote(''); }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold"
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