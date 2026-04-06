import React, { useState, useEffect, useRef } from 'react';
import {
  fetchMachineSlotList,
  MachineSlotData,
  SlotItem,
  saveMachineSlotConfig,
  SlotConfigItem
} from '../../services/machineSlotService';

const MachineSlotConfig: React.FC = () => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [configList, setConfigList] = useState<MachineSlotData[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState<MachineSlotData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 页面加载标记，确保只调用一次接口
  const hasFetchedData = useRef(false);

  // 获取机台槽位列表数据
  const fetchMachineSlots = async (machineCode: string = '') => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await fetchMachineSlotList({
        machine_code: machineCode
      });
      setConfigList(data);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '获取数据失败' });
    } finally {
      setLoading(false);
    }
  };

  // 页面进入时只调用一次接口
  useEffect(() => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    fetchMachineSlots();
  }, []);

  // 查询按钮点击事件
  const handleSearch = () => {
    fetchMachineSlots(searchQuery);
  };

  const handleEdit = (config: MachineSlotData) => {
    setSelectedMachine(config);
    setView('edit');
  };

  // 切换槽位绑定状态
  const toggleSlotStatus = (slotName: string) => {
    if (!selectedMachine) return;

    setSelectedMachine({
      ...selectedMachine,
      slots: selectedMachine.slots.map(slot =>
        slot.slot === slotName
          ? { ...slot, is_bound: slot.is_bound === '已绑定' ? '未绑定' : '已绑定' }
          : slot
      )
    });
  };

  const handleSave = async () => {
    if (!selectedMachine) {
      setMessage({ type: 'error', text: '请选择机台' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // 构建槽位配置数据
      const slots: SlotConfigItem[] = selectedMachine.slots.map(slot => ({
        slot: slot.slot,
        status: slot.is_bound === '已绑定' ? 1 : 2,
        ...(slot.mold_id ? { mold_id: slot.mold_id } : {})
      }));

      // 调用保存接口
      const result = await saveMachineSlotConfig({
        machine_id: selectedMachine.machine_id,
        slots
      });

      // 根据返回的 code 判断成功或失败
      if (result.code === 200) {
        setMessage({ type: 'success', text: result.message || '机台模台配置保存成功！' });
        setTimeout(() => {
          setMessage(null);
          setView('list');
          // 刷新数据
          fetchMachineSlots(searchQuery);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存失败，请稍后重试。' });
    } finally {
      setSaving(false);
    }
  };

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
            <div className="flex items-center gap-2 flex-1 md:w-80">
              <div className="relative flex-1">
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
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-200 whitespace-nowrap"
              >
                <i className={`fas fa-filter text-xs ${loading ? 'fa-spin' : ''}`}></i>
                查询
              </button>
            </div>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-spinner fa-spin text-4xl mb-3 block opacity-50"></i>
                    加载中...
                  </td>
                </tr>
              ) : configList.length > 0 ? (
                configList.map((config) => (
                  <tr key={config.machine_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <i className="fas fa-desktop text-xs"></i>
                        </div>
                        <span className="font-bold text-slate-700">{config.machine_name}</span>
                      </div>
                    </td>
                    {config.slots.map(slot => (
                      <td key={slot.slot} className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg inline-block ${
                          slot.is_bound === '已绑定'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {slot.is_bound}
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

  // 如果没有选中机台，返回列表视图
  if (!selectedMachine) {
    return null;
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
            编辑机台配置: {selectedMachine.machine_name}
          </h2>
          <p className="text-slate-500 mt-1">配置机台可用的模具槽位 (P1, P2, P3, P4)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">机台编号</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-bold">
                {selectedMachine.machine_name}
              </div>
            </div>
            <div className="md:pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
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
            {selectedMachine.slots.map((slot) => (
              <div
                key={slot.slot}
                className={`p-6 rounded-2xl border-2 transition-all group ${
                  slot.is_bound === '已绑定'
                    ? 'border-indigo-100 bg-indigo-50/30'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                      slot.is_bound === '已绑定' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                      {slot.slot}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">槽位 {slot.slot}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">SLOT CONFIGURATION</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={slot.is_bound === '已绑定'}
                      onChange={() => toggleSlotStatus(slot.slot)}
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
