import React, { useState } from 'react';

const MaintenanceReminderCycle: React.FC = () => {
  const [cycleDays, setCycleDays] = useState<string>('7');
  const [error, setError] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setError('');
    setSaved(false);

    if (value === '') {
      setCycleDays('');
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setError('请输入大于0的正整数');
    } else {
      setCycleDays(value);
    }
  };

  const handleSave = () => {
    const num = parseInt(cycleDays, 10);
    if (isNaN(num) || num <= 0) {
      setError('请输入大于0的正整数');
      return;
    }

    setSaved(true);
    setError('');
    localStorage.setItem('maintenance_reminder_cycle', cycleDays);
    setTimeout(() => setSaved(false), 3000);
  };

  React.useEffect(() => {
    const savedCycle = localStorage.getItem('maintenance_reminder_cycle');
    if (savedCycle) {
      setCycleDays(savedCycle);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          保养提醒周期设置
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-slate-700">保养提醒周期</span>
          <div className="relative">
            <input
              type="number"
              value={cycleDays}
              onChange={handleInputChange}
              min="1"
              className={`w-32 px-4 py-3 border rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
              placeholder="7"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
          </div>
          <span className="text-slate-500">，只填写大于0的正整数</span>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600">
            <i className="fas fa-exclamation-circle text-sm"></i>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <i className="fas fa-check"></i>
                保存成功
              </span>
            ) : (
              '保存'
            )}
          </button>
          <button
            onClick={() => {
              setCycleDays('7');
              setError('');
              setSaved(false);
            }}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            重置为默认值 (7天)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceReminderCycle;