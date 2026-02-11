
import React, { useState } from 'react';
import { MOCK_SPARES } from '../../services/mockData';
import { SparePart } from '../../types';

const SparePartManagement: React.FC = () => {
  const [spares, setSpares] = useState<SparePart[]>(MOCK_SPARES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlerts, setFilterAlerts] = useState(false);
  
  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'IMPORT' | 'STOCK_IN' | 'STOCK_OUT'>('ADD');
  const [selectedSpare, setSelectedSpare] = useState<Partial<SparePart>>({});
  const [moveAmount, setMoveAmount] = useState(1);

  // 模拟智能预测逻辑：根据冲次斜率和维修计划预测未来消耗
  const getSuggestedPurchase = (spare: SparePart) => {
    // 逻辑：如果当前库存小于 2 倍的最低阈值，则建议采购
    // 建议采购量 = 最低阈值 * 3 - 当前库存 (确保覆盖未来一个周期的使用量)
    if (spare.stock < spare.minStock * 2) {
      const suggestion = Math.max(0, spare.minStock * 3 - spare.stock);
      return {
        amount: suggestion,
        reason: spare.stock < spare.minStock ? '库存已跌破阈值' : '预测未来两周消耗将超标'
      };
    }
    return null;
  };

  const filteredSpares = spares.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.id.includes(searchTerm) || s.category.includes(searchTerm);
    const matchesAlert = filterAlerts ? (s.stock < s.minStock || (s.trackShots && s.currentShots! >= s.maxShots! * 0.9)) : true;
    return matchesSearch && matchesAlert;
  });

  const shotAlertCount = spares.filter(s => s.trackShots && s.currentShots! >= s.maxShots! * 0.9).length;

  const handleStockMove = () => {
    if (!selectedSpare.id) return;
    
    setSpares(spares.map(s => {
      if (s.id === selectedSpare.id) {
        const newStock = modalMode === 'STOCK_IN' ? s.stock + moveAmount : s.stock - moveAmount;
        if (newStock < 0) {
          alert('库存不能为负数！');
          return s;
        }
        return { ...s, stock: newStock };
      }
      return s;
    }));
    setIsModalOpen(false);
    setMoveAmount(1);
  };

  const handleAddSpare = () => {
    const newPart: SparePart = {
      id: selectedSpare.id || `SP-${Date.now().toString().slice(-4)}`,
      name: selectedSpare.name || '新备件',
      category: selectedSpare.category || '通用件',
      stock: Number(selectedSpare.stock) || 0,
      minStock: Number(selectedSpare.minStock) || 5,
      trackShots: selectedSpare.trackShots || false,
      currentShots: selectedSpare.trackShots ? (Number(selectedSpare.currentShots) || 0) : undefined,
      maxShots: selectedSpare.trackShots ? (Number(selectedSpare.maxShots) || 1000000) : undefined,
    };
    setSpares([...spares, newPart]);
    setIsModalOpen(false);
    setSelectedSpare({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">备件库存管理</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => { setModalMode('IMPORT'); setIsModalOpen(true); }}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
          >
            <i className="fas fa-file-import mr-2"></i>批量导入
          </button>
          <button 
            onClick={() => { setModalMode('ADD'); setSelectedSpare({}); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
          >
            <i className="fas fa-plus mr-2"></i>新增备件档案
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-xs font-bold uppercase">备件总品类</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{spares.length}</h3>
        </div>
        <div 
          onClick={() => setFilterAlerts(!filterAlerts)}
          className={`cursor-pointer p-6 rounded-2xl shadow-sm border transition-all ${filterAlerts ? 'bg-red-600 border-red-700 text-white ring-4 ring-red-100' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          <div className="flex justify-between items-start">
            <p className={`text-xs font-bold uppercase ${filterAlerts ? 'text-white/80' : 'text-red-600'}`}>库存预警品类</p>
            {filterAlerts && <i className="fas fa-filter text-[10px]"></i>}
          </div>
          <h3 className="text-2xl font-bold mt-1">
            {spares.filter(s => s.stock < s.minStock).length}
          </h3>
          <p className="text-[10px] mt-1 opacity-70">{filterAlerts ? '点击取消筛选' : '点击筛选预警件'}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-100">
          <p className="text-amber-600 text-xs font-bold uppercase">冲次预警品类</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">{shotAlertCount}</h3>
          <p className="text-[10px] text-amber-500 mt-1 font-bold">寿命即将到期</p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
          <p className="text-indigo-600 text-xs font-bold uppercase">本月消耗额</p>
          <h3 className="text-2xl font-bold text-indigo-700 mt-1">¥ 12,450</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="搜索备件名称、编号或类型 (例如: 加热棒 或 SP-001)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-sm outline-none">
          <option>全部品类</option>
          <option>电器件</option>
          <option>机械件</option>
          <option>密封件</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">备件信息</th>
              <th className="px-6 py-4 font-bold">分类</th>
              <th className="px-6 py-4 font-bold">当前库存</th>
              <th className="px-6 py-4 font-bold">最低阈值</th>
              <th className="px-6 py-4 font-bold">冲次统计</th>
              <th className="px-6 py-4 font-bold">状态</th>
              <th className="px-6 py-4 font-bold">建议采购数量 (AI 预测)</th>
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSpares.map(spare => {
              const suggestion = getSuggestedPurchase(spare);
              return (
                <tr key={spare.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{spare.name}</p>
                    <p className="text-xs text-slate-500">{spare.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{spare.category}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${spare.stock < spare.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                      {spare.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{spare.minStock}</td>
                  <td className="px-6 py-4">
                    {spare.trackShots ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">{spare.currentShots?.toLocaleString()}</span>
                          <span className="text-slate-400">/ {spare.maxShots?.toLocaleString()}</span>
                        </div>
                        <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              spare.currentShots! >= spare.maxShots! * 0.9 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (spare.currentShots! / spare.maxShots!) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] italic">无需统计</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {spare.stock < spare.minStock && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold w-fit">库存不足</span>
                      )}
                      {spare.trackShots && spare.currentShots! >= spare.maxShots! * 0.9 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold w-fit">寿命预警</span>
                      )}
                      {spare.stock >= spare.minStock && (!spare.trackShots || spare.currentShots! < spare.maxShots! * 0.9) && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold w-fit">正常</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {suggestion ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 font-black text-sm">+{suggestion.amount}</span>
                          <span className="bg-indigo-50 text-indigo-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Recommended</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">{suggestion.reason}</p>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] italic">库存充足，暂无建议</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedSpare(spare); setModalMode('STOCK_IN'); setIsModalOpen(true); }}
                      className="text-blue-600 hover:underline text-xs font-bold mr-3"
                    >
                      入库
                    </button>
                    <button 
                      onClick={() => { setSelectedSpare(spare); setModalMode('STOCK_OUT'); setIsModalOpen(true); }}
                      className="text-amber-600 hover:underline text-xs font-bold mr-3"
                    >
                      出库
                    </button>
                    <button className="text-slate-400 hover:text-indigo-600">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 备件模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'ADD' ? '新增备件档案' : 
                 modalMode === 'STOCK_IN' ? '备件入库流程' : 
                 modalMode === 'STOCK_OUT' ? '备件出库申请' : '批量导入'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {(modalMode === 'STOCK_IN' || modalMode === 'STOCK_OUT') ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">正在处理</p>
                    <p className="text-sm font-bold text-slate-800">{selectedSpare.name}</p>
                    <p className="text-xs text-slate-500">当前库存: {selectedSpare.stock}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">调整数量</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setMoveAmount(Math.max(1, moveAmount - 1))} className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">-</button>
                      <input 
                        type="number" 
                        className="flex-1 text-center font-bold text-lg p-2 border border-slate-200 rounded-lg"
                        value={moveAmount}
                        onChange={e => setMoveAmount(Number(e.target.value))}
                      />
                      <button onClick={() => setMoveAmount(moveAmount + 1)} className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">经办人 / 备注</label>
                    <input type="text" placeholder="例如: 张三 - 产线4紧急更换" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              ) : modalMode === 'ADD' ? (
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">备件名称</label>
                    <input 
                      type="text" 
                      placeholder="例如: 加热管 B-Type" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={selectedSpare.name || ''}
                      onChange={e => setSelectedSpare({...selectedSpare, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">分类</label>
                    <select 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={selectedSpare.category || ''}
                      onChange={e => setSelectedSpare({...selectedSpare, category: e.target.value})}
                    >
                      <option value="电器件">电器件</option>
                      <option value="机械件">机械件</option>
                      <option value="密封件">密封件</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">最低库存阈值</label>
                    <input 
                      type="number" 
                      placeholder="例如: 10" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={selectedSpare.minStock || ''}
                      onChange={e => setSelectedSpare({...selectedSpare, minStock: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">初始库存</label>
                    <input 
                      type="number" 
                      placeholder="例如: 50" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={selectedSpare.stock || ''}
                      onChange={e => setSelectedSpare({...selectedSpare, stock: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedSpare.trackShots || false}
                        onChange={e => setSelectedSpare({...selectedSpare, trackShots: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase">开启冲次寿命统计 (特殊备件)</span>
                    </label>
                  </div>
                  {selectedSpare.trackShots && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">当前累计冲次</label>
                        <input 
                          type="number" 
                          placeholder="例如: 0" 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={selectedSpare.currentShots || ''}
                          onChange={e => setSelectedSpare({...selectedSpare, currentShots: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">设计寿命上限</label>
                        <input 
                          type="number" 
                          placeholder="例如: 1000000" 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={selectedSpare.maxShots || ''}
                          onChange={e => setSelectedSpare({...selectedSpare, maxShots: Number(e.target.value)})}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center">
                   <i className="fas fa-file-excel text-5xl text-green-600 mb-4"></i>
                   <p className="text-sm text-slate-600">将 Excel 文件拖拽至此或点击上传</p>
                   <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold">浏览文件</button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <button 
                onClick={modalMode === 'ADD' ? handleAddSpare : (modalMode === 'IMPORT' ? () => setIsModalOpen(false) : handleStockMove)}
                className={`px-6 py-2 text-white text-sm font-bold rounded-lg shadow-md transition-colors ${
                  modalMode === 'STOCK_OUT' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {modalMode === 'STOCK_IN' ? '确认入库' : modalMode === 'STOCK_OUT' ? '确认出库' : '提交保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SparePartManagement;
