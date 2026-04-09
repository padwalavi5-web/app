import { useState, useEffect } from 'react';
import { getRates, addRate } from '../data';
import type { HourlyRate } from '../types';

const ManagerRates = () => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [newRate, setNewRate] = useState({ age: 14, rate: 0 });

  const fetchRates = async () => setRates(await getRates());
  useEffect(() => { fetchRates(); }, []);

  const handleAdd = async () => {
    await addRate(newRate); // ה-ID נוצר אוטומטית ב-Firestore
    setNewRate({ age: 14, rate: 0 });
    fetchRates();
  };

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-4">ניהול תעריפים</h2>
      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="גיל" value={newRate.age} onChange={e => setNewRate({...newRate, age: +e.target.value})} className="border p-2 w-20" />
        <input type="number" placeholder="תעריף" value={newRate.rate} onChange={e => setNewRate({...newRate, rate: +e.target.value})} className="border p-2 w-20" />
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 rounded">הוסף</button>
      </div>
      {rates.map(r => <div key={r.id} className="border-b py-2">גיל {r.age}: ₪{r.rate}</div>)}
    </div>
  );
};

export default ManagerRates;