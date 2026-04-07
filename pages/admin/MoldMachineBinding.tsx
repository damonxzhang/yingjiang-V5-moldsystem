import React, { useState, useEffect, useRef } from 'react';
import { fetchAvailableMolds, AvailableMoldItem, fetchMachineCodes, fetchMachineSlots, bindMachineSlot, MachineSlot, fetchMoldBinding, MoldBindingInfo, unbindMachineSlot } from '../../services/moldBindingService';
import MultiSelect from '../../components/MultiSelect';

interface Binding {
  moldId: string;
  machineId: string;
  machineCode: string;
  slot: string;
  status: string;
  boundAt: string;
}

const MoldMachineBinding: React.FC = () => {
  const [molds, setMolds] = useState<AvailableMoldItem[]>([]);
  const [selectedMoldId, setSelectedMoldId] = useState<string>('');
  const [moldFilter, setMoldFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const isLoadingRef = useRef(false);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBinding, setNewBinding] = useState({ machineId: '', slotNumbers: [] as string[] });
  const [machines, setMachines] = useState<{ machine_id: number; machine_code: string }[]>([]);
  const [machineSlots, setMachineSlots] = useState<MachineSlot[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState<boolean>(false);
  const [fetchingBinding, setFetchingBinding] = useState<boolean>(false);

  // 加载机台编号
  const machinesLoadedRef = useRef(false);
  useEffect(() => {
    if (machinesLoadedRef.current) return;
    machinesLoadedRef.current = true;

    const loadMachines = async () => {
      try {
        const data = await fetchMachineCodes();
        setMachines(data);
      } catch (error) {
        console.error('加载机台编号失败:', error);
      }
    };

    loadMachines();
  }, []);

  // 加载可用模具列表
  useEffect(() => {
    const loadMolds = async () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      setLoading(true);
      try {
        const data = await fetchAvailableMolds();
        setMolds(data);
        // 默认选中第一个模具
        if (data.length > 0 && !selectedMoldId) {
          setSelectedMoldId(String(data[0].mold_id));
        }
      } catch (error) {
        console.error('加载模具列表失败:', error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadMolds();
  }, []);

  const selectedMold = molds.find(m => String(m.mold_id) === selectedMoldId);
  const currentBindings = bindings.filter(b => b.moldId === selectedMoldId);

  const filteredMolds = molds.filter(mold =>
    mold.mold_code.toLowerCase().includes(moldFilter.toLowerCase()) ||
    mold.short_name.toLowerCase().includes(moldFilter.toLowerCase())
  );

  // 选中模具时获取绑定信息
  useEffect(() => {
    if (selectedMoldId) {
      const loadMoldBinding = async () => {
        setFetchingBinding(true);
        try {
          const bindingInfoList = await fetchMoldBinding(Number(selectedMoldId));
          if (bindingInfoList && bindingInfoList.length > 0) {
            // 将 API 返回的绑定信息数组转换为本地 Binding 格式
            setBindings(bindingInfoList.map(info => ({
              moldId: selectedMoldId,
              machineId: String(info.machine_id),
              machineCode: info.machine_code,
              slot: info.slot,
              status: info.status,
              boundAt: info.bound_at
            })));
          } else {
            // 模具未绑定任何机台
            setBindings([]);
          }
        } catch (error) {
          console.error('加载模具绑定信息失败:', error);
          setBindings([]);
        } finally {
          setFetchingBinding(false);
        }
      };

      loadMoldBinding();
    }
  }, [selectedMoldId]);

  // 机台选择变化时获取模台信息
  useEffect(() => {
    if (newBinding.machineId) {
      const loadMachineSlots = async () => {
        setFetchingSlots(true);
        try {
          // 根据machine_code找到对应的machine_id
          const selectedMachine = machines.find(m => m.machine_code === newBinding.machineId);
          if (selectedMachine) {
            const data = await fetchMachineSlots(selectedMachine.machine_id, Number(selectedMoldId));
            setMachineSlots(data);
            setNewBinding({ ...newBinding, slotNumbers: [] });
          } else {
            setMachineSlots([]);
          }
        } catch (error) {
          console.error('加载模台信息失败:', error);
          setMachineSlots([]);
        } finally {
          setFetchingSlots(false);
        }
      };

      loadMachineSlots();
    } else {
      setMachineSlots([]);
      setNewBinding({ ...newBinding, slotNumbers: [] });
    }
  }, [newBinding.machineId, machines]);

  const handleAddBinding = async () => {
    if (!newBinding.machineId || newBinding.slotNumbers.length === 0) return;

    try {
      // 根据machine_code找到对应的machine_id
      const selectedMachine = machines.find(m => m.machine_code === newBinding.machineId);
      if (selectedMachine) {
        await bindMachineSlot(Number(selectedMoldId), selectedMachine.machine_id, newBinding.slotNumbers);

        // 重新获取绑定信息以更新列表
        const bindingInfoList = await fetchMoldBinding(Number(selectedMoldId));
        if (bindingInfoList && bindingInfoList.length > 0) {
          setBindings(bindingInfoList.map(info => ({
            moldId: selectedMoldId,
            machineId: String(info.machine_id),
            machineCode: info.machine_code,
            slot: info.slot,
            status: info.status,
            boundAt: info.bound_at
          })));
        } else {
          setBindings([]);
        }

        setIsAddModalOpen(false);
        setNewBinding({ machineId: '', slotNumbers: [] });
        setMachineSlots([]);
      }
    } catch (error) {
      console.error('绑定失败:', error);
      alert('绑定失败，请重试');
    }
  };

  const removeBinding = async (binding: Binding) => {
    if (!confirm(`确定要解绑模具与机台 ${binding.machineCode} 槽位 ${binding.slot} 的绑定关系吗？`)) {
      return;
    }

    try {
      await unbindMachineSlot(Number(binding.moldId), Number(binding.machineId), binding.slot);
      // 解绑成功后，重新获取绑定信息
      const bindingInfoList = await fetchMoldBinding(Number(selectedMoldId));
      if (bindingInfoList && bindingInfoList.length > 0) {
        setBindings(bindingInfoList.map(info => ({
          moldId: selectedMoldId,
          machineId: String(info.machine_id),
          machineCode: info.machine_code,
          slot: info.slot,
          status: info.status,
          boundAt: info.bound_at
        })));
      } else {
        setBindings([]);
      }
      alert('解绑成功');
    } catch (error) {
      console.error('解绑失败:', error);
      alert('解绑失败，请重试');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* 左侧模具列表 */}
      <div className="w-1/3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">选择模具</h3>
          <input
            type="text"
            placeholder="搜索模具编号或名称..."
            value={moldFilter}
            onChange={(e) => setMoldFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <i className="fas fa-spinner fa-spin mr-2"></i> 加载中...
            </div>
          ) : (
            filteredMolds.map(mold => (
              <button
                key={mold.mold_id}
                onClick={() => setSelectedMoldId(String(mold.mold_id))}
                className={`w-full text-left p-4 transition-colors border-b border-slate-50 last:border-0 ${
                  selectedMoldId === String(mold.mold_id) ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'
                }`}
              >
                <p className={`text-sm font-bold ${selectedMoldId === String(mold.mold_id) ? 'text-indigo-700' : 'text-slate-800'}`}>
                  {mold.mold_code}
                </p>
                <p className="text-xs text-slate-500">{mold.short_name}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 右侧绑定关系详情 */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">绑定的机台列表</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              模具: <span className="font-bold">{selectedMold?.mold_code}</span> / {selectedMold?.short_name}
            </p>
          </div>
          <button
            onClick={() => {
              setNewBinding({ machineId: '', slotNumbers: [] });
              setMachineSlots([]);
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors"
          >
            <i className="fas fa-plus"></i>
            添加机台绑定
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {fetchingBinding ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <i className="fas fa-spinner fa-spin mr-2"></i> 加载中...
            </div>
          ) : currentBindings.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-bold">机台编号</th>
                  <th className="px-6 py-4 font-bold">模台槽位</th>
                  <th className="px-6 py-4 font-bold">绑定状态</th>
                  <th className="px-6 py-4 font-bold">绑定时间</th>
                  <th className="px-6 py-4 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentBindings.map(b => {
                  return (
                    <tr key={`${b.machineId}-${b.slot}`} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{b.machineCode}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-800">{b.slot}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'NORMAL' ? 'bg-green-100 text-green-700' :
                          b.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                          b.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{b.boundAt}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeBinding(b)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="解绑机台"
                        >
                          <i className="fas fa-unlink"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl">
                <i className="fas fa-link-slash opacity-30"></i>
              </div>
              <p className="text-sm italic">当前模具尚未绑定任何机台</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加绑定模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">建立机台绑定关系</h3>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setNewBinding({ machineId: '', slotNumbers: [] });
                setMachineSlots([]);
              }} className="text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">选择机台</label>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newBinding.machineId}
                  onChange={(e) => setNewBinding({...newBinding, machineId: e.target.value})}
                >
                  <option value="">请选择机台...</option>
                  {machines.filter(m => !currentBindings.some(cb => cb.machineId === m.machine_code)).map(machine => (
                    <option key={machine.machine_id} value={machine.machine_code}>{machine.machine_code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">选择模台 (可多选)</label>
                {fetchingSlots ? (
                  <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400">
                    <i className="fas fa-spinner fa-spin mr-2"></i>加载中...
                  </div>
                ) : (
                  <MultiSelect
                    options={machineSlots.map(slot => ({
                      value: slot.slot,
                      label: `${slot.slot} ${slot.is_bound === '已绑定' ? '(已绑定)' : ''}`
                    }))}
                    value={newBinding.slotNumbers}
                    onChange={(values) => setNewBinding({ ...newBinding, slotNumbers: values as string[] })}
                    placeholder={machineSlots.length === 0 ? '请先选择机台' : '请选择模台...'}
                    disabled={machineSlots.length === 0}
                    size="middle"
                  />
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => {
                setIsAddModalOpen(false);
                setNewBinding({ machineId: '', slotNumbers: [] });
                setMachineSlots([]);
              }} className="px-4 py-2 text-xs font-bold text-slate-500">取消</button>
              <button
                onClick={handleAddBinding}
                disabled={!newBinding.machineId || newBinding.slotNumbers.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoldMachineBinding;
