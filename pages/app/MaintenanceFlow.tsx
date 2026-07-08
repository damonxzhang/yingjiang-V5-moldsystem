
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_WORK_ORDERS } from '../../services/mockData';
import { Mold, MoldStatus, WorkOrder } from '../../types';
import { MAINTENANCE_CONTENTS } from '../../constants';

interface MaintenanceFlowProps {
  onBack: () => void;
  initialStep?: 'LIST' | 'SCAN' | 'MAINTAINING' | 'FINAL';
}

const MaintenanceFlow: React.FC<MaintenanceFlowProps> = ({ onBack, initialStep }) => {
  const [step, setStep] = useState<'LIST' | 'SCAN' | 'MAINTAINING' | 'FINAL'>(initialStep || 'LIST');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [moldTableNo, setMoldTableNo] = useState('');
  const [sourceType, setSourceType] = useState<'CABINET' | 'MACHINE'>('CABINET');
  const [maintenanceInfo, setMaintenanceInfo] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(true);
  const [destination, setDestination] = useState<'CABINET' | 'MACHINE'>('CABINET');

  const handleScanMold = (id: string) => {
    const mold = MOCK_MOLDS.find(m => m.id === id);
    if (mold) {
      setSelectedMold(mold);
      // 始终显示为设备取模
      setSourceType('MACHINE');
      setStep('MAINTAINING');
    } else {
      alert(`未识别到模具 ID: ${id}！请使用 Mock 数据中的 ID (如 TY101, QF16)`);
    }
  };

  const toggleMaintenanceItem = (item: string) => {
    const newItems = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    setSelectedItems(newItems);
    
    // 自动更新作业记录文本
    const autoText = newItems.length > 0 ? `已执行保养项：\n${newItems.map((v, i) => `${i+1}. ${v}`).join('\n')}\n\n详细说明：` : '';
    setMaintenanceInfo(autoText);
  };

  const handleMaintenanceComplete = () => {
    setDestination('CABINET');
    setStep('FINAL');
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">模具保养执行流程</h2>
      </div>

      <div className="flex-1 p-4">
        {step === 'LIST' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">待保养任务列表</h3>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                {MOCK_WORK_ORDERS.filter(wo => wo.type === 'MAINTENANCE' && wo.status === 'PENDING').length} 项待办
              </span>
            </div>
            {MOCK_WORK_ORDERS.filter(wo => wo.type === 'MAINTENANCE' && wo.status === 'PENDING').map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedWorkOrder(order);
                  setStep('SCAN');
                }}
                className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <i className="fas fa-tools"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800">{order.moldId}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{order.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{order.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <i className="far fa-clock"></i>
                      {order.createdAt}
                    </span>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-300"></i>
              </button>
            ))}
            
            <div className="pt-4">
              <div className="bg-slate-100 p-4 rounded-xl border border-dashed border-slate-300 text-center">
                <p className="text-xs text-slate-400 font-medium mb-3">不在列表中？可直接扫码发起</p>
                <button 
                  onClick={() => setStep('SCAN')}
                  className="px-6 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 shadow-sm active:bg-slate-50"
                >
                  直接扫码识别
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'SCAN' && (
          <div className="space-y-6 pt-10">
            <div className="bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-black text-lg shadow-lg animate-pulse border-2 border-red-400">
              <i className="fas fa-qrcode text-2xl"></i>
              模具拆卸扫码
              <i className="fas fa-qrcode text-2xl"></i>
            </div>
            <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/50">
                <i className="fas fa-tools text-3xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">扫描模具二维码</h3>
              <p className="text-slate-400 text-sm">开始保养前，请先通过扫码识别模具身份</p>
              <input 
                type="text" 
                placeholder={selectedWorkOrder ? `请扫描模具 ${selectedWorkOrder.moldId}` : "扫描或输入模具 ID (QF16)"}
                onKeyDown={(e) => e.key === 'Enter' && handleScanMold((e.target as HTMLInputElement).value)}
                className="mt-8 w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all text-amber-400"
              />
              <p className="text-red-400 text-xs mt-4">* 扫描模具设备成功后即正式开始保养，后台的模具、设备、任务三个边框会变成红色</p>
              <p className="text-red-400 text-xs mt-1">* 扫码时系统会校验是否符合预设的保养时间范围</p>
            </div>
            <button 
              onClick={() => handleScanMold(selectedWorkOrder?.moldId || 'QF16')}
              className="w-full bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              {selectedWorkOrder ? `模拟扫码 ${selectedWorkOrder.moldId}` : '模拟扫码 QF16'}
            </button>
          </div>
        )}

        {step === 'MAINTAINING' && (
          <div className="space-y-6">
            <div className="bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-black animate-pulse shadow-lg">
              <i className="fas fa-spinner fa-spin"></i>
              状态同步：正在保养中
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
               <div>
                  <label className="block text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                    <i className="fas fa-check-double text-amber-500"></i>
                    执行保养内容
                  </label>
                  <div className="grid grid-cols-1 gap-2 border border-slate-100 p-2 rounded-xl bg-slate-50">
                    {MAINTENANCE_CONTENTS.map(item => (
                      <button
                        key={item}
                        onClick={() => toggleMaintenanceItem(item)}
                        className={`text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between ${
                          selectedItems.includes(item) ? 'bg-amber-500 text-white font-bold shadow-md' : 'bg-white text-slate-600 border border-slate-100'
                        }`}
                      >
                        {item}
                        {selectedItems.includes(item) && <i className="fas fa-check-circle"></i>}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-800">详细作业记录</label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-widest uppercase">MMS 半年 PM 同步</span>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm min-h-[140px] outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium leading-relaxed"
                    placeholder="请输入保养补充说明、异常发现等..."
                    value={maintenanceInfo}
                    onChange={e => setMaintenanceInfo(e.target.value)}
                  ></textarea>
               </div>

               <div className="flex gap-2">
                  <button className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 active:bg-slate-200 transition-colors">
                    <i className="fas fa-camera"></i>
                    上传现场照片
                  </button>
               </div>
            </div>

            <button 
              onClick={handleMaintenanceComplete}
              className="w-full bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
            >
              保养结束
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {step === 'FINAL' && (
          <div className="space-y-6 pt-4">
            <div className="bg-purple-600 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-black text-lg shadow-lg animate-pulse border-2 border-purple-400">
              <i className="fas fa-qrcode text-2xl"></i>
              模具安装扫码
              <i className="fas fa-qrcode text-2xl"></i>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-5 shadow-2xl border-t-8 border-amber-600">
               <p className="text-[10px] text-slate-400 border-b border-slate-800 pb-2 uppercase font-black tracking-widest flex justify-between">
                 <span>核验步骤：位置绑定扫码</span>
                 <i className="fas fa-barcode"></i>
               </p>
               {destination === 'CABINET' ? (
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 active:bg-slate-700 transition-colors">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black">1</div>
                      <span className="text-sm font-bold">扫描模具柜位置码 (如: C1-01)</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 active:bg-slate-700 transition-colors">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black">2</div>
                      <span className="text-sm font-bold">扫描模具二维码确认绑定</span>
                    </div>
                 </div>
               ) : (
                <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 active:bg-slate-700 transition-colors">
                     <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-black">1</div>
                     <span className="text-sm font-bold">扫描机台合模码 (如: MC-201)</span>
                   </div>
                   <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 active:bg-slate-700 transition-colors">
                     <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-black">2</div>
                     <span className="text-sm font-bold">扫描模具二维码确认安装</span>
                   </div>
                </div>
               )}
            </div>

            <button 
              onClick={onBack}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-2xl active:scale-95 transition-all text-xl mt-4"
            >
              完成并关闭流程
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceFlow;
