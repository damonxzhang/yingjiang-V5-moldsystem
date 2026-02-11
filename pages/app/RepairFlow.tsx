
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_WORK_ORDERS } from '../../services/mockData';
import { Mold, MoldStatus, WorkOrder } from '../../types';
import { REPAIR_CONTENTS } from '../../constants';

interface RepairFlowProps {
  onBack: () => void;
}

const RepairFlow: React.FC<RepairFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<'LIST' | 'SCAN' | 'SOURCE' | 'MACHINE_CHECK' | 'REPAIRING' | 'END_DECISION' | 'DESTINATION' | 'FINAL'>('LIST');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [sourceType, setSourceType] = useState<'CABINET' | 'MACHINE'>('CABINET');
  const [repairInfo, setRepairInfo] = useState('');
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
      alert(`未识别到模具 ID: ${id}！请使用 Mock 数据中的 ID (如 TY101, TY71)`);
    }
  };

  const handleSource = (type: 'CABINET' | 'MACHINE') => {
    setSourceType(type);
    if (type === 'MACHINE') {
      setStep('MACHINE_CHECK');
    } else {
      setStep('REPAIRING');
    }
  };

  const handleMachineCapacity = (canProduce: boolean) => {
    if (canProduce) {
      alert("状态：还机成功。设备可继续生产其他模具。");
    } else {
      alert("状态：进入借机流程。设备已停机。");
    }
    setStep('REPAIRING');
  };

  const toggleRepairItem = (item: string) => {
    const newItems = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    setSelectedItems(newItems);
    
    // 自动更新文本框内容，方便用户补充
    const autoText = newItems.length > 0 ? `维修项目：\n${newItems.join('\n')}\n\n补充说明：` : '';
    setRepairInfo(autoText);
  };

  const handleCompleteRepair = () => {
    if (selectedItems.length === 0 && !repairInfo.trim()) {
      alert("请选择维修内容或填写维修信息！");
      return;
    }
    setStep('END_DECISION');
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">模具维修执行流程</h2>
      </div>

      <div className="flex-1 p-4">
        {step === 'LIST' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">待维修任务列表</h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {MOCK_WORK_ORDERS.filter(wo => wo.type === 'REPAIR' && wo.status === 'PENDING').length} 项待办
              </span>
            </div>
            {MOCK_WORK_ORDERS.filter(wo => wo.type === 'REPAIR' && wo.status === 'PENDING').map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedWorkOrder(order);
                  setStep('SCAN');
                }}
                className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <i className="fas fa-wrench"></i>
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
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                <i className="fas fa-qrcode text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">扫描模具二维码</h3>
              <p className="text-slate-400 text-sm">请对准模具上的标识码进行扫描</p>
              <input 
                type="text" 
                placeholder={selectedWorkOrder ? `请扫描模具 ${selectedWorkOrder.moldId}` : "或手动输入模具编号 (TY71)"}
                onKeyDown={(e) => e.key === 'Enter' && handleScanMold((e.target as HTMLInputElement).value)}
                className="mt-8 w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={() => handleScanMold(selectedWorkOrder?.moldId || 'TY71')}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              {selectedWorkOrder ? `模拟扫码 ${selectedWorkOrder.moldId}` : '模拟扫码 TY71'}
            </button>
          </div>
        )}

        {step === 'SOURCE' && selectedMold && (
          <div className="space-y-4 pt-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">当前识别</p>
              <h3 className="font-bold text-slate-800">{selectedMold.id} - {selectedMold.name}</h3>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-3xl space-y-4">
              <h4 className="text-sm font-black text-blue-800 uppercase tracking-wider text-center">系统检测到取模位置</h4>
              
              <div className="flex flex-col items-center justify-center py-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg ${
                  sourceType === 'CABINET' ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <i className={`fas ${sourceType === 'CABINET' ? 'fa-archive' : 'fa-industry'}`}></i>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-800">
                    {sourceType === 'CABINET' ? '模具柜' : '生产机台'}
                  </p>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    当前位置: <span className="text-blue-600 font-bold">{selectedMold.location}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => handleSource(sourceType)}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
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
             <div className="bg-slate-900 text-white p-6 rounded-2xl">
               <h3 className="font-bold mb-4 flex items-center gap-2">
                 <i className="fas fa-clipboard-check text-blue-400"></i>
                 拆下模具后，设备生产判定
               </h3>
               <div className="space-y-3 text-xs text-slate-400">
                 <p className="flex gap-2"><span className="text-blue-500">1.</span> 设备上只有一个模具 {"--"} 不能生产</p>
                 <p className="flex gap-2"><span className="text-blue-500">2.</span> 设备上模具全部拆下 {"--"} 不能生产</p>
                 <p className="flex gap-2"><span className="text-blue-500">3.</span> 设备上模具部分拆下 {"--"} 可以生产</p>
               </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-slate-700 font-bold mb-6 text-center">该机台是否可以继续生产？</p>
               <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => handleMachineCapacity(true)}
                    className="py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
                  >
                   是 (还机)
                 </button>
                 <button 
                    onClick={() => handleMachineCapacity(false)}
                    className="py-4 bg-red-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
                  >
                   否 (停机流程)
                 </button>
               </div>
             </div>
          </div>
        )}

        {step === 'REPAIRING' && (
          <div className="space-y-6">
            <div className="bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold animate-pulse shadow-lg shadow-red-200">
              <i className="fas fa-wrench"></i>
              状态已转为：维修中
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <i className="fas fa-list-check text-indigo-500"></i>
                    选择维修内容
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 p-2 grid grid-cols-1 gap-1">
                    {REPAIR_CONTENTS.map(item => (
                      <button
                        key={item}
                        onClick={() => toggleRepairItem(item)}
                        className={`text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          selectedItems.includes(item) ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-100'
                        }`}
                      >
                        {item}
                        {selectedItems.includes(item) && <i className="fas fa-check"></i>}
                      </button>
                    ))}
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">详细维修信息/备注</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="请补充维修措施、更换的配件编号等信息..."
                    value={repairInfo}
                    onChange={e => setRepairInfo(e.target.value)}
                  ></textarea>
               </div>
               
               <div className="flex gap-2">
                 <button className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200">
                   <i className="fas fa-camera"></i>
                   拍摄维修照片
                 </button>
                 <button className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200">
                   <i className="fas fa-barcode"></i>
                   扫码领配件
                 </button>
               </div>
            </div>

            <button 
              onClick={handleCompleteRepair}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              提交维修记录并下一步
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {step === 'END_DECISION' && (
          <div className="space-y-6 pt-10 text-center">
            <h3 className="text-xl font-bold text-slate-800">维修作业是否已彻底结束？</h3>
            <p className="text-sm text-slate-500 px-10 leading-relaxed">
              若选择“否”，模具放回仓库后状态仍保持为“维修中”，等待后续继续处理。
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-6">
               <button 
                  onClick={() => { setIsFinished(true); setStep('DESTINATION'); }}
                  className="p-8 bg-blue-600 text-white rounded-2xl shadow-xl flex flex-col items-center gap-4 active:scale-95 transition-transform"
               >
                 <i className="fas fa-check-double text-3xl"></i>
                 <span className="font-bold">是 (维修结束)</span>
               </button>
               <button 
                  onClick={() => { setIsFinished(false); setDestination('CABINET'); setStep('FINAL'); }}
                  className="p-8 bg-slate-200 text-slate-600 rounded-2xl shadow-md flex flex-col items-center gap-4 active:scale-95 transition-transform"
               >
                 <i className="fas fa-hourglass-half text-3xl"></i>
                 <span className="font-bold">否 (未完结)</span>
               </button>
            </div>
          </div>
        )}

        {step === 'DESTINATION' && (
          <div className="space-y-6 pt-10">
            <h3 className="text-lg font-bold text-slate-800 text-center mb-8">请选择模具归位去向</h3>
            <div className="space-y-4">
              <button 
                onClick={() => { setDestination('CABINET'); setStep('FINAL'); }}
                className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-all text-left shadow-sm"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-archive"></i>
                </div>
                <div className="flex-1">
                  <p className="font-bold">存放至模具柜</p>
                  <p className="text-[10px] text-slate-400">系统状态将转为：待 BUYOFF</p>
                </div>
                <i className="fas fa-chevron-right text-slate-300"></i>
              </button>

              <button 
                onClick={() => { setDestination('MACHINE'); setStep('FINAL'); }}
                className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-all text-left shadow-sm"
              >
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-industry"></i>
                </div>
                <div className="flex-1">
                  <p className="font-bold">直接回装机台</p>
                  <p className="text-[10px] text-slate-400">系统状态将转为：预 BUYOFF</p>
                </div>
                <i className="fas fa-chevron-right text-slate-300"></i>
              </button>
            </div>
          </div>
        )}

        {step === 'FINAL' && (
          <div className="space-y-8 pt-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border-t-4 border-blue-500">
               <p className="text-xs text-slate-400 border-b border-slate-800 pb-2 uppercase tracking-widest font-bold italic">位置绑定与扫码确认</p>
               {destination === 'CABINET' ? (
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 group active:bg-slate-700 transition-colors">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span className="text-sm font-medium">扫描模具柜位置码 (如: A1-02)</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 group active:bg-slate-700 transition-colors">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span className="text-sm font-medium">扫描模具二维码确认归位</span>
                    </div>
                 </div>
               ) : (
                <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 group active:bg-slate-700 transition-colors">
                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                     <span className="text-sm font-medium">扫描机台合模码 (如: MC-101)</span>
                   </div>
                   <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 group active:bg-slate-700 transition-colors">
                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                     <span className="text-sm font-medium">扫描模具二维码确认回装</span>
                   </div>
                </div>
               )}
            </div>

            <div className={`p-5 rounded-2xl text-center font-black shadow-lg border-2 flex flex-col gap-1 ${
              !isFinished ? 'bg-red-50 text-red-700 border-red-200' : 
              destination === 'CABINET' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              <span className="text-[10px] uppercase opacity-60">流程最终状态同步</span>
              <span className="text-lg">
                {!isFinished ? '状态保持：维修中' : 
                 destination === 'CABINET' ? '状态更新：待 BUYOFF' : '状态更新：预 BUYOFF'}
              </span>
            </div>

            <button 
              onClick={() => {
                alert(`维修流程已完结！模具已成功${destination === 'CABINET' ? '归库' : '回装'}。数据已同步至管理后台。`);
                onBack();
              }}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
            >
              确认并提交执行记录
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairFlow;
