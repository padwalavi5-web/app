import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRate, getRates } from '../data';
import type { HourlyRate } from '../types';

const ManageRates = () => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [newRate, setNewRate] = useState({ age: '', rate: '' });
  const navigate = useNavigate();

  const loadRates = async () => {
    const data = await getRates();
    setRates(data);
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleAdd = async () => {
    if (!newRate.age || !newRate.rate) {
      return;
    }

    await addRate({
      age: parseInt(newRate.age, 10),
      rate: parseFloat(newRate.rate),
    });

    setNewRate({ age: '', rate: '' });
    loadRates();
  };

  return (
    <div className="app-shell" dir="rtl">
      <div className="page-wrap max-w-5xl space-y-6">
        <section className="glass-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="chip mb-3">תמחור</div>
              <h1 className="page-title mb-2">ניהול תעריפי שכר</h1>
              <p className="page-subtitle">עדכון תעריפים לפי גיל מתוך ממשק מרוכז ונעים לעבודה.</p>
            </div>
            <button onClick={() => navigate('/guide')} className="btn-secondary">
              חזור לסיכום
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="content-card p-5 sm:p-6">
              <div className="mb-4">
                <div className="chip mb-3">תעריף חדש</div>
                <h2 className="text-2xl font-semibold">הוספת תעריף</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="age-rate-input" className="field-label">
                    גיל
                  </label>
                  <input
                    id="age-rate-input"
                    type="number"
                    placeholder="למשל 16"
                    className="field-input"
                    value={newRate.age}
                    onChange={(event) => setNewRate({ ...newRate, age: event.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="price-rate-input" className="field-label">
                    תעריף לשעה
                  </label>
                  <input
                    id="price-rate-input"
                    type="number"
                    placeholder="למשל 35"
                    className="field-input"
                    value={newRate.rate}
                    onChange={(event) => setNewRate({ ...newRate, rate: event.target.value })}
                  />
                </div>

                <button onClick={handleAdd} className="btn-primary w-full">
                  הוסף תעריף
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {rates.length === 0 ? (
                <div className="content-card p-6">
                  <p className="page-subtitle">אין תעריפים כרגע.</p>
                </div>
              ) : (
                rates.map((rate) => (
                  <div key={rate.id} className="content-card p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-xl font-semibold">₪{rate.rate}</div>
                      <div className="chip">גיל {rate.age}</div>
                    </div>
                    <div className="page-subtitle">תעריף קבוע לשעה עבור גיל זה.</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageRates;
