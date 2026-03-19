
import React, { useState } from 'react';
import { MOCK_WORK_ORDERS } from '../../services/mockData';
import { WorkOrder } from '../../types';

const RepairRecords: React.FC = () => {
  const [records] = useState<WorkOrder[]>(MOCK_WORK_ORDERS.filter(wo => wo.type === 'REPAIR'));
  const [selectedRecord, setSelectedRecord] = useState<WorkOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetail = (record: WorkOrder) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">APP 维修执行全链追溯</h2>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="按模具编号或维修人员搜索..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-sm outline-none">
          <option>所有状态</option>
          <option>已完成</option>
          <option>待处理</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">工单编号</th>
              <th className="px-6 py-4 font-bold">模具对象</th>
              <th className="px-6 py-4 font-bold">主修人</th>
              <th className="px-6 py-4 font-bold">维修类别</th>
              <th className="px-6 py-4 font-bold">维修方式</th>
              <th className="px-6 py-4 font-bold">验收人</th>
              <th className="px-6 py-4 font-bold">维修项目数</th>
              <th className="px-6 py-4 font-bold">停机影响</th>
              <th className="px-6 py-4 font-bold">最终归位</th>
              <th className="px-6 py-4 font-bold text-right">查看全流程</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{record.id}</td>
                <td className="px-6 py-4 text-sm text-indigo-600 font-black">{record.moldId}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-bold">{record.operator}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${(record as any).repairCategory === '紧急' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {(record as any).repairCategory || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                  {(record as any).repairMethod || '-'}
                </td>
                <td className="px-6 py-4 text-xs text-indigo-600 font-black">
                  {(record as any).buyoffBy || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {record.actions?.length || 0} 项动作
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${record.machineStatusAfter === 'RECOVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {record.machineStatusAfter === 'RECOVERED' ? '机台已恢复' : '借机停机'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                  {record.locationCode || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openDetail(record)}
                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-black uppercase tracking-tighter"
                  >
                    Details <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 增强型详情模态框 */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3">
                   <h3 className="font-black text-xl tracking-tight">维修执行鉴定书</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">工单编号: {selectedRecord.id} | 模具: {selectedRecord.moldId}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8">
              {/* 左侧：故障与执行细节 */}
              <div className="col-span-8 space-y-8">
                {/* 1. 现象描述 */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-search-minus text-indigo-500"></i>
                    Step 1: 故障现象与报修描述
                  </h4>
                  <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-xl">
                    <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                      "{selectedRecord.description || '现场未记录文字描述'}"
                    </p>
                  </div>
                </section>

                {/* 2. 执行动作项 */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-tools text-red-600"></i>
                    Step 2: 维修执行动作记录
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecord.actions?.map((action, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <i className="fas fa-wrench text-red-500"></i>
                        <span className="text-xs font-bold text-slate-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. 故障根因分析 */}
                <section className="bg-slate-900 rounded-[2rem] p-8 text-white">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Step 3: 故障根因分析 (Root Cause)</h4>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">维修类别</p>
                        <p className="text-sm font-black text-red-400">{(selectedRecord as any).repairCategory || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">维修方式</p>
                        <p className="text-sm font-black text-slate-200">{(selectedRecord as any).repairMethod || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">验收人员</p>
                        <p className="text-sm font-black text-green-400">{(selectedRecord as any).buyoffBy || '-'}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                       <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">根本原因结论</p>
                       <p className="text-sm font-medium leading-relaxed italic text-slate-300">
                         {(selectedRecord as any).rootCause || '未录入根因分析结论'}
                       </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* 右侧：备件与流向状态 */}
              <div className="col-span-4 space-y-8">
                {/* 4. 备件消耗清单 */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-box-open text-amber-500"></i>
                    备件消耗同步
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-slate-400 font-black">品名</th>
                          <th className="px-4 py-2 text-slate-400 font-black text-right">数量</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedRecord.sparesUsed?.map((spare, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{spare.name}</p>
                              <p className="text-[9px] font-mono text-slate-400">{spare.id}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-indigo-600">x {spare.quantity}</td>
                          </tr>
                        ))}
                        {(!selectedRecord.sparesUsed || selectedRecord.sparesUsed.length === 0) && (
                          <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic">未产生备件更换</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 5. 归位确认 */}
                <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4">
                  <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-map-marker-alt"></i>
                    物理归位扫码确认识别
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">去向类型</span>
                      <span className="text-sm font-black text-indigo-900">{selectedRecord.destination === 'CABINET' ? '模具柜存档' : '回装生产机台'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">位置编号</span>
                      <span className="text-sm font-mono font-black text-indigo-900 tracking-tighter">{selectedRecord.locationCode}</span>
                    </div>
                    <div className="pt-2">
                       <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Verified Location OK</span>
                    </div>
                  </div>
                </section>

                {/* 6. 执行人员 */}
                <section className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {selectedRecord.operator.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">执行人员</p>
                    <p className="text-sm font-black text-slate-800">{selectedRecord.operator}</p>
                    <p className="text-[10px] text-slate-400">{selectedRecord.confirmedAt} 完成</p>
                  </div>
                </section>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairRecords;
