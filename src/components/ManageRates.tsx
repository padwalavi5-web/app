import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getRates, saveRates, addRate } from '../data';
import type { HourlyRate } from '../types';

const ManageRates = () => {
  const [user, setUser] = useState<any>(null);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [newRate, setNewRate] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newRateValue, setNewRateValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'guide') {
        navigate('/');
        return;
      }
      setUser(currentUser);
      const rateData = await getRates();
      setRates(rateData);
    };
    loadData();
  }, [navigate]);

  const handleEdit = (age: number) => {
    setEditing(age);
    const rate = rates.find(r => r.age === age);
    if (rate) setNewRate(rate.rate.toString());
  };

  const handleSave = async () => {
    const rateValue = parseFloat(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      alert('תעריף חייב להיות מספר חיובי');
      return;
    }
    const updated = rates.map(r => r.age === editing ? { ...r, rate: rateValue } : r);
    await saveRates(updated);
    setRates(updated);
    setEditing(null);
    setNewRate('');
  };

  const handleAdd = async () => {
    const ageValue = parseInt(newAge);
    const rateValue = parseFloat(newRateValue);
    if (isNaN(ageValue) || ageValue < 14 || ageValue > 18) {
      alert('גיל חייב להיות בין 14 ל-18');
      return;
    }
    if (isNaN(rateValue) || rateValue <= 0) {
      alert('תעריף חייב להיות מספר חיובי');
      return;
    }
    if (rates.some(r => r.age === ageValue)) {
      alert('תעריף לגיל זה כבר קיים');
      return;
    }
    const newRateObj = { age: ageValue, rate: rateValue };
    await addRate(newRateObj);
    setRates([...rates, newRateObj]);
    setNewAge('');
    setNewRateValue('');
  };

  if (!user) return <div>טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">ניהול תעריפי שעה</h1>
        
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">הוסף תעריף חדש</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">גיל</label>
              <input
                type="number"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                title="גיל"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="הכנס גיל"
                min="14"
                max="18"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תעריף לשעה (₪)</label>
              <input
                type="number"
                value={newRateValue}
                onChange={(e) => setNewRateValue(e.target.value)}
                title="תעריף לשעה"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="הכנס תעריף"
                step="0.01"
                min="0"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              הוסף
            </button>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/guide')}
          className="w-full mb-4 bg-gray-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        >
          חזור לסיכום
        </button>

        <div className="space-y-3">
          {rates.map(rate => (
            <div key={rate.age} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold">גיל {rate.age}</h3>
                  <p className="text-gray-600">
                    {editing === rate.age ? (
                      <input
                        type="number"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        title="תעריף חדש לשעה"
                        placeholder="תעריף"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      `תעריף: ₪${rate.rate}`
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {editing === rate.age ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700 text-sm"
                      >
                        ביטול
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(rate.age)}
                      className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm"
                    >
                      ערוך
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageRates;