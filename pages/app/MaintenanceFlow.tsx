
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_WORK_ORDERS } from '../../services/mockData';
import { Mold, MoldStatus, WorkOrder } from '../../types';
import { MAINTENANCE_CONTENTS } from '../../constants';

interface MaintenanceFlowProps {
  onBack: () => void;
}

const MaintenanceFlow: React.FC<MaintenanceFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<'LIST' | 'SCAN' | 'SOURCE' | 'MACHINE_CHECK' | 'MAINTAINING' | 'END_DECISION' | 'DESTINATION' | 'FINAL'>('LIST');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [sourceType, setSourceType] = useState<'CABINET' | 'MACHINE'>('CABINET');
  const [maintenanceInfo, setMaintenanceInfo] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(true);
  const [destination, setDestination] = useState<'CABINET' | 'MACHINE'>('CABINET');

  const handleScanMold = (id: string) => {
    const mold = MOCK_MOLDS.find(m => m.id === id);
    if (mold) {
      setSelectedMold(mold);
      // 自动识别取模位置
      setSourceType(mold.machineId ? 'MACHINE' : 'CABINET');
      setStep('SOURCE');
    } else {
      alert(`未识别到模具 ID: ${id}！请使用 Mock 数据中的 ID (如 TY101, QF16)`);
    }
  };

  const handleSource = (type: 'CABINET' | 'MACHINE') => {
    setSourceType(type);
    if (type === 'MACHINE') {
      setStep('MACHINE_CHECK');
    } else {
      setStep('MAINTAINING');
    }
  };

  const handleMachineCapacity = (canProduce: boolean) => {
    if (canProduce) {
      alert("判定结果：设备可继续生产（部分模具拆下）。");
    } else {
      alert("判定结果：进入借机流程（设备无法继续生产）。");
    }
    setStep('MAINTAINING');
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
    if (selectedItems.length === 0 && !maintenanceInfo.trim()) {
      alert("请至少选择一项保养内容或填写作业记录！");
      return;
    }
    setStep('END_DECISION');
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
            </div>
            <button 
              onClick={() => handleScanMold(selectedWorkOrder?.moldId || 'QF16')}
              className="w-full bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              {selectedWorkOrder ? `模拟扫码 ${selectedWorkOrder.moldId}` : '模拟扫码 QF16'}
            </button>
          </div>
        )}

        {step === 'SOURCE' && selectedMold && (
          <div className="space-y-4 pt-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">当前识别</p>
                <h3 className="font-bold text-slate-800 text-lg">{selectedMold.id}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">状态</p>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selectedMold.status}</span>
              </div>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl space-y-4">
              <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider text-center">系统检测到取模位置</h4>
              
              <div className="flex flex-col items-center justify-center py-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg ${
                  sourceType === 'CABINET' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  <i className={`fas ${sourceType === 'CABINET' ? 'fa-warehouse' : 'fa-industry'}`}></i>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-800">
                    {sourceType === 'CABINET' ? '模具柜' : '生产机台'}
                  </p>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    当前位置: <span className="text-amber-600 font-bold">{selectedMold.location}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => handleSource(sourceType)}
                  className="w-full bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                >
                  确认位置并开始取出
                  <i className="fas fa-check-circle"></i>
                </button>
                <button 
                  onClick={() => setStep('SCAN')}
                  className="w-full mt-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  位置有误？重新扫码
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'MACHINE_CHECK' && (
          <div className="space-y-6">
             <div className="bg-slate-900 text-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-lg">
               <h3 className="font-bold mb-4 flex items-center gap-2 text-amber-400">
                 <i className="fas fa-exclamation-triangle"></i>
                 设备生产能力判定
               </h3>
               <div className="space-y-3 text-xs text-slate-400 font-medium">
                 <p className="flex gap-2">1. 仅剩一个模具 {"->"} 强制停机</p>
                 <p className="flex gap-2">2. 全部模具拆除 {"->"} 强制停机</p>
                 <p className="flex gap-2 text-green-400 font-bold">3. 部分拆除且可平衡 {"->"} 可继续生产</p>
               </div>
             </div>
             
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-slate-800 font-black mb-8 text-center text-lg">拆卸后，设备是否可继续生产？</p>
               <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleMachineCapacity(true)} className="py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">是 (还机)</button>
                 <button onClick={() => handleMachineCapacity(false)} className="py-4 bg-red-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">否 (借机流程)</button>
               </div>
             </div>
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
              保养完成并进入下一步
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {step === 'END_DECISION' && (
          <div className="space-y-8 pt-10 text-center">
            <h3 className="text-2xl font-black text-slate-800">保养作业是否已彻底结束？</h3>
            <p className="text-sm text-slate-500 px-6 leading-relaxed">
              若选择“否”，模具暂时放回模具柜但系统状态仍将保持为红色“保养中”
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
               <button 
                  onClick={() => { setIsFinished(true); setStep('DESTINATION'); }}
                  className="p-8 bg-green-600 text-white rounded-3xl shadow-xl flex flex-col items-center gap-4 active:scale-95 transition-transform"
               >
                 <i className="fas fa-check-double text-4xl"></i>
                 <span className="font-bold">是 (保养结束)</span>
               </button>
               <button 
                  onClick={() => { setIsFinished(false); setDestination('CABINET'); setStep('FINAL'); }}
                  className="p-8 bg-slate-200 text-slate-600 rounded-3xl shadow-md flex flex-col items-center gap-4 active:scale-95 transition-transform"
               >
                 <i className="fas fa-pause-circle text-4xl"></i>
                 <span className="font-bold">否 (未完结)</span>
               </button>
            </div>
          </div>
        )}

        {step === 'DESTINATION' && (
          <div className="space-y-6 pt-6">
            <h3 className="text-xl font-black text-slate-800 text-center mb-6">保养完成后，模具去向</h3>
            
            <button 
              onClick={() => { setDestination('CABINET'); setStep('FINAL'); }}
              className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center gap-5 text-left hover:border-green-500 hover:bg-green-50/20 transition-all shadow-sm group"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl group-active:scale-90 transition-transform">
                <i className="fas fa-warehouse"></i>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-lg">放回模具柜</p>
                <p className="text-xs text-slate-400 font-medium">状态将自动转为：[ 正常状态 ]</p>
              </div>
              <i className="fas fa-chevron-right text-slate-300"></i>
            </button>

            <button 
              onClick={() => { setDestination('MACHINE'); setStep('FINAL'); }}
              className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center gap-5 text-left hover:border-purple-500 hover:bg-purple-50/20 transition-all shadow-sm group"
            >
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center text-3xl group-active:scale-90 transition-transform">
                <i className="fas fa-industry"></i>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-lg">回装至生产机台</p>
                <p className="text-xs text-slate-400 font-medium">状态将转为：[ 预 BUYOFF ]</p>
              </div>
              <i className="fas fa-chevron-right text-slate-300"></i>
            </button>
          </div>
        )}

        {step === 'FINAL' && (
          <div className="space-y-6 pt-4">
            {isFinished && destination === 'CABINET' && (
              <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl space-y-3 shadow-inner">
                <h4 className="text-xs font-black text-amber-800 flex items-center gap-2 uppercase tracking-widest">
                  <i className="fas fa-shield-halved text-amber-600"></i>
                  半年 PM 逻辑自动校验提示
                </h4>
                <div className="text-[11px] text-amber-700 space-y-1.5 font-medium italic">
                  <p className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                    回原设备 {"&"} 未错过半年 PM {"->"} 不需二次保养
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                    回原设备 {"&"} 错过半年 PM {"->"} <span className="text-red-600 font-black">警告：系统将重新触发保养</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                    去往其他不同机台 {"->"} <span className="text-red-600 font-black">注意：必须重新触发保养</span>
                  </p>
                </div>
              </div>
            )}

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

            <div className={`p-5 rounded-3xl text-center font-black shadow-xl border-2 flex flex-col gap-1 ${
              !isFinished ? 'bg-red-50 text-red-700 border-red-200' : 
              destination === 'CABINET' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              <span className="text-[10px] uppercase opacity-50 tracking-widest">流程执行结果</span>
              <span className="text-lg">
                系统动作：{!isFinished ? '状态保持 [保养中]' : destination === 'CABINET' ? '转为 [正常状态]' : '转为 [预 BUYOFF]'}
              </span>
            </div>

            <button 
              onClick={() => {
                alert(`保养流程执行完毕！数据已实时同步至后台，模具已归位至：${destination === 'CABINET' ? '模具柜' : '生产机台'}。`);
                onBack();
              }}
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
