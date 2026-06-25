
import React, { useState } from 'react';
import { MOCK_MOLDS, MOCK_WORK_ORDERS } from '../../services/mockData';
import { Mold, MoldStatus, WorkOrder } from '../../types';
import { MAINTENANCE_CONTENTS } from '../../constants';

interface MaintenanceFlowProps {
  onBack: () => void;
}

const MaintenanceFlow: React.FC<MaintenanceFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState<'LIST' | 'SCAN' | 'MAINTAINING' | 'END_DECISION' | 'DESTINATION' | 'FINAL' | 'BUYOFF'>('LIST');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [moldTableNo, setMoldTableNo] = useState('');
  const [sourceType, setSourceType] = useState<'CABINET' | 'MACHINE'>('CABINET');
  const [maintenanceInfo, setMaintenanceInfo] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(true);
  const [destination, setDestination] = useState<'CABINET' | 'MACHINE'>('CABINET');
  // BUYOFF 表单状态
  const [buyoffFormData, setBuyoffFormData] = useState({
    processId: 'PROC-2026-0323',
    nickName: '张三',
    userId: 'U123456',
    findStation: 'mold',
    detailReason: '',
    buyoffReason: '',
    buyoffMethod: '',
    buyoffStandard: '',
    materialType: 'BGA',
    isCustom: 'false',
    customField: '',
    buyoffStatus: '1',
    keyid: `BO-${Date.now()}`,
    moldID: ''
  });
  const [buyoffLoading, setBuyoffLoading] = useState(false);

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

  const handleSource = (type: 'CABINET' | 'MACHINE') => {
    setSourceType(type);
    setStep('MAINTAINING');
  };

  // BUYOFF 提交处理
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
    }, 1500);
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
              <input 
                type="text" 
                placeholder="请扫描模台编号"
                value={moldTableNo}
                onChange={(e) => setMoldTableNo(e.target.value)}
                className="mt-3 w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all text-amber-400"
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
            <div className="bg-purple-600 text-white p-4 rounded-xl flex items-center justify-center gap-3 font-black text-lg shadow-lg animate-pulse border-2 border-purple-400">
              <i className="fas fa-qrcode text-2xl"></i>
              模具安装扫码
              <i className="fas fa-qrcode text-2xl"></i>
            </div>
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
                setBuyoffFormData(prev => ({ ...prev, moldID: selectedMold?.id || '' }));
                setStep('BUYOFF');
              }}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-2xl active:scale-95 transition-all text-xl mt-4"
            >
              完成并关闭流程
            </button>
          </div>
        )}

        {step === 'BUYOFF' && (
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

                {/* 凡工接口数据同步 */}
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

              {/* 凡工接口返回数据展示 */}
              {buyoffFormData.buyoffReason && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-500">
                  <h4 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-200 pb-2">
                    <i className="fas fa-database text-green-500"></i>
                    接口返回数据验证
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-[10px]">
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-slate-500 font-bold uppercase">Buyoff Reason</span>
                      <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffReason}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-slate-500 font-bold uppercase">Buyoff Method</span>
                      <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffMethod}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-slate-500 font-bold uppercase">Buyoff Standard</span>
                      <span className="text-slate-800 font-mono font-bold">{buyoffFormData.buyoffStandard}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-indigo-50 rounded border border-indigo-100">
                      <span className="text-indigo-500 font-bold uppercase">Buyoff Status</span>
                      <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">{buyoffFormData.buyoffStatus}</span>
                    </div>
                  </div>
                  <button 
                    onClick={onBack}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 mt-2"
                  >
                    完成流程并关闭
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceFlow;
