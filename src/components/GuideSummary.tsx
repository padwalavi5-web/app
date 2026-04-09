import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getYouth, getReports, getRates, calculateAge, resetPaidHoursOnly, resetEverythingForJuly } from '../data';
import type { Youth } from '../types';

const GuideSummary = () => {
  const [user, setUser] = useState<any>(null);
  const [youthData, setYouthData] = useState<Youth[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      
      // בדיקה אם היום ה-1 ביולי לאיפוס טוטאלי
      const today = new Date();
      if (today.getMonth() === 6 && today.getDate() === 1) {
        const allYouth = await getYouth();
        for (const y of allYouth) {
          await resetEverythingForJuly(y.id);
        }
      }
      
      await calculateData();
    };
    loadData();
  }, [navigate]);

  const calculateData = async () => {
    const youth = await getYouth();
    const reports = await getReports();
    const rates = await getRates();

    const updatedYouth = youth.map(y => {
      const userReports = reports.filter(r => r.youthId === y.id && r.status === 'approved');
      const totalApproved = userReports.reduce((sum, r) => sum + r.totalHours, 0);
      
      // חישוב שעות לתשלום: רק מה שמעל 90 (או מעל האיפוס האחרון)
      const baseline = (y as any).lastResetHours || 90;
      const paidHours = Math.max(0, totalApproved - baseline);
      
      const age = calculateAge(y.birthDate);
      const rate = rates.find(r => r.age === age)?.rate || 0;
      const budget = paidHours * rate;

      return { ...y, totalHours: totalApproved, paidHours, budget };
    });

    setYouthData(updatedYouth);
  };

  const exportToCSV = async () => {
    if (!window.confirm("סגירת חודש תאפס את השעות לתשלום (מעל 90). השעות שמתחת ל-90 יישמרו. להמשיך?")) return;

    for (const y of youthData) {
      await resetPaidHoursOnly(y.id, y.totalHours);
    }
    
    const csvContent = [
      ['שם', 'גיל', 'סה"כ שעות מאושרות', 'שעות לתשלום החודש', 'תקציב'],
      ...youthData.map(y => [y.name, calculateAge(y.birthDate), y.totalHours, y.paidHours, y.budget])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary_${new Date().getMonth() + 1}.csv`;
    link.click();
    
    await calculateData(); 
  };

  if (!user) return <div className="p-10 text-center">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">סיכום מדריך</h1>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={exportToCSV} className="bg-blue-600 text-white py-3 px-2 rounded-lg shadow font-bold text-xs">
            סגור חודש (איפוס תשלום)
          </button>
          <button onClick={() => navigate('/guide/youth')} className="bg-green-600 text-white py-3 px-2 rounded-lg shadow font-bold text-xs">
            נהל נוער
          </button>
          <button onClick={() => navigate('/guide/branches')} className="bg-purple-600 text-white py-3 px-2 rounded-lg shadow font-bold text-xs">
            נהל ענפים
          </button>
          <button onClick={() => navigate('/guide/rates')} className="bg-orange-600 text-white py-3 px-2 rounded-lg shadow font-bold text-xs">
            תעריפים
          </button>
        </div>

        <div className="space-y-3">
          {youthData.map(youth => (
            <div key={youth.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="text-lg font-bold">{youth.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div><span className="text-gray-500">סה"כ שעות:</span> {youth.totalHours.toFixed(1)}</div>
                <div><span className="text-gray-500">לתשלום:</span> <span className="text-green-600 font-bold">{youth.paidHours.toFixed(1)}</span></div>
                <div className="col-span-2 border-t pt-1 mt-1"><span className="text-gray-500">תקציב שנצבר:</span> ₪{youth.budget.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuideSummary;