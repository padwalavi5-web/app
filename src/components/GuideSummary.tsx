import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getYouth, getReports, getRates, calculateAge, resetPaidHours, resetUnder90Hours } from '../data';
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
      await resetUnder90Hours(); // Reset hours under 90 on June 20
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
      const paidHours = Math.max(0, totalApproved - 90);
      const age = calculateAge(y.birthDate);
      const rate = rates.find(r => r.age === age)?.rate || 0;
      const budget = paidHours * rate;
      return { ...y, totalHours: totalApproved, paidHours, budget };
    });

    setYouthData(updatedYouth);
  };

  const exportToCSV = async () => {
    await resetPaidHours(); // Reset paid hours before export
    await calculateData(); // Recalculate after reset

    const csvContent = [
      ['שם', 'גיל', 'שעות מאושרות', 'שעות לתשלום', 'תקציב'],
      ...youthData.map(y => [y.name, calculateAge(y.birthDate), y.totalHours, y.paidHours, y.budget])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'summary.csv';
    link.click();
  };

  if (!user) return <div>טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">סיכום מדריך</h1>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm"
          >
            סגור חודש וייצא לאקסל
          </button>
          <button
            onClick={() => navigate('/guide/youth')}
            className="bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors text-sm"
          >
            נהל נוער
          </button>
          <button
            onClick={() => navigate('/guide/branches')}
            className="bg-purple-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors text-sm"
          >
            נהל ענפים
          </button>
          <button
            onClick={() => navigate('/guide/rates')}
            className="bg-orange-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-orange-700 transition-colors text-sm"
          >
            נהל תעריפים
          </button>
        </div>

        <div className="space-y-3">
          {youthData.map(youth => (
            <div key={youth.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-2">{youth.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">גיל:</span> {calculateAge(youth.birthDate)}
                </div>
                <div>
                  <span className="font-medium">שעות מאושרות:</span> {youth.totalHours.toFixed(1)}
                </div>
                <div>
                  <span className="font-medium">שעות לתשלום:</span> {youth.paidHours.toFixed(1)}
                </div>
                <div>
                  <span className="font-medium">תקציב:</span> ₪{youth.budget.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuideSummary;