
import React, { useState } from 'react';
import { MOCK_WORK_ORDERS } from '../../services/mockData';
import { WorkOrder } from '../../types';

const MaintenanceRecords: React.FC = () => {
  const [records] = useState<WorkOrder[]>(MOCK_WORK_ORDERS.filter(wo => wo.type === 'MAINTENANCE'));
  const [selectedRecord, setSelectedRecord] = useState<WorkOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleExportPDF = () => {
    alert("正在生成 PDF 保养鉴定报告...\n包含：工单流水、执行项目勾选、现场备件消耗及人员确认。");
  };

  const handleBatchExport = () => {
    alert("正在准备 Excel 数据导出...\n包含当前筛选条件下的所有保养记录。");
  };

  const openDetail = (record: WorkOrder) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">APP 保养执行记录汇总</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-file-pdf text-red-500"></i>
            打印保养鉴定书
          </button>
          <button 
            onClick={handleBatchExport}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-file-excel"></i>
            批量导出数据
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="搜索模具编号、工单编号或操作员..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-sm outline-none" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">工单编号</th>
              <th className="px-6 py-4 font-bold">模具对象</th>
              <th className="px-6 py-4 font-bold">执行人员</th>
              <th className="px-6 py-4 font-bold">执行项数</th>
              <th className="px-6 py-4 font-bold">完成时间</th>
              <th className="px-6 py-4 font-bold">归位</th>
              <th className="px-6 py-4 font-bold text-right">全流程查看</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{record.id}</td>
                <td className="px-6 py-4 text-sm text-indigo-600 font-black">{record.moldId}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-bold">{record.operator}</td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {record.actions?.length || 0} 项动作
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{record.confirmedAt || '-'}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">
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

      {/* 增强型详情模态框 - 与维修详情一致的专业视觉 */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3">
                   <h3 className="font-black text-xl tracking-tight uppercase">模具保养执行鉴定书</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">工单编号: {selectedRecord.id} | 模具: {selectedRecord.moldId}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8">
              {/* 左侧：保养项与描述 */}
              <div className="col-span-8 space-y-8">
                {/* 1. 保养任务背景 */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-info-circle text-indigo-500"></i>
                    Step 1: 保养背景与需求说明
                  </h4>
                  <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-xl">
                    <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                      "{selectedRecord.description || '现场未记录文字描述'}"
                    </p>
                  </div>
                </section>

                {/* 2. APP 勾选动作项 */}
              </div>

              {/* 右侧：备件与流向 */}
              <div className="col-span-4 space-y-8">
                {/* 4. 保养预防性备件更换 */}
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-microchip text-amber-500"></i>
                    预防性备件更换清单
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-slate-400 font-black">备件品名</th>
                          <th className="px-4 py-2 text-slate-400 font-black text-right">消耗</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedRecord.sparesUsed?.map((spare, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{spare.name}</p>
                              <p className="text-[9px] font-mono text-slate-400 tracking-tighter">{spare.id}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-indigo-600">x {spare.quantity}</td>
                          </tr>
                        ))}
                        {(!selectedRecord.sparesUsed || selectedRecord.sparesUsed.length === 0) && (
                          <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic">常规清洁保养，未耗用备件</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 5. 最终位置锁定 */}
                <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4">
                  <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-location-dot"></i>
                    物理归位扫码识别
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">归位类型</span>
                      <span className="text-sm font-black text-indigo-900">{selectedRecord.destination === 'CABINET' ? '模具库' : '生产线'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">库位/机台</span>
                      <span className="text-sm font-mono font-black text-indigo-900">{selectedRecord.locationCode}</span>
                    </div>
                    <div className="pt-2">
                       <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Location Binding Success</span>
                    </div>
                  </div>
                </section>

                {/* 6. 执行主体信息 */}
                <section className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    {selectedRecord.operator.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">主责人员</p>
                    <p className="text-sm font-black text-slate-800">{selectedRecord.operator}</p>
                    <p className="text-[10px] text-slate-400">完成于: {selectedRecord.confirmedAt}</p>
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

export default MaintenanceRecords;
