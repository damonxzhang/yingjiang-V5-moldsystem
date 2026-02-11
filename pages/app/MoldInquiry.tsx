
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_WORK_ORDERS } from '../../services/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Mold, MoldComponent, WorkOrder } from '../../types';

interface MoldInquiryProps {
  onBack: () => void;
}

const MoldInquiry: React.FC<MoldInquiryProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeBOMId, setActiveBOMId] = useState<string | null>(null);
  
  const filteredMolds = MOCK_MOLDS.filter(m => 
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedHistoryMold = MOCK_MOLDS.find(m => m.id === activeHistoryId);
  const historyOrders = MOCK_WORK_ORDERS.filter(wo => wo.moldId === activeHistoryId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedBOMMold = MOCK_MOLDS.find(m => m.id === activeBOMId);

  return (
    <div className="p-4 bg-slate-50 min-h-full relative">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <i className="fas fa-chevron-left text-slate-600"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight italic">模具基本信息查询</h2>
      </div>

      <div className="relative mb-6">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text"
          placeholder="搜索模具 ID (如 TY101)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="space-y-6 pb-24">
        {filteredMolds.map(mold => (
          <div key={mold.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter">{mold.id}</h3>
                  <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">{mold.vendor}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-blue-500"></i>
                  {mold.location} · {mold.serialNumber}
                </p>
              </div>
              <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${STATUS_COLORS[mold.status]}`}>
                {STATUS_LABELS[mold.status]}
              </span>
            </div>
            
            {/* 核心技术参数 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Package Type / Pin</p>
                <div className="flex items-end gap-2">
                  <p className="text-sm font-black text-slate-800">{mold.packageType}</p>
                  <p className="text-lg font-black text-blue-600 leading-none">{mold.pinCode}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">实时 SHOT / 寿命</p>
                <div className="flex items-end gap-1">
                  <p className="text-lg font-black text-red-600 leading-none">{(mold.shotTotal / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">/ {mold.lifeLimit / 1000}K</p>
                </div>
              </div>
            </div>

            {/* 内部关键组件预览 */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between border-b border-slate-100 pb-2">
                <span>关键核心组件 (BOM Health)</span>
                <i className="fas fa-microchip text-indigo-400"></i>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {mold.components?.filter(c => c.isSpare).slice(0, 4).map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <i className={`fas ${comp.category === 'Transfer件' ? 'fa-bolt text-amber-500' : 'fa-layer-group text-blue-500'} text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">{comp.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">{comp.sn}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-indigo-600 leading-none">{comp.lifeLimit}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">Limit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => setActiveHistoryId(mold.id)}
                className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                流转历史
              </button>
              <button 
                onClick={() => setActiveBOMId(mold.id)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
              >
                全量 BOM 
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- 流转历史全屏详情 --- */}
      {activeHistoryId && (
        <div className="absolute inset-0 z-[60] bg-slate-900 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shrink-0">
            <button onClick={() => setActiveHistoryId(null)} className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="text-center">
              <h3 className="text-white font-black text-lg tracking-tight uppercase">流转履历追踪</h3>
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{activeHistoryId}</p>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
            {historyOrders.length > 0 ? (
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800"></div>
                
                <div className="space-y-8">
                  {historyOrders.map((order, idx) => (
                    <div key={order.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-950 border-2 z-10 flex items-center justify-center text-[10px] ${
                        order.type === 'REPAIR' ? 'border-red-500 text-red-500' : 
                        order.type === 'MAINTENANCE' ? 'border-amber-500 text-amber-500' : 'border-blue-500 text-blue-500'
                      }`}>
                        <i className={`fas ${
                          order.type === 'REPAIR' ? 'fa-wrench' : 
                          order.type === 'MAINTENANCE' ? 'fa-tools' : 'fa-exchange-alt'
                        }`}></i>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                            order.type === 'REPAIR' ? 'bg-red-500/20 text-red-400' : 
                            order.type === 'MAINTENANCE' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {order.type === 'REPAIR' ? '维修单' : order.type === 'MAINTENANCE' ? '保养单' : '转换单'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{order.createdAt}</span>
                        </div>
                        <p className="text-sm text-slate-200 font-bold leading-relaxed mb-4">
                          {order.description || '常规作业流程记录'}
                        </p>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                               <i className="fas fa-user"></i>
                             </div>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.operator}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 font-mono tracking-tighter">ID: {order.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-40">
                <i className="fas fa-history text-6xl mb-6"></i>
                <p className="text-sm font-black uppercase tracking-widest">暂无历史流转数据</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 全量 BOM 全屏详情 --- */}
      {activeBOMId && selectedBOMMold && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-white shrink-0 shadow-sm">
             <button onClick={() => setActiveBOMId(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-down"></i>
            </button>
            <div className="text-center">
              <h3 className="text-slate-900 font-black text-lg tracking-tight uppercase">全量 BOM 结构树</h3>
              <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">{selectedBOMMold.id} · {selectedBOMMold.name}</p>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 pb-32">
            {['上模件', '下模件', 'Transfer件'].map(category => {
              const comps = selectedBOMMold.components.filter(c => c.category === category);
              if (comps.length === 0) return null;
              return (
                <div key={category} className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">
                    {category} ({comps.length})
                  </h4>
                  <div className="space-y-3">
                    {comps.map((comp, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            comp.isSpare ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <i className={`fas ${comp.isSpare ? 'fa-puzzle-piece' : 'fa-box-open'}`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{comp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">SN: {comp.sn}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-xs font-black text-indigo-600 tracking-tighter">{comp.lifeLimit}</p>
                          {comp.isSpare && (
                            <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                              SPARE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 text-white shadow-2xl rounded-t-[2.5rem] border-t border-slate-800">
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic underline underline-offset-4 decoration-indigo-500">BOM 健康综合判定</span>
               <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Valid Integrity</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 w-[92%]"></div>
               </div>
               <span className="text-xs font-black tracking-tighter">92%</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoldInquiry;
