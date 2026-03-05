
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';

// 定义流程步骤
type WorkflowStep = 'APPROVING' | 'OPERATING' | 'RECORDING' | 'FINAL_CONFIRM' | 'CLOSED';

interface RepairOrder {
  id: string;
  moldId: string;
  currentStep: WorkflowStep;
  faultDescription: string;
  repairType: 'NORMAL' | 'URGENT' | 'EXTERNAL';
  repairCategory?: string; // 维修类别
  repairMethod?: string; // 维修方式
  rootCause?: string; // 故障原因
  buyoffBy?: string; // 验收人
  scheduledStartTime: string;
  scheduledEndTime: string;
  approvals: {
    production: { status: 'PENDING' | 'PASS' | 'FAIL'; adjusted: boolean };
    equipment: { status: 'PENDING' | 'PASS' | 'FAIL' };
    product: { status: 'PENDING' | 'PASS' | 'FAIL' };
  };
  operatorNotes: string;
  needBuyoff: boolean;
}

const INITIAL_ORDERS: RepairOrder[] = [
  {
    id: 'RP-20240520-001',
    moldId: 'MD-2024-001',
    currentStep: 'APPROVING',
    faultDescription: '型腔表面划伤，影响产品外观。',
    repairType: 'URGENT',
    repairCategory: '中修',
    repairMethod: '内部维修',
    rootCause: '异物挤压',
    buyoffBy: '李工',
    scheduledStartTime: '2024-05-21 08:30',
    scheduledEndTime: '2024-05-21 12:00',
    approvals: { 
      production: { status: 'PENDING', adjusted: false }, 
      equipment: { status: 'PENDING' }, 
      product: { status: 'PENDING' } 
    },
    needBuyoff: true,
    operatorNotes: ''
  },
  {
    id: 'RP-20240520-002',
    moldId: 'MD-2024-071',
    currentStep: 'OPERATING',
    faultDescription: '顶针断裂，需要更换。',
    repairType: 'NORMAL',
    repairCategory: '小修',
    repairMethod: '更换备件',
    rootCause: '顶针自然疲劳断裂',
    buyoffBy: '陈工',
    scheduledStartTime: '2024-05-20 14:00',
    scheduledEndTime: '2024-05-20 16:30',
    approvals: { 
      production: { status: 'PASS', adjusted: true }, 
      equipment: { status: 'PASS' }, 
      product: { status: 'PASS' } 
    },
    needBuyoff: false,
    operatorNotes: '已拆卸模具，正在准备更换顶针。'
  }
];

