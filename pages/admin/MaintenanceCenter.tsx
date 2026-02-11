
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';

// 定义流程步骤
type WorkflowStep = 'APPROVING' | 'OPERATING' | 'RECORDING' | 'FINAL_CONFIRM' | 'CLOSED';

interface MaintenanceOrder {
  id: string;
  moldId: string;
  currentStep: WorkflowStep;
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

const INITIAL_ORDERS: MaintenanceOrder[] = [
  {
    id: 'WO-20240520-001',
    moldId: 'TY101',
    currentStep: 'APPROVING',
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
    id: 'WO-20240520-002',
    moldId: 'QF16',
    currentStep: 'OPERATING',
    scheduledStartTime: '2024-05-20 14:00',
    scheduledEndTime: '2024-05-20 16:30',
    approvals: { 
      production: { status: 'PASS', adjusted: true }, 
      equipment: { status: 'PASS' }, 
      product: { status: 'PASS' } 
    },
    needBuyoff: false,
    operatorNotes: '初步检查完毕，型腔清洁。'
  }
];

const MaintenanceCenter: React.FC = () => {
  const [orders, setOrders] = useState<MaintenanceOrder[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

  const updateOrder = (updated: MaintenanceOrder) => {
    setOrders(orders.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  };

  const handleApprove = (role: keyof MaintenanceOrder['approvals'], status: 'PASS' | 'FAIL') => {
    if (!selectedOrder) return;
    const updated = JSON.parse(JSON.stringify(selectedOrder)) as MaintenanceOrder;
    
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
    const newId = `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: MaintenanceOrder = {
      id: newId,
      moldId: randomMold.id,
      currentStep: 'APPROVING',
      scheduledStartTime: '2024-05-25 09:00',
      scheduledEndTime: '2024-05-25 12:00',
      approvals: {
        production: { status: 'PENDING', adjusted: false },
        equipment: { status: 'PENDING' },
        product: { status: 'PENDING' }
      },
      needBuyoff: Math.random() > 0.5,
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
            <h3 className="font-black text-slate-900 text-sm tracking-tighter uppercase">待办任务列表</h3>
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {orders.length}
            </span>
          </div>
          <button 
            onClick={handleCreateOrder}
            className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus-circle"></i>
            发起保养流程
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-6 border-b border-slate-50 cursor-pointer transition-all ${
                selectedOrder?.id === order.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600 shadow-inner' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-black text-sm tracking-tight ${selectedOrder?.id === order.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {order.id}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                  order.currentStep === 'APPROVING' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                }`}>
                  {order.currentStep}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-microchip text-[10px] text-slate-400"></i>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Die: {order.moldId}</p>
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
                 <i className="fas fa-route text-8xl"></i>
              </div>
              <div className="flex items-center justify-between relative z-10">
                {['流程审批', '现场执行', '结果记录', '完成还机'].map((label, idx) => {
                  const steps: WorkflowStep[] = ['APPROVING', 'OPERATING', 'RECORDING', 'FINAL_CONFIRM', 'CLOSED'];
                  const activeIdx = steps.indexOf(selectedOrder.currentStep);
                  const isCompleted = idx < activeIdx;
                  const isActive = idx === activeIdx;

                  return (
                    <div key={label} className="flex flex-col items-center flex-1 relative group">
                      <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all duration-500 ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 
                        isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 
                        'bg-white border-slate-200 text-slate-300'
                      }`}>
                        {isCompleted ? <i className="fas fa-check"></i> : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-4 font-black uppercase tracking-widest transition-colors ${
                        isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
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

            {/* 第一块：三方审批栏 - 重点增强生产工程师卡片 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* 1.1 生产工程师 (核心调度) */}
              <div className={`xl:col-span-1 rounded-[2.5rem] p-8 border-2 transition-all ${
                selectedOrder.approvals.production.status === 'PASS' 
                  ? 'bg-green-50/30 border-green-100' 
                  : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">生产工程师 (时间调度)</h4>
                  {selectedOrder.approvals.production.status === 'PASS' && (
                    <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-in fade-in">Confirmed</span>
                  )}
                </div>
                
                {/* 时间调整核心区域 */}
                <div className="space-y-4 mb-8">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase flex justify-between">
                       预计保养开始 <span>Estimated Start</span>
                     </label>
                     <input 
                       type="text" 
                       disabled={selectedOrder.approvals.production.status === 'PASS'}
                       value={selectedOrder.scheduledStartTime}
                       onChange={(e) => handleTimeChange('start', e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
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
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
                     />
                   </div>
                   {selectedOrder.approvals.production.adjusted && (
                     <p className="text-[9px] text-amber-600 font-bold italic flex items-center gap-1 animate-pulse">
                       <i className="fas fa-clock"></i> 生产已对默认排期进行了手动干预调整
                     </p>
                   )}
                </div>

                <div className="flex gap-2">
                  {selectedOrder.approvals.production.status === 'PENDING' ? (
                    <>
                      <button 
                        onClick={() => handleApprove('production', 'PASS')} 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        确认并签发
                      </button>
                      <button 
                        onClick={() => handleApprove('production', 'FAIL')} 
                        className="px-6 border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 py-3 rounded-2xl text-[10px] font-black uppercase transition-all"
                      >
                        驳回
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        const updated = {...selectedOrder};
                        updated.approvals.production.status = 'PENDING';
                        updateOrder(updated);
                      }}
                      className="w-full py-3 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 rounded-2xl transition-all hover:bg-indigo-100"
                    >
                      修改排期重新签发
                    </button>
                  )}
                </div>
              </div>

              {/* 1.2 设备与产品工程师 (并列会签) */}
              <div className="xl:col-span-2 grid grid-cols-2 gap-6">
                {[
                  { role: 'equipment' as const, label: '设备工程师', sub: 'PM 标准执行确认' },
                  { role: 'product' as const, label: '产品工程师', sub: '品质风险分析确认' }
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
                          等待生产工程师<br/>锁定保养时间窗口
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mb-8 text-green-600 animate-in slide-in-from-left duration-500">
                          <i className="fas fa-check-circle text-2xl"></i>
                          <div className="text-left">
                            <p className="text-sm font-black">已通过会签</p>
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

            {/* 第二块：作业执行记录 (动态展示) */}
            <div className={`bg-white border-2 rounded-[2.5rem] overflow-hidden transition-all duration-700 ${
              selectedOrder.currentStep === 'APPROVING' ? 'border-slate-100 opacity-40 grayscale blur-[1px]' : 'border-slate-200 shadow-lg'
            }`}>
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center px-8">
                <h5 className="text-[10px] font-black uppercase tracking-widest">环节二：现场执行与数字化记录 (Execution Hub)</h5>
                <i className="fas fa-tablet-screen-button"></i>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex items-center gap-6 bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100 animate-pulse">
                    <i className="fas fa-qrcode text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">现场扫码状态</p>
                    <p className="text-sm font-bold text-indigo-900">
                      操作员已通过终端完成物理扫码核验，正在录入标准化作业清单 (SOP)...
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">作业实绩备注 (APP 同步)</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium h-40 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                      value={selectedOrder.operatorNotes}
                      onChange={(e) => updateOrder({ ...selectedOrder, operatorNotes: e.target.value })}
                      placeholder="系统将自动汇总 APP 端的执行动作和异常点记录..."
                    ></textarea>
                  </div>
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">保养完结判定依据</label>
                     <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                           <span className="text-xs font-bold text-slate-500">强制 Buyoff 验证</span>
                           <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${selectedOrder.needBuyoff ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                             {selectedOrder.needBuyoff ? 'Required' : 'Skipped'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">设备复机建议</span>
                           <span className="text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-black uppercase">Ready for Pro</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 第三块：还机确认 (Footer 控制区) */}
            <div className={`p-10 rounded-[2.5rem] flex items-center justify-between transition-all duration-700 ${
              selectedOrder.currentStep !== 'FINAL_CONFIRM' ? 'bg-slate-100 text-slate-400 opacity-50 grayscale' : 'bg-slate-900 text-white shadow-2xl'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${selectedOrder.currentStep === 'FINAL_CONFIRM' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200'}`}>
                  <i className="fas fa-flag-checkered"></i>
                </div>
                <div>
                  <h5 className="text-lg font-black italic tracking-tight">带班工程师终审还机确认</h5>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Final Equipment Recovery & Signature</p>
                </div>
              </div>
              <button 
                disabled={selectedOrder.currentStep !== 'FINAL_CONFIRM'}
                className="px-12 py-4 bg-white text-slate-900 font-black text-xs rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 uppercase tracking-widest"
              >
                立即确认还机
              </button>
            </div>
          </>
        ) : (
          <div className="h-full bg-slate-100 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 text-slate-300 transition-all hover:bg-white group">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <p className="text-sm font-black uppercase tracking-widest animate-pulse">请从左侧列表选择工单开始流程审核</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceCenter;
