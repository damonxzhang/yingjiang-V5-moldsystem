
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { Mold, BuyoffStatus, MoldStatus } from '../../types';

interface TransferFlowProps {
  onBack: () => void;
}

const TransferFlow: React.FC<TransferFlowProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'SELECT' | 'REMOVE' | 'INSTALL'>('SELECT');
  const [step, setStep] = useState(0);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [shotCount, setShotCount] = useState<string>('');
  const [buyoffLoading, setBuyoffLoading] = useState(false);

  // BUYOFF 表单数据
  const [buyoffFormData, setBuyoffFormData] = useState({
    processId: 'PROC-2026-0323', // 固定不变
    nickName: '张三', // 模拟当前登录人
    userId: 'U123456', // 模拟 onebe 的 userid
    findStation: 'mold', // 固定不变
    detailReason: '',
    buyoffReason: '', // 凡工接口返回
    buyoffMethod: '', // 凡工接口返回
    buyoffStandard: '', // 凡工接口返回
    materialType: 'BGA',
    isCustom: 'false',
    customField: '', // 如果 isCustom 为 true 时的额外字段
    buyoffStatus: '1', // 固定为 1
    keyid: `BO-${Date.now()}`, // 唯一编号
    moldID: '' // 模具编号
  });

  // 模拟生产提出的待处理模具清单
  const pendingTasks = [
    { type: 'REMOVE', moldId: 'TY71', name: 'QFN-64 上模', reason: '达到保养冲次', machine: 'MC-102' },
    { type: 'INSTALL', moldId: 'TY101', name: 'QFN-64 新模', reason: '生产计划变更', target: 'MC-102' }
  ];

  const handleScanMold = (id: string) => {
    const mold = MOCK_MOLDS.find(m => m.id === id);
    if (mold) {
      setSelectedMold(mold);
      setShotCount(mold.shotTotal.toString());
      setBuyoffFormData(prev => ({ ...prev, moldID: id })); // 同步模具 ID
      setStep(1);
    } else {
      alert(`未识别到模具 ID: ${id}！请使用 Mock 数据中的 ID (如 TY101, TY71)`);
    }
  };

  const handleBuyoffSubmit = () => {
    setBuyoffLoading(true);
    // 模拟调用凡工接口获取数据
    setTimeout(() => {
      setBuyoffFormData(prev => ({
        ...prev,
        buyoffReason: '外部验证通过',
        buyoffMethod: '自动探测',
        buyoffStandard: 'STD-V2.0'
      }));
      setBuyoffLoading(false);
      nextStep();
    }, 1500);
  };

  const nextStep = () => setStep(s => s + 1);

  // ----------------- 拆下流程步骤 -----------------
  const renderRemoveFlow = () => {
    switch(step) {
      case 0: return (
        <div className="space-y-6 pt-10 text-center">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl flex flex-col items-center">
             <i className="fas fa-qrcode text-4xl mb-4 text-blue-400"></i>
             <h3 className="text-xl font-bold">第1步：扫模具码</h3>
             <input 
               type="text" 
               placeholder="输入模具 ID (TY71)"
               onKeyDown={(e) => e.key === 'Enter' && handleScanMold((e.target as HTMLInputElement).value)}
               className="mt-6 w-full bg-slate-800 border-none rounded-xl p-4 text-center text-blue-400 font-mono"
             />
          </div>
          <button onClick={() => handleScanMold('TY71')} className="text-blue-600 font-bold text-sm underline">模拟扫码 TY71</button>
        </div>
      );
      case 1: return (
        <div className="space-y-6 pt-10 text-center">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl flex flex-col items-center">
             <i className="fas fa-industry text-4xl mb-4 text-amber-400"></i>
             <h3 className="text-xl font-bold">第2步：扫机台码</h3>
             <p className="text-xs text-slate-400 mt-2">确认模具当前所在机台 (MC-102)</p>
             <input type="text" value="MC-102" disabled className="mt-6 w-full bg-slate-800 border-none rounded-xl p-4 text-center text-amber-400" />
          </div>
          <button onClick={nextStep} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">确认拆下模具</button>
        </div>
      );
      case 2: return (
        <div className="space-y-6">
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl">
             <div className="flex items-center gap-3 text-red-700 font-bold mb-4">
               <i className="fas fa-unlink text-xl"></i>
               <h3>模具和机台已解绑</h3>
             </div>
             <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg animate-pulse mb-4">
               <i className="fas fa-exclamation-circle mr-2"></i>
               系统强制触发模具保养任务
             </div>
             
             {/* 手动输入 Shot Count */}
             <div className="bg-white/10 p-4 rounded-xl mb-4 border border-red-200/30">
               <label className="block text-[10px] font-black text-red-200 uppercase tracking-widest mb-2 text-left">
                 确认当前 Shot Count (末次生产读数)
               </label>
               <div className="relative">
                 <input 
                   type="number" 
                   value={shotCount}
                   onChange={(e) => setShotCount(e.target.value)}
                   className="w-full bg-white border-2 border-red-100 rounded-xl px-4 py-3 text-lg font-black text-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-inner"
                   placeholder="请输入当前累计冲次..."
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                   Shots
                 </div>
               </div>
               <p className="text-[9px] text-red-300 mt-2 text-left italic">
                 * 此数值将作为保养任务的起始参考基准
               </p>
               <div className="mt-3 pt-3 border-t border-red-200/20 flex flex-col gap-1.5">
                 <p className="text-[8px] font-black text-red-200/60 uppercase tracking-tighter">
                   <i className="fas fa-network-wired mr-1"></i>
                   Data Integration Mode (Development Note)
                 </p>
                 <div className="flex gap-2">
                   <span className="bg-red-900/30 text-red-200 text-[8px] px-2 py-0.5 rounded border border-red-200/20">SOCKET.IO</span>
                   <span className="bg-red-900/30 text-red-200 text-[8px] px-2 py-0.5 rounded border border-red-200/20">RESTful API</span>
                 </div>
                 <p className="text-[9px] text-red-300/80 italic leading-tight">
                   需要同时准备 Socket 实时推送和 API 轮询/回调两种方式接收冲次数据
                 </p>
               </div>
             </div>

             <p className="text-xs text-red-600 leading-relaxed italic">
               * 规则：模具拆下入柜或不同机器间互换，强制触发保养，避免由于保养随设备走使模具保养超出周期。
             </p>
          </div>
          <div className="bg-green-600 text-white p-4 rounded-xl text-center font-bold">
            状态转为：backup
          </div>
          <button 
            onClick={() => {
              alert(`模具 ${selectedMold?.id} 已成功解绑并同步冲次 (${shotCount})！\n由于系统规则，现在将跳转至保养执行流程。`);
              onBack(); // 这里模拟跳转回主菜单或直接结束流程
            }} 
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-tools"></i>
            去保养
          </button>
        </div>
      );
      case 3: return (
        <div className="space-y-6 pt-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
             <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
               <i className="fas fa-warehouse text-blue-400"></i>
               <h3 className="font-bold">最终步骤：扫模具柜码</h3>
             </div>
             <p className="text-xs text-slate-400">请对准模具柜存放位二维码进行扫描</p>
             <input type="text" placeholder="扫描位置码 (A1-02)" className="w-full bg-slate-800 rounded-xl p-4 text-center" />
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-700 text-xs text-center font-bold">
            动作：模具和模具柜位置绑定成功
          </div>
          <button onClick={() => { alert("拆下流程已完结！"); onBack(); }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">完成流程</button>
        </div>
      );
      default: return null;
    }
  };

  // ----------------- 安装流程步骤 -----------------
  const renderInstallFlow = () => {
    switch(step) {
      case 0: return (
        <div className="space-y-6 pt-10 text-center">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl flex flex-col items-center">
             <i className="fas fa-qrcode text-4xl mb-4 text-green-400"></i>
             <h3 className="text-xl font-bold">第1步：扫模具码</h3>
             <input 
               type="text" 
               placeholder="输入模具 ID (TY101)"
               onKeyDown={(e) => e.key === 'Enter' && handleScanMold((e.target as HTMLInputElement).value)}
               className="mt-6 w-full bg-slate-800 border-none rounded-xl p-4 text-center text-green-400 font-mono"
             />
          </div>
          <button onClick={() => handleScanMold('TY101')} className="text-green-600 font-bold text-sm underline">模拟扫码 TY101</button>
        </div>
      );
      case 1: return (
        <div className="space-y-6 pt-10 text-center">
          <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl flex flex-col items-center">
             <i className="fas fa-archive text-4xl mb-4 text-blue-400"></i>
             <h3 className="text-xl font-bold">第2步：扫模具柜码</h3>
             <p className="text-xs text-slate-400 mt-2">确认取出模具的位置 (A1-02)</p>
             <input type="text" value="A1-02" disabled className="mt-6 w-full bg-slate-800 border-none rounded-xl p-4 text-center text-blue-400" />
          </div>
          <div className="bg-blue-100 text-blue-700 p-3 rounded-lg text-xs font-bold">
            动作：模具和模具柜位置解绑
          </div>
          <button onClick={nextStep} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">取出模具并下一步</button>
        </div>
      );
      case 2: return (
        <div className="space-y-6 pt-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
             <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
               <i className="fas fa-industry text-amber-400"></i>
               <h3 className="font-bold">第3步：扫机台合模码</h3>
             </div>
             <p className="text-xs text-slate-400">请对准目标安装机台二维码</p>
             <input type="text" placeholder="扫描机台码 (MC-201)" className="w-full bg-slate-800 rounded-xl p-4 text-center" />
          </div>
          <div className="bg-indigo-600 text-white p-4 rounded-xl text-center font-bold shadow-lg">
            动作：模具和机台位置绑定成功
          </div>
          <button onClick={nextStep} className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold shadow-lg">下一步：状态验证</button>
        </div>
      );
      case 3: return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pb-6">
          <div className="bg-purple-600 text-white p-4 rounded-2xl shadow-xl text-center font-bold sticky top-0 z-10">
            状态转为 BUYOFF
          </div>
          
          <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-edit text-indigo-500"></i>
                BUYOFF 信息录入
              </h4>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                【只给小材料部门使用】
              </span>
            </div>

            {/* 只读字段 */}
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase">Process ID</label>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 font-mono">{buyoffFormData.processId}</div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase">User ID</label>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 font-mono">{buyoffFormData.userId}</div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase">Nick Name</label>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">{buyoffFormData.nickName}</div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase">Station</label>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 font-mono">{buyoffFormData.findStation}</div>
              </div>
            </div>

            {/* 输入字段 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Detail Reason (手动输入)</label>
                <textarea 
                  value={buyoffFormData.detailReason}
                  onChange={(e) => setBuyoffFormData(prev => ({ ...prev, detailReason: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="请输入详细原因..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Material Type</label>
                  <select 
                    value={buyoffFormData.materialType}
                    onChange={(e) => setBuyoffFormData(prev => ({ ...prev, materialType: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    {['BGA', 'QFN', 'PQFN', 'FCCSP'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Is Custom</label>
                  <select 
                    value={buyoffFormData.isCustom}
                    onChange={(e) => setBuyoffFormData(prev => ({ ...prev, isCustom: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                </div>
              </div>

              {buyoffFormData.isCustom === 'true' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-slate-700 text-indigo-600">Custom Info (自定义字段)</label>
                  <input 
                    type="text" 
                    value={buyoffFormData.customField}
                    onChange={(e) => setBuyoffFormData(prev => ({ ...prev, customField: e.target.value }))}
                    className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="请输入自定义信息..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase">Key ID (唯一编号)</label>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 font-mono truncate">{buyoffFormData.keyid}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase">Mold ID</label>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 font-mono">{buyoffFormData.moldID}</div>
                </div>
              </div>

              {/* 新增三个调用凡工接口的字段 */}
              <div className="pt-2 space-y-2 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                  <i className="fas fa-plug animate-pulse"></i>
                  凡工接口数据同步
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-dashed border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Buyoff Reason</span>
                    <span className={`text-[10px] font-mono ${buyoffFormData.buyoffReason ? 'text-indigo-600 font-bold' : 'text-slate-300 italic'}`}>
                      {buyoffFormData.buyoffReason || '等待接口返回...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-dashed border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Buyoff Method</span>
                    <span className={`text-[10px] font-mono ${buyoffFormData.buyoffMethod ? 'text-indigo-600 font-bold' : 'text-slate-300 italic'}`}>
                      {buyoffFormData.buyoffMethod || '等待接口返回...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-dashed border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Buyoff Standard</span>
                    <span className={`text-[10px] font-mono ${buyoffFormData.buyoffStandard ? 'text-indigo-600 font-bold' : 'text-slate-300 italic'}`}>
                      {buyoffFormData.buyoffStandard || '等待接口返回...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleBuyoffSubmit}
                disabled={buyoffLoading}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${buyoffLoading ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {buyoffLoading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    正在调用凡工接口...
                  </>
                ) : (
                  <>
                    <i className="fas fa-satellite-dish"></i>
                    执行 BUYOFF 状态确认
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6 pt-4">
           <div className="bg-green-500 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto shadow-xl shadow-green-100 animate-bounce">
             <i className="fas fa-check"></i>
           </div>
           <div className="space-y-1 text-center">
             <h3 className="text-xl font-bold text-slate-800">等待buyoff结果</h3>
             <p className="text-xs text-slate-500">模具状态正式转为：正常</p>
           </div>

           {/* 展示凡工接口返回的数据 */}
           <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
               <i className="fas fa-database text-green-500"></i>
               接口返回数据验证
             </h4>
             <div className="grid grid-cols-1 gap-2 text-[10px]">
               <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                 <span className="text-slate-500 font-bold uppercase">Buyoff Reason</span>
                 <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffReason}</span>
               </div>
               <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                 <span className="text-slate-500 font-bold uppercase">Buyoff Method</span>
                 <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffMethod}</span>
               </div>
               <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                 <span className="text-slate-500 font-bold uppercase">Buyoff Standard</span>
                 <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffStandard}</span>
               </div>
               <div className="flex justify-between items-center p-2 bg-indigo-50 rounded border border-indigo-100">
                 <span className="text-indigo-500 font-bold uppercase">Buyoff Status</span>
                 <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">{buyoffFormData.buyoffStatus}</span>
               </div>
             </div>
           </div>

           <button onClick={() => { alert("安装及状态同步成功！"); onBack(); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95">完成流程并关闭</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">模具转换流程</h2>
        {mode !== 'SELECT' && (
          <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold ${mode === 'REMOVE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {mode === 'REMOVE' ? '正在拆下' : '正在安装'}
          </span>
        )}
      </div>

      <div className="flex-1 p-4">
        {mode === 'SELECT' && (
          <div className="space-y-6 pt-4">
            {/* 待处理模具清单移到顶部 */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-clipboard-list text-indigo-500"></i>
                生产下发：待处理模具清单
              </h4>
              <div className="space-y-3">
                {pendingTasks.map((task, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      setMode(task.type as any);
                      handleScanMold(task.moldId);
                    }}
                    className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        task.type === 'REMOVE' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                      }`}>
                        <i className={`fas ${task.type === 'REMOVE' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">{task.moldId}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            task.type === 'REMOVE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {task.type === 'REMOVE' ? '待拆下' : '待安装'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{task.name} · {task.reason}</p>
                        <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase">
                          <i className="fas fa-microchip mr-1"></i>
                          {task.type === 'REMOVE' ? `当前机台: ${task.machine}` : `目标机台: ${task.target}`}
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">或者手动选择</span>
            </div>

            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">请选择当前作业类型</h3>
            <div className="grid grid-cols-2 gap-6">
               <button 
                  onClick={() => setMode('INSTALL')}
                  className="p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all hover:border-green-500"
               >
                 <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-3xl">
                   <i className="fas fa-arrow-up"></i>
                 </div>
                 <span className="font-bold text-slate-700">模具安装</span>
               </button>
               <button 
                  onClick={() => setMode('REMOVE')}
                  className="p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all hover:border-red-500"
               >
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl">
                   <i className="fas fa-arrow-down"></i>
                 </div>
                 <span className="font-bold text-slate-700">模具拆下</span>
               </button>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl">
               <p className="text-xs text-blue-800 leading-relaxed italic">
                 <i className="fas fa-info-circle mr-2"></i>
                 提示：若进行模具互换，请先执行“拆下”流程将旧模具归入 backup，再执行“安装”流程安装新模具。
               </p>
            </div>
          </div>
        )}

        {mode === 'REMOVE' && renderRemoveFlow()}
        {mode === 'INSTALL' && renderInstallFlow()}
      </div>
    </div>
  );
};

export default TransferFlow;
