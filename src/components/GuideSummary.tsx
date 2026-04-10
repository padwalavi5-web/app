import { useState, useEffect } from 'react';
import { getYouth, getReports, resetPaidHours } from '../data';
import type { Youth, Report } from '../types';

const GuideSummary = () => {
  const [youthList, setYouthList] = useState<Youth[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const fetchData = async () => {
    const y = await getYouth();
    const r = await getReports();
    setYouthList(y);
    setReports(r);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async (youthId: string, currentTotal: number) => {
    if (window.confirm("לאפס שעות ולסמן כשולם?")) {
      await resetPaidHours(youthId, currentTotal);
      await fetchData();
    }
  };

  return (
    <div className="p-4 text-right" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">סיכום שעות</h1>
      <div className="space-y-4">
        {youthList.map(y => {
          const approvedHours = reports
            .filter(r => r.youthId === y.id && r.status === 'approved')
            .reduce((sum, r) => sum + r.totalHours, 0);
          
          const hoursToPay = approvedHours - y.lastResetHours;

          return (
            <div key={y.id} className="p-4 border rounded-xl shadow-sm bg-white flex justify-between items-center">
              <button 
                onClick={() => handleReset(y.id, approvedHours)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
              >
                סמן כשולם
              </button>
              <div>
                <div className="font-bold">{y.name}</div>
                <div className="text-sm text-blue-600 font-bold">שעות לתשלום: {hoursToPay.toFixed(1)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuideSummary;