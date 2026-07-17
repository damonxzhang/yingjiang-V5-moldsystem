import React, { useState, useEffect, useRef } from 'react';
import { MachineMmsDayService } from '../../services/machineMmsDayService';

const MaintenanceReminderCycle: React.FC = () => {
  const [cycleDays, setCycleDays] = useState<string>('');
  const [recordId, setRecordId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchCycleData();
    }
  }, []);

  const fetchCycleData = async () => {
    try {
      setLoading(true);
      const response = await MachineMmsDayService.fetchMachineMmsDay();
      if (response.data) {
        setCycleDays(response.data.day);
        setRecordId(response.data.id);
      }
    } catch (err: any) {
      setError(err.message || '获取保养提醒周期失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCycleDays(value);
    setError('');

    if (value === '') {
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setError('请输入大于0的正整数');
    }
  };

  const handleSave = async () => {
    const num = parseInt(cycleDays, 10);
    if (isNaN(num) || num <= 0) {
      setError('请输入大于0的正整数');
      return;
    }

    if (!recordId) {
      setError('无法获取记录ID');
      return;
    }

    try {
      setLoading(true);
      await MachineMmsDayService.updateMachineMmsDay({
        id: recordId,
        day: cycleDays
      });
      setError('');
      alert('修改成功');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

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
              type="text"
              value={cycleDays}
              onChange={handleInputChange}
              min="1"
              disabled={loading}
              className={`w-32 px-4 py-3 border rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                保存中...
              </span>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceReminderCycle;