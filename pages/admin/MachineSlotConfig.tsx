import React, { useState, useEffect } from 'react';
import { DashboardService } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';

interface SlotConfig {
  slot: string;
  enabled: boolean;
}

interface MachineSlotConfigData {
  machine_code: string;
  slots: SlotConfig[];
}

const MachineSlotConfig: React.FC = () => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [configList, setConfigList] = useState<MachineSlotConfigData[]>([
    {
      machine_code: 'MAC-001',
      slots: [
        { slot: 'P1', enabled: true },
        { slot: 'P2', enabled: true },
        { slot: 'P3', enabled: false },
        { slot: 'P4', enabled: false },
      ]
    },
    {
      machine_code: 'MAC-002',
      slots: [
        { slot: 'P1', enabled: true },
        { slot: 'P2', enabled: true },
        { slot: 'P3', enabled: true },
        { slot: 'P4', enabled: true },
      ]
    }
  ]);

  const [machines, setMachines] = useState<string[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [slots, setSlots] = useState<SlotConfig[]>([
    { slot: 'P1', enabled: true },
    { slot: 'P2', enabled: true },
    { slot: 'P3', enabled: true },
    { slot: 'P4', enabled: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      try {
        const codes = await DashboardService.fetchMachineCodes();
        setMachines(codes);
      } catch (error) {
        console.error('获取机台列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  const handleEdit = (config: MachineSlotConfigData) => {
    setSelectedMachine(config.machine_code);
    setSlots([...config.slots]);
    setView('edit');
  };

  const handleAdd = () => {
    setSelectedMachine('');
    setSlots([
      { slot: 'P1', enabled: true },
      { slot: 'P2', enabled: true },
      { slot: 'P3', enabled: false },
      { slot: 'P4', enabled: false },
    ]);
    setView('edit');
  };

  const handleDelete = (machineCode: string) => {
    if (window.confirm(`确定要删除机台 ${machineCode} 的配置吗？`)) {
      setConfigList(configList.filter(c => c.machine_code !== machineCode));
      setMessage({ type: 'success', text: '删除成功' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleToggleSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index].enabled = !newSlots[index].enabled;
    setSlots(newSlots);
  };

  const handleSave = async () => {
    if (!selectedMachine) {
      setMessage({ type: 'error', text: '请选择机台' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // 模拟保存 API 调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newConfig: MachineSlotConfigData = {
        machine_code: selectedMachine,
        slots: [...slots]
      };

      const index = configList.findIndex(c => c.machine_code === selectedMachine);
      if (index > -1) {
        const newList = [...configList];
        newList[index] = newConfig;
        setConfigList(newList);
      } else {
        setConfigList([...configList, newConfig]);
      }
      
      setMessage({ type: 'success', text: '机台模台配置保存成功！' });
      setTimeout(() => {
        setMessage(null);
        setView('list');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请稍后重试。' });
    } finally {
      setSaving(false);
    }
  };

  const filteredConfigList = configList.filter(config => 
    config.machine_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === 'list') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <i className="fas fa-microchip text-indigo-600"></i>
              机台模台配置
            </h2>
            <p className="text-slate-500 mt-1">管理所有机台的模台槽位可用性</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="搜索机台编号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all whitespace-nowrap"
            >
              <i className="fas fa-plus"></i>
              新增配置
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">机台编号</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">P1 槽位</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">P2 槽位</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">P3 槽位</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">P4 槽位</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConfigList.length > 0 ? (
                filteredConfigList.map((config) => (
                  <tr key={config.machine_code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <i className="fas fa-desktop text-xs"></i>
                        </div>
                        <span className="font-bold text-slate-700">{config.machine_code}</span>
                      </div>
                    </td>
                    {config.slots.map(slot => (
                      <td key={slot.slot} className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg inline-block ${
                          slot.enabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {slot.enabled ? '已启用' : '未启用'}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(config)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                          title="编辑"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(config.machine_code)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                          title="删除"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-inbox text-4xl mb-3 block opacity-20"></i>
                    暂无机台配置数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setView('list')}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <i className="fas fa-microchip text-indigo-600"></i>
            {selectedMachine ? `编辑机台配置: ${selectedMachine}` : '新增机台配置'}
          </h2>
          <p className="text-slate-500 mt-1">配置机台可用的模具槽位 (P1, P2, P3, P4)</p>
        </div>
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
                disabled={loading || !!configList.find(c => c.machine_code === selectedMachine && view === 'edit')}
              >
                <option value="">请选择机台...</option>
                {machines.map(code => (
                  <option key={code} value={code} disabled={configList.some(c => c.machine_code === code && !selectedMachine)}>
                    {code} {configList.some(c => c.machine_code === code) ? '(已配置)' : ''}
                  </option>
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
