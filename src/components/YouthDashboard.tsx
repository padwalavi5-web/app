import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getReports, getRates, addReport, calculateAge } from '../data';
import type { Report } from '../types';
import CircularProgress from './CircularProgress';

const YouthDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [formData, setFormData] = useState({
    branch: '',
    date: '',
    startTime: '',
    endTime: '',
    totalHours: 0,
  });
  const navigate = useNavigate();

  const isBirthday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  };

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'youth') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      const allReports = await getReports();
      const userReports = allReports.filter(r => r.youthId === currentUser.id);
      setReports(userReports);
    };
    loadData();
  }, [navigate]);

  const calculateHours = async () => {
    const approvedReports = reports.filter(r => r.status === 'approved');
    const totalApproved = approvedReports.reduce((sum, r) => sum + r.totalHours, 0);
    const paidHours = Math.max(0, totalApproved - 90);
    const rates = await getRates();
    const age = calculateAge(user.birthDate);
    const rate = rates.find(r => r.age === age)?.rate || 0;
    const budget = paidHours * rate;
    return { totalApproved, paidHours, budget };
  };

  const [hoursData, setHoursData] = useState({ totalApproved: 0, paidHours: 0, budget: 0 });

  useEffect(() => {
    const loadHours = async () => {
      const data = await calculateHours();
      setHoursData(data);
    };
    if (user) loadHours();
  }, [reports, user]);

  const handleReportSubmit = async () => {
    if (!formData.branch || !formData.date || !formData.startTime || !formData.endTime) {
      alert('אנא מלא את כל השדות');
      return;
    }
    const start = new Date(`1970-01-01T${formData.startTime}:00`);
    const end = new Date(`1970-01-01T${formData.endTime}:00`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours <= 0) {
      alert('זמן סיום חייב להיות אחרי זמן התחלה');
      return;
    }
    const newReport: Omit<Report, 'id'> = {
      youthId: user.id,
      branch: formData.branch,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      totalHours: hours,
      status: 'pending',
    };
    await addReport(newReport);
    const allReports = await getReports();
    const userReports = allReports.filter(r => r.youthId === user.id);
    setReports(userReports);
    setShowReportForm(false);
    setFormData({ branch: '', date: '', startTime: '', endTime: '', totalHours: 0 });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': 
        return <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">⏳ ממתין</span>;
      case 'approved': 
        return <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">✅ אושר</span>;
      case 'rejected': 
        return <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">❌ נדחה</span>;
      default: return '';
    }
  };

  if (!user) return <div>טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">שלום {user.name}</h1>
        {isBirthday(user.birthDate) && (
          <div className="bg-gradient-to-r from-pink-400 to-red-400 text-white text-center py-3 px-4 rounded-lg shadow-md mb-4 animate-bounce">
            🎉 מזל טוב! יום הולדת שמח! 🎂
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">התקדמות שעתי</h2>
          <div className="flex justify-center">
            <CircularProgress value={Math.min(hoursData.totalApproved, 90)} max={90} />
          </div>
          <p className="text-center mt-2">שעות בוצעו: {hoursData.totalApproved.toFixed(1)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">שעות לתקציב אישי</h2>
          <p className="text-2xl font-bold text-green-600">{hoursData.paidHours.toFixed(1)} שעות</p>
          <p className="text-gray-600">תקציב: ₪{hoursData.budget.toFixed(2)}</p>
        </div>

        <button
          onClick={() => setShowReportForm(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors mb-4"
        >
          דיווח שעות עבודה
        </button>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">היסטוריה</h2>
          <div className="space-y-2">
            {reports.slice(-5).reverse().map(report => (
              <div key={report.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">{report.branch}</p>
                  <p className="text-sm text-gray-600">{report.date} {report.startTime}-{report.endTime}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{report.totalHours.toFixed(1)} שעות</p>
                  <div className="mt-1">{getStatusIcon(report.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showReportForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">דיווח שעות</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">ענף</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  title="בחר ענף"
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">בחר ענף</option>
                  <option value="רפת">רפת</option>
                  <option value="נוי">נוי</option>
                  <option value="חדר אוכל">חדר אוכל</option>
                  <option value="מטבח">מטבח</option>
                  <option value="כלבו">כלבו</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">תאריך</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  title="בחר תאריך"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">שעת התחלה</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  title="שעת התחלה"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">שעת סיום</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  title="שעת סיום"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleReportSubmit}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  שלח
                </button>
                <button
                  onClick={() => setShowReportForm(false)}
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

export default YouthDashboard;