const RepairCenter: React.FC = () => {
  const [orders, setOrders] = useState<RepairOrder[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  const updateOrder = (updated: RepairOrder) => {
    setOrders(orders.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  };

  const handleApprove = (role: keyof RepairOrder['approvals'], status: 'PASS' | 'FAIL') => {
    if (!selectedOrder) return;
    const updated = JSON.parse(JSON.stringify(selectedOrder)) as RepairOrder;
    
    if (role === 'production') {
      updated.approvals.production.status = status;
    } else {
      (updated.approvals[role] as any).status = status;
    }
    
    // 逻辑：三方全部通过则自动进入下一阶段
    if (updated.approvals.production.status === 'PASS' && 
        updated.approvals.equipment.status === 'PASS' && 
        updated.approvals.product.status === 'PASS') {
      updated.currentStep = 'OPERATING';
    }
    updateOrder(updated);
  };

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    if (!selectedOrder) return;
    const updated = { ...selectedOrder };
    if (field === 'start') updated.scheduledStartTime = value;
    else updated.scheduledEndTime = value;
    updated.approvals.production.adjusted = true;
    updateOrder(updated);
  };

  const handleCreateOrder = () => {
    const randomMold = MOCK_MOLDS[Math.floor(Math.random() * MOCK_MOLDS.length)];
    const newId = `RP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: RepairOrder = {
      id: newId,
      moldId: randomMold.id,
      currentStep: 'APPROVING',
      faultDescription: '现场报修：模具动作异常，需拆机检查。',
      repairType: 'NORMAL',
      scheduledStartTime: '2024-05-25 09:00',
      scheduledEndTime: '2024-05-25 12:00',
      approvals: {
        production: { status: 'PENDING', adjusted: false },
        equipment: { status: 'PENDING' },
        product: { status: 'PENDING' }
      },
      needBuyoff: true,
      operatorNotes: ''
    };
    setOrders([newOrder, ...orders]);
    setSelectedOrder(newOrder);
  };

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-120px)] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
      
      {/* 1. 左侧列表区 - 高级侧边导航 */}
      <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 text-sm tracking-tighter uppercase">维修任务列表</h3>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {orders.length}
            </span>
          </div>
          <button 
            onClick={handleCreateOrder}
            className="w-full bg-red-900 hover:bg-red-800 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus-circle"></i>
            发起维修流程
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-6 border-b border-slate-50 cursor-pointer transition-all ${
                selectedOrder?.id === order.id ? 'bg-red-50/50 border-l-4 border-l-red-600 shadow-inner' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-black text-sm tracking-tight ${selectedOrder?.id === order.id ? 'text-red-900' : 'text-slate-800'}`}>
                  {order.id}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                  order.currentStep === 'APPROVING' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                }`}>
                  {order.currentStep}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-microchip text-[10px] text-slate-400"></i>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Die: {order.moldId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                  order.repairType === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {order.repairType}
                </span>
                <p className="text-[10px] text-slate-400 truncate flex-1 font-medium">{order.faultDescription}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 右侧详情区 - 指挥台布局 */}
      <div className="flex-1 overflow-y-auto bg-white/40 p-8 space-y-8 backdrop-blur-sm">
        {selectedOrder ? (
          <>
            {/* 步骤条组件 - 极简工业风格 */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <i className="fas fa-tools text-8xl"></i>
              </div>
              <div className="flex items-center justify-between relative z-10">
                {['维修审批', '故障排除', '结果验证', '完成还机'].map((label, idx) => {
                  const steps: WorkflowStep[] = ['APPROVING', 'OPERATING', 'RECORDING', 'FINAL_CONFIRM', 'CLOSED'];
                  const activeIdx = steps.indexOf(selectedOrder.currentStep);
                  const isCompleted = idx < activeIdx;
                  const isActive = idx === activeIdx;

                  return (
                    <div key={label} className="flex flex-col items-center flex-1 relative group">
                      <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all duration-500 ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 
                        isActive ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100 scale-110' : 
                        'bg-white border-slate-200 text-slate-300'
                      }`}>
                        {isCompleted ? <i className="fas fa-check"></i> : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-4 font-black uppercase tracking-widest transition-colors ${
                        isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                      }`}>{label}</span>
                      
                      {idx < 3 && (
                        <div className={`absolute top-6 left-[60%] w-[80%] h-[2px] rounded-full transition-all duration-700 ${
                          idx < activeIdx ? 'bg-green-500' : 'bg-slate-100'
                        }`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 第一块：三方审批栏 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* 1.1 生产工程师 */}
              <div className={`xl:col-span-1 rounded-[2.5rem] p-8 border-2 transition-all ${
                selectedOrder.approvals.production.status === 'PASS' 
                  ? 'bg-green-50/30 border-green-100' 
                  : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">生产工程师 (停机调度)</h4>
                  {selectedOrder.approvals.production.status === 'PASS' && (
                    <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Approved</span>
                  )}
                </div>
                
                <div className="space-y-4 mb-8">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase">故障描述 <span>Fault Description</span></label>
                     <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700">
                       {selectedOrder.faultDescription}
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase flex justify-between">
                       预计开始时间 <span>Estimated Start</span>
                     </label>
                     <input 
                       type="text" 
                       disabled={selectedOrder.approvals.production.status === 'PASS'}
                       value={selectedOrder.scheduledStartTime}
                       onChange={(e) => handleTimeChange('start', e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all disabled:opacity-60"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase flex justify-between">
                       预计结束时间 <span>Estimated End</span>
                     </label>
                     <input 
                       type="text" 
                       disabled={selectedOrder.approvals.production.status === 'PASS'}
                       value={selectedOrder.scheduledEndTime}
                       onChange={(e) => handleTimeChange('end', e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all disabled:opacity-60"
                     />
                   </div>
                </div>

                <div className="flex gap-2">
                  {selectedOrder.approvals.production.status === 'PENDING' ? (
                    <>
                      <button 
                        onClick={() => handleApprove('production', 'PASS')} 
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 transition-all active:scale-95"
                      >
                        确认停机维修
                      </button>
                      <button 
                        onClick={() => handleApprove('production', 'FAIL')} 
                        className="px-6 border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 py-3 rounded-2xl text-[10px] font-black uppercase transition-all"
                      >
                        驳回报修
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        const updated = {...selectedOrder};
                        updated.approvals.production.status = 'PENDING';
                        updateOrder(updated);
                      }}
                      className="w-full py-3 text-[10px] font-black uppercase text-red-600 bg-red-50 rounded-2xl transition-all hover:bg-red-100"
                    >
                      重新调整计划
                    </button>
                  )}
                </div>
              </div>

              {/* 1.2 设备与产品工程师 */}
              <div className="xl:col-span-2 grid grid-cols-2 gap-6">
                {[
                  { role: 'equipment' as const, label: '模具工程师', sub: '维修方案确认' },
                  { role: 'product' as const, label: '品质工程师', sub: '受影响产品风险评估' }
                ].map(item => (
                  <div key={item.role} className={`rounded-[2.5rem] p-8 border-2 transition-all flex flex-col justify-between ${
                    selectedOrder.approvals[item.role].status === 'PASS' 
                      ? 'bg-green-50/30 border-green-100' 
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</h4>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-6">{item.sub}</p>
                      
                      {selectedOrder.approvals[item.role].status === 'PENDING' ? (
                        <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-center text-[11px] font-bold text-slate-400 leading-relaxed mb-6">
                          等待生产工程师<br/>确认停机窗口
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mb-8 text-green-600 animate-in slide-in-from-left duration-500">
                          <i className="fas fa-check-circle text-2xl"></i>
                          <div className="text-left">
                            <p className="text-sm font-black">方案已确认</p>
                            <p className="text-[9px] font-bold opacity-70">2024-05-20 10:15</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedOrder.approvals[item.role].status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button 
                          disabled={selectedOrder.approvals.production.status !== 'PASS'}
                          onClick={() => handleApprove(item.role, 'PASS')} 
                          className="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale"
                        >
                          确认审批
                        </button>
                        <button 
                          disabled={selectedOrder.approvals.production.status !== 'PASS'}
                          onClick={() => handleApprove(item.role, 'FAIL')} 
                          className="px-6 border-2 border-slate-100 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase transition-all disabled:opacity-20"
                        >
                          驳回
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 第二块：维修执行记录 */}
            <div className={`bg-white border-2 rounded-[2.5rem] overflow-hidden transition-all duration-700 ${
              selectedOrder.currentStep === 'APPROVING' ? 'border-slate-100 opacity-40 grayscale blur-[1px]' : 'border-slate-200 shadow-lg'
            }`}>
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center px-8">
                <h5 className="text-[10px] font-black uppercase tracking-widest">环节二：维修执行与备件更换记录 (Repair Hub)</h5>
                <i className="fas fa-wrench"></i>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex items-center gap-6 bg-red-50 p-6 rounded-3xl border border-red-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm shadow-red-100 animate-pulse">
                    <i className="fas fa-microscope text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">维修执行状态</p>
                    <p className="text-sm font-bold text-red-900">
                      正在进行故障分析与备件更换，请实时在 APP 端录入维修动作和耗用备件...
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维修业务分类</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase">维修类别</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                            value={selectedOrder.repairCategory}
                            onChange={(e) => updateOrder({ ...selectedOrder, repairCategory: e.target.value })}
                          >
                            <option value="小修">小修 (Minor)</option>
                            <option value="中修">中修 (Medium)</option>
                            <option value="大修">大修 (Major)</option>
                            <option value="紧急">紧急 (Urgent)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase">维修方式</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                            value={selectedOrder.repairMethod}
                            onChange={(e) => updateOrder({ ...selectedOrder, repairMethod: e.target.value })}
                          >
                            <option value="内部维修">内部维修 (Internal)</option>
                            <option value="外委维修">外委维修 (External)</option>
                            <option value="更换备件">更换备件 (Replacement)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">故障根因分析 (Root Cause)</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium h-24 focus:ring-2 focus:ring-red-500 outline-none"
                        value={selectedOrder.rootCause}
                        onChange={(e) => updateOrder({ ...selectedOrder, rootCause: e.target.value })}
                        placeholder="请输入故障根本原因分析结论..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维修质量验收</label>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase">验收人员</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                          value={selectedOrder.buyoffBy}
                          onChange={(e) => updateOrder({ ...selectedOrder, buyoffBy: e.target.value })}
                          placeholder="请输入验收人姓名"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维修过程详细记录 (APP 同步)</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium h-40 focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-inner"
                        value={selectedOrder.operatorNotes}
                        onChange={(e) => updateOrder({ ...selectedOrder, operatorNotes: e.target.value })}
                        placeholder="系统将自动汇总 APP 端的维修步骤、备件消耗、处理结果..."
                      ></textarea>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维修质量验证</label>
                     <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                           <span className="text-xs font-bold text-slate-500">验证 Buyoff (L/H)</span>
                           <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${selectedOrder.needBuyoff ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                             {selectedOrder.needBuyoff ? 'Required' : 'Skipped'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                           <span className="text-xs font-bold text-slate-500">验收人员</span>
                           <input 
                            type="text" 
                            className="bg-transparent text-right text-xs font-black text-slate-800 outline-none"
                            value={selectedOrder.buyoffBy}
                            onChange={(e) => updateOrder({ ...selectedOrder, buyoffBy: e.target.value })}
                            placeholder="请输入验收人"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">还机判定</span>
                           <span className="text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-black uppercase">Normal Release</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 第三块：还机确认 (Footer 控制区) */}
            <div className={`p-10 rounded-[2.5rem] flex items-center justify-between transition-all duration-700 ${
              selectedOrder.currentStep !== 'FINAL_CONFIRM' ? 'bg-slate-100 opacity-50 grayscale' : 'bg-indigo-900 text-white shadow-2xl shadow-indigo-200'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  selectedOrder.currentStep === 'FINAL_CONFIRM' ? 'bg-white text-indigo-900 animate-bounce' : 'bg-slate-200 text-slate-400'
                }`}>
                  <i className="fas fa-flag-checkered"></i>
                </div>
                <div>
                  <h6 className="text-xs font-black uppercase tracking-[0.2em] mb-1">还机流程确认 (Final Release)</h6>
                  <p className={`text-[10px] font-bold ${selectedOrder.currentStep === 'FINAL_CONFIRM' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    所有维修动作已完成，验证通过。确认将模具归还生产线或入库。
                  </p>
                </div>
              </div>
              
              <button 
                disabled={selectedOrder.currentStep !== 'FINAL_CONFIRM'}
                onClick={() => updateOrder({...selectedOrder, currentStep: 'CLOSED'})}
                className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  selectedOrder.currentStep === 'FINAL_CONFIRM' ? 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                确认还机并结案
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6">
            <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center text-5xl">
              <i className="fas fa-toolbox"></i>
            </div>
            <div className="text-center">
              <p className="text-lg font-black uppercase tracking-widest text-slate-400">选择一个维修工单</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">或发起新的报修流程开始作业</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairCenter;
