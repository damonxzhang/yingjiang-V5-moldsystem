import React, { useState, useEffect } from 'react';
import { DashboardService } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';

interface SlotConfig {
  slot: string;
  enabled: boolean;
  label: string;
}

interface MachineSlotConfigData {
  machine_code: string;
  slots: SlotConfig[];
}

const MachineSlotConfig: React.FC = () => {
  const [machines, setMachines] = useState<string[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [slots, setSlots] = useState<SlotConfig[]>([
    { slot: 'P1', enabled: true, label: 'P1' },
    { slot: 'P2', enabled: true, label: 'P2' },
    { slot: 'P3', enabled: true, label: 'P3' },
    { slot: 'P4', enabled: false, label: 'P4' },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      try {
        const codes = await DashboardService.fetchMachineCodes();
        setMachines(codes);
        if (codes.length > 0) {
          setSelectedMachine(codes[0]);
        }
      } catch (error) {
        console.error('获取机台列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      // 模拟获取机台槽位配置
      // 在实际项目中，这里应该调用 API: fetchMachineSlotConfig(selectedMachine)
      console.log(`获取机台 ${selectedMachine} 的槽位配置`);
      
      // 模拟数据逻辑：如果是特定机台，显示不同配置
      if (selectedMachine.includes('01')) {
        setSlots([
          { slot: 'P1', enabled: true, label: 'P1' },
          { slot: 'P2', enabled: true, label: 'P2' },
          { slot: 'P3', enabled: false, label: 'P3' },
          { slot: 'P4', enabled: false, label: 'P4' },
        ]);
      } else {
        setSlots([
          { slot: 'P1', enabled: true, label: 'P1' },
          { slot: 'P2', enabled: true, label: 'P2' },
          { slot: 'P3', enabled: true, label: 'P3' },
          { slot: 'P4', enabled: true, label: 'P4' },
        ]);
      }
    }
  }, [selectedMachine]);

  const handleToggleSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index].enabled = !newSlots[index].enabled;
    setSlots(newSlots);
  };

  const handleLabelChange = (index: number, label: string) => {
    const newSlots = [...slots];
    newSlots[index].label = label;
    setSlots(newSlots);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // 模拟保存 API 调用
      console.log('保存配置:', { machine_code: selectedMachine, slots });
      await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
      
      setMessage({ type: 'success', text: '机台模台配置保存成功！' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请稍后重试。' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <i className="fas fa-microchip text-indigo-600"></i>
          机台模台配置
        </h2>
        <p className="text-slate-500 mt-1">配置机台可用的模具槽位 (P1, P2, P3, P4)</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">选择机台</label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                disabled={loading}
              >
                {machines.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div className="md:pt-6">
              <button
                onClick={handleSave}
                disabled={saving || !selectedMachine}
                className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 ${
                  saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                保存配置
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slots.map((slot, index) => (
              <div 
                key={slot.slot} 
                className={`p-6 rounded-2xl border-2 transition-all group ${
                  slot.enabled 
                    ? 'border-indigo-100 bg-indigo-50/30' 
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                      slot.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                      {slot.slot}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">槽位 {slot.slot}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Slot Configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={slot.enabled}
                      onChange={() => handleToggleSlot(index)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">槽位别名 / 显示名称</label>
                  <input
                    type="text"
                    value={slot.label}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                    placeholder={`例如: ${slot.slot} 模台`}
                    disabled={!slot.enabled}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
              <i className="fas fa-lightbulb"></i>
            </div>
            <div>
              <h5 className="font-bold text-amber-800 text-sm">配置提示</h5>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                机台槽位配置决定了在生产看板中该机台显示的模台数量。例如，某些机台可能只有 P1 和 P2 两个槽位，您可以将其余槽位禁用，以免在看板上造成混淆。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineSlotConfig;
