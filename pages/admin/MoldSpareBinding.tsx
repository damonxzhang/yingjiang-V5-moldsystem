
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_SPARES } from '../../services/mockData';
import { Mold, SparePart } from '../../types';

interface Binding {
  moldId: string;
  spareId: string;
  quantity: number;
}

const MoldSpareBinding: React.FC = () => {
  const [selectedMoldId, setSelectedMoldId] = useState<string>(MOCK_MOLDS[0].id);
  const [moldFilter, setMoldFilter] = useState<string>('');
  const [bindings, setBindings] = useState<Binding[]>([
    { moldId: 'MOLD-001', spareId: 'SP-001', quantity: 2 },
    { moldId: 'MOLD-001', spareId: 'SP-002', quantity: 10 },
    { moldId: 'MOLD-002', spareId: 'SP-001', quantity: 1 },
    { moldId: 'MOLD-004', spareId: 'SP-004', quantity: 4 },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBinding, setNewBinding] = useState({ spareId: '', quantity: 1 });

  const selectedMold = MOCK_MOLDS.find(m => m.id === selectedMoldId);
  const currentBindings = bindings.filter(b => b.moldId === selectedMoldId);

  const filteredMolds = MOCK_MOLDS.filter(mold =>
    mold.id.toLowerCase().includes(moldFilter.toLowerCase()) ||
    mold.name.toLowerCase().includes(moldFilter.toLowerCase())
  );

  const handleAddBinding = () => {
    if (!newBinding.spareId) return;
    setBindings([...bindings, { moldId: selectedMoldId, ...newBinding }]);
    setIsAddModalOpen(false);
    setNewBinding({ spareId: '', quantity: 1 });
  };

  const removeBinding = (spareId: string) => {
    setBindings(bindings.filter(b => !(b.moldId === selectedMoldId && b.spareId === spareId)));
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
          {filteredMolds.map(mold => (
            <button
              key={mold.id}
              onClick={() => setSelectedMoldId(mold.id)}
              className={`w-full text-left p-4 transition-colors border-b border-slate-50 last:border-0 ${
                selectedMoldId === mold.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'
              }`}
            >
              <p className={`text-sm font-bold ${selectedMoldId === mold.id ? 'text-indigo-700' : 'text-slate-800'}`}>{mold.id}</p>
              <p className="text-xs text-slate-500">{mold.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧绑定关系详情 */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">绑定的备件列表</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">模具: <span className="font-bold">{selectedMold?.id}</span> / {selectedMold?.name}</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors"
          >
            <i className="fas fa-plus"></i>
            添加配件绑定
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentBindings.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-bold">备件编号</th>
                  <th className="px-6 py-4 font-bold">名称</th>
                  <th className="px-6 py-4 font-bold">建议装配量</th>
                  <th className="px-6 py-4 font-bold">库存状况</th>
                  <th className="px-6 py-4 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentBindings.map(b => {
                  const spare = MOCK_SPARES.find(s => s.id === b.spareId);
                  return (
                    <tr key={b.spareId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{b.spareId}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{spare?.name}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-800">{b.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold ${spare && spare.stock < spare.minStock ? 'text-red-500' : 'text-green-600'}`}>
                          {spare?.stock} (低阈值: {spare?.minStock})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeBinding(b.spareId)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="解绑配件"
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
              <p className="text-sm italic">当前模具尚未绑定任何常用备件</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加绑定模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">建立配件绑定关系</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">选择备件</label>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newBinding.spareId}
                  onChange={(e) => setNewBinding({...newBinding, spareId: e.target.value})}
                >
                  <option value="">请选择备件...</option>
                  {MOCK_SPARES.filter(s => !currentBindings.some(cb => cb.spareId === s.id)).map(spare => (
                    <option key={spare.id} value={spare.id}>{spare.id} - {spare.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">建议装配/安全数量</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={newBinding.quantity}
                  onChange={(e) => setNewBinding({...newBinding, quantity: Number(e.target.value)})}
                  placeholder="例如: 2"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500">取消</button>
              <button 
                onClick={handleAddBinding} 
                disabled={!newBinding.spareId}
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

export default MoldSpareBinding;
