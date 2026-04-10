import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRates, addRate } from '../data';
import type { HourlyRate } from '../types';

const ManagerRates = () => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [newRate, setNewRate] = useState({ age: '', rate: '' });
  const navigate = useNavigate();

  const loadRates = async () => {
    const data = await getRates();
    setRates(data);
  };

  useEffect(() => { loadRates(); }, []);

  const handleAdd = async () => {
    if (!newRate.age || !newRate.rate) return;
    
    // תיקון שגיאת ה-Property 'id' is missing
    const rateData = {
      age: parseInt(newRate.age),
      rate: parseFloat(newRate.rate)
    };
    
    await addRate(rateData);
    setNewRate({ age: '', rate: '' });
    loadRates();
  };

  return (
    <div className="p-4 max-w-md mx-auto text-right" dir="rtl">
      <button onClick={() => navigate('/guide')} className="mb-4 text-blue-600 font-bold underline">חזור</button>
      <h1 className="text-2xl font-bold mb-6 text-orange-600">ניהול תעריפי שכר</h1>
      <div className="bg-white p-4 shadow rounded-xl mb-6 border">
        <label htmlFor="age-rate-input" className="block mb-1">גיל:</label>
        <input id="age-rate-input" type="number" placeholder="גיל (למשל: 16)" className="w-full border p-2 mb-2 rounded" value={newRate.age} onChange={e => setNewRate({...newRate, age: e.target.value})} />
        <label htmlFor="price-rate-input" className="block mb-1">תעריף:</label>
        <input id="price-rate-input" type="number" placeholder="תעריף לשעה (₪)" className="w-full border p-2 mb-4 rounded" value={newRate.rate} onChange={e => setNewRate({...newRate, rate: e.target.value})} />
        <button onClick={handleAdd} className="w-full bg-orange-500 text-white p-2 rounded-lg font-bold shadow-md active:bg-orange-600">הוסף תעריף</button>
      </div>
      <div className="space-y-2">
        <h2 className="font-bold border-b pb-1">תעריפים רשומים:</h2>
        {rates.length === 0 ? <p className="text-gray-400">אין תעריפים כרגע</p> : rates.map(r => (
          <div key={r.id} className="flex justify-between p-3 bg-gray-50 rounded border shadow-sm">
            <div className="font-bold text-orange-700">₪{r.rate} לשעה</div>
            <div>גיל: {r.age}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerRates;