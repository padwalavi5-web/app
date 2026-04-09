import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getYouth, getReports, getRates, calculateAge, resetPaidHours, getCurrentUser } from '../data';
import type { Youth } from '../types';

const GuideSummary = () => {
  const [youthData, setYouthData] = useState<Youth[]>([]);
  const navigate = useNavigate();

  const loadData = async () => {
    const youth = await getYouth();
    const reports = await getReports();
    const rates = await getRates();

    const processed = youth.map(y => {
      const approvedHours = reports
        .filter(r => r.youthId === y.id && r.status === 'approved')
        .reduce((sum, r) => sum + r.totalHours, 0);
      
      const baseline = y.lastResetHours || 90;
      const paidHours = Math.max(0, approvedHours - baseline);
      const rate = rates.find(r => r.age === calculateAge(y.birthDate))?.rate || 0;

      return { ...y, totalHours: approvedHours, paidHours, budget: paidHours * rate };
    });
    setYouthData(processed);
  };

  useEffect(() => { loadData(); }, []);

  const handleMonthlyReset = async () => {
    if (!window.confirm("זה יאפס רק את השעות שמעל 90 (לתשלום). להמשיך?")) return;
    for (const y of youthData) {
      await resetPaidHours(y.id, y.totalHours);
    }
    await loadData();
  };

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">סיכום שעות לתשלום</h1>
      <button onClick={handleMonthlyReset} className="bg-red-600 text-white p-2 rounded mb-4">סגור חודש (איפוס תשלום)</button>
      <div className="space-y-2">
        {youthData.map(y => (
          <div key={y.id} className="border p-3 rounded">
            <div className="font-bold">{y.name}</div>
            <div>שעות לתשלום: {y?.paidHours?.toFixed(1)} | תקציב: ₪{y?.budget?.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuideSummary;