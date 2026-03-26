import React, { useState, useEffect, useMemo } from 'react';
import { MoldStatus, BuyoffStatus } from '../../types';
import { MOCK_MOLDS } from '../../services/mockData';

interface MachineDashboardProps {
  onSwitchView?: (view: 'tooling' | 'machine') => void;
  onBackToAdmin?: () => void;
  department?: string;
}

const MachineDashboard: React.FC<MachineDashboardProps> = ({ onSwitchView, onBackToAdmin, department }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [selectedMoldPos, setSelectedMoldPos] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [materialType, setMaterialType] = useState<'大材料' | '小材料'>('大材料');
  const [showInventory, setShowInventory] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  const [todoMachine, setTodoMachine] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskType, setTaskType] = useState<string>('');
  const [maintenanceTimeRange, setMaintenanceTimeRange] = useState({ start: '', end: '' });
  const [showLegendModal, setShowLegendModal] = useState(false);

  // 筛选状态
  const [filterProduct, setFilterProduct] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterMold, setFilterMold] = useState('');
  const [onlyProducible, setOnlyProducible] = useState(false);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  // 固定的24台设备数据，每台设备包含 P1, P2, P3 三套模具
  const allMachines = useMemo(() => {
    // 根据部门过滤模具
    let availableMolds = MOCK_MOLDS.filter(m => m.status !== MoldStatus.Deactivated);
    if (department) {
      availableMolds = availableMolds.filter(m => m.department === department);
    }
    
    return Array.from({ length: 24 }).map((_, i) => {
      const machineId = `BMD-${String(i + 1).padStart(2, '0')}`;
      
      const createMoldData = (pos: string, index: number) => {
        // 获取模拟模具数据，确保即使 MOCK_MOLDS 为空也能有兜底
        const moldInfo = availableMolds.length > 0 
          ? availableMolds[(index * 3 + (pos === 'P1' ? 0 : pos === 'P2' ? 1 : 2)) % availableMolds.length]
          : { id: `M-TEMP-${index}`, name: '临时占位模具', type: '未知', vendor: 'N/A', shotTotal: 0, lifeLimit: 100000, status: MoldStatus.Idle, location: 'N/A', buyoffStatus: BuyoffStatus.NotInitiated };

        const statusSeed = Math.random();
        let status = 'NORMAL';
        let statusText = '正常';
        let color = 'green';

        if (statusSeed > 0.92) {
          status = 'BUYOFF';
          statusText = 'BUYOFF';
          color = 'blue';
        } else if (statusSeed > 0.85) {
          status = 'OVERDUE';
          statusText = '超期';
          color = 'red';
        } else if (statusSeed > 0.75) {
          status = 'UPCOMING';
          statusText = '即将保养';
          color = 'yellow';
        }

        const currentShots = Math.floor(Math.random() * 1000000);
        const shotThreshold = 800000; // 预警阈值
        const isShotWarning = currentShots > shotThreshold;

        return {
          pos,
          id: `T${100 + index * 3 + (pos === 'P1' ? 0 : pos === 'P2' ? 1 : 2)}`,
          status,
          statusText,
          color,
          maintenanceCountdown: Math.floor(Math.random() * 5000),
          isOffline: Math.random() > 0.95,
          taskCount: Math.floor(Math.random() * 2),
          currentShots,
          shotThreshold,
          isShotWarning,
          moldInfo
        };
      };

      const moldCount = [2, 3, 4][Math.floor(Math.random() * 3)];
      const moldPositions = Array.from({ length: moldCount }, (_, index) => `P${index + 1}`);
      
      const molds = moldPositions.reduce((acc, pos, idx) => {
        acc[pos] = createMoldData(pos, i + idx);
        return acc;
      }, {} as any);

      // 整体状态逻辑：如果有任何一个超期，则整体边框显红；如果有即将保养，显黄；否则绿
      let machineColorClass = 'border-[3px] border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]';
      if (Object.values(molds).some(m => m.status === 'OVERDUE')) {
        machineColorClass = 'border-[3px] border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      } else if (Object.values(molds).some(m => m.status === 'UPCOMING')) {
        machineColorClass = 'border-[3px] border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]';
      } else if (Object.values(molds).some(m => m.status === 'BUYOFF')) {
        machineColorClass = 'border-[3px] border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
      }

      const targetQty = 10000 + Math.floor(Math.random() * 20000);
      const completedQty = Math.floor(Math.random() * targetQty);
      const productionProgress = (completedQty / targetQty) * 100;

      return {
        id: machineId,
        colorClass: machineColorClass,
        currentProduct: ['QFN-16', 'BGA-64', 'SOP-8', 'LQFP-100'][Math.floor(Math.random() * 4)],
        batchNo: `LOT-${Math.floor(Math.random() * 900000 + 100000)}`,
        targetQty,
        completedQty,
        productionProgress,
        molds
      };
    });
  }, []);

  // 筛选逻辑
  const filteredMachines = useMemo(() => {
    return allMachines.filter(m => {
      const matchProduct = !filterProduct || m.currentProduct.toLowerCase().includes(filterProduct.toLowerCase());
      const matchMachine = !filterMachine || m.id.toLowerCase().includes(filterMachine.toLowerCase());
      
      const moldsArray = Object.values(m.molds);
      const matchMold = !filterMold || moldsArray.some(mold => mold.id.toLowerCase().includes(filterMold.toLowerCase()));
      
      // 可生产设备定义：所有模具均非下线 且 均非超期
      const matchProducible = !onlyProducible || moldsArray.every(mold => !mold.isOffline && mold.status !== 'OVERDUE');
      
      // 异常生产设备定义：机台下有任何一个模具处于 OVERDUE 或 UPCOMING 状态，或者处于 OFFLine 状态
      const matchAbnormal = !onlyAbnormal || moldsArray.some(mold => mold.isOffline || mold.status === 'OVERDUE' || mold.status === 'UPCOMING');
      
      return matchProduct && matchMachine && matchMold && matchProducible && matchAbnormal;
    });
  }, [allMachines, filterProduct, filterMachine, filterMold, onlyProducible, onlyAbnormal]);

  const productOptions = Array.from(new Set(allMachines.map(m => m.currentProduct)));

  const handleMachineClick = (machine: any) => {
    if (!machine || !machine.id || !machine.molds || Object.keys(machine.molds).length === 0) {
      alert(`设备 ${machine?.id || '未知'} 当前无模具生产数据，无法查看详情`);
      return;
    }
    setSelectedMachine(machine);
    // 确保默认选中的位置是有模具的
    const availablePos = Object.keys(machine.molds);
    if (availablePos.length > 0) {
      setSelectedMoldPos(availablePos[0] as any);
    }
  };

  const handleAction = (type: string) => {
    if (type === 'MAINTENANCE') {
      // 预设一个默认的时间范围（当前时间到4小时后）
      const now = new Date();
      const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      setMaintenanceTimeRange({
        start: now.toISOString().slice(0, 16),
        end: end.toISOString().slice(0, 16)
      });
    }
    setTaskType(type);
    setShowTaskModal(true);
  };

  const handleShowTodo = (e: React.MouseEvent, machine: any) => {
    e.stopPropagation();
    setTodoMachine(machine);
    setShowTodoList(true);
  };

  const toggleTaskComplete = (machineId: string, moldId: string, taskType: string) => {
    const taskId = `${machineId}-${moldId}-${taskType}`;
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen bg-[#020617] text-white p-2 font-sans overflow-hidden flex flex-col">
      {/* 看板说明弹窗 */}
      {showLegendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-[3px] border-blue-500/30 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(30,58,138,0.5)]">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent">
              <div>
                <h2 className="text-2xl font-black text-blue-100 tracking-tighter uppercase flex items-center gap-3">
                  <i className="fas fa-circle-info text-blue-400"></i>
                  看板交互与样式说明
                </h2>
                <p className="text-blue-500/60 text-[10px] font-bold uppercase tracking-widest mt-1">Dashboard Interaction & Style Legend</p>
              </div>
              <button 
                onClick={() => setShowLegendModal(false)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all group"
              >
                <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-12 custom-scrollbar">
              {/* 颜色含义 */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  状态颜色定义
                </h3>
                <div className="space-y-4">
                  {[
                    { color: 'bg-green-500', title: '正常 (NORMAL)', desc: '模具状态良好，处于安全运行期。' },
                    { color: 'bg-yellow-500', title: '即将保养 (UPCOMING)', desc: '剩余冲次低于预警阈值（通常为 70% 或 80%），建议近期安排维护。' },
                    { color: 'bg-red-500', title: '超期/停用 (OVERDUE/OFFLINE)', desc: '已超过保养节点（>90%）或被标记为停用状态，需立即处理。' },
                    { color: 'bg-blue-500', title: '验证中 (BUYOFF)', desc: '新模具或大修后模具正在进行生产验证阶段。' },
                    { color: 'bg-slate-400', title: '已停用 (DEACTIVATED)', desc: '模具已报废或长期闲置，已从生产流程中移除。' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                      <div className={`w-3 h-10 rounded-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.5)] mt-1`}></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 图标含义 */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  图标与角标
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: 'fa-bolt text-amber-500', title: '高频波动预警', desc: '表示该模具当前冲次增长异常或触发高频点检提醒。' },
                    { icon: 'fa-circle text-red-600', title: '物理下线标识', desc: '出现在模具位置左上角，表示模具已物理脱离机台。' },
                    { icon: 'fa-list-check text-indigo-400', title: '待办任务提醒', desc: '底部的 TASKS 标签表示该机台有未确认的保养或点检工单。' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 设备边框说明 */}
              <section className="col-span-2 space-y-6 pt-4 border-t border-white/5">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  设备边框颜色说明 (以设备为维度)
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { color: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]', title: '异常/超期', desc: '机台内有任一模具处于“超期”或“停用”状态，需立即干预。', icon: 'fa-triangle-exclamation text-red-500' },
                    { color: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]', title: '预警/关注', desc: '机台内所有模具均未超期，但有模具处于“即将保养”阶段。', icon: 'fa-circle-exclamation text-yellow-500' },
                    { color: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]', title: '验证中 (BUYOFF)', desc: '机台内有模具处于“BUYOFF验证”阶段，生产需严格监控。', icon: 'fa-microscope text-blue-500' },
                    { color: 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]', title: '运行正常', desc: '机台内所有模具状态均为“正常”，无待办维保任务。', icon: 'fa-check-circle text-green-500' }
                  ].map((item, idx) => (
                    <div key={idx} className={`bg-slate-800/80 p-4 rounded-2xl border-[3px] ${item.color} flex flex-col gap-3 group hover:scale-[1.02] transition-all`}>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-black text-slate-100 tracking-tight">{item.title}</span>
                        <i className={`fas ${item.icon} text-lg`}></i>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                      <div className="mt-auto pt-2 border-t border-white/5 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[9px] text-blue-500/60 font-black uppercase tracking-widest">Device Border Legend</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 进度条说明 */}
              <section className="col-span-2 space-y-6 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                      进度条含义说明
                    </h3>
                    <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-24 shrink-0 space-y-2">
                        <div className="flex gap-1">
                          <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-1/2"></div>
                          </div>
                          <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-4/5"></div>
                          </div>
                          <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-full"></div>
                          </div>
                        </div>
                        <div className="text-[9px] text-center text-slate-400 font-black uppercase">累计冲次 (Shot Count)</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100">模具累计冲次进度条</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                          显示模具当前已累计运行的冲次占总寿命比例。
                          <span className="text-green-500 ml-1">绿色</span>安全，
                          <span className="text-yellow-500 ml-1">黄色</span>预警，
                          <span className="text-red-500 ml-1">红色</span>超期。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                      生产负荷说明
                    </h3>
                    <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-24 shrink-0 space-y-1.5">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-2/3"></div>
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-blue-500/50">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                        <div className="text-[9px] text-center text-slate-400 font-black uppercase">生产进度 (Progress)</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100">机台生产达成率</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                          展示当前机台批次任务的完成进度。
                          <span className="text-blue-500 font-black">蓝色进度条</span>
                          代表已完成产量占目标产量的百分比。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 交互操作指南 */}
              <section className="col-span-2 space-y-6 pt-4">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/20 pb-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  设备指挥中心交互说明
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-blue-400 text-[10px] font-black mb-2 uppercase flex items-center gap-2">
                      <i className="fas fa-chart-line"></i> 生产监控
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">实时展示当前机台的“计划产量”与“实际完成量”，计算生产达成率，帮助调度人员监控产线负荷。</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-blue-400 text-[10px] font-black mb-2 uppercase flex items-center gap-2">
                      <i className="fas fa-microchip"></i> 模具详情
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">穿透查看 P1/P2/P3 模具的全称、型号、累计冲次、预警阈值及待办任务数，实现精细化台账管理。</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-blue-400 text-[10px] font-black mb-2 uppercase flex items-center gap-2">
                      <i className="fas fa-tools"></i> 维保申报
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">一键发起“保养任务”或“报修任务”。发起后系统将锁定模具状态，并实时派发工单至工程师端。</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-blue-400 text-[10px] font-black mb-2 uppercase flex items-center gap-2">
                      <i className="fas fa-arrows-rotate"></i> 生命周期
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">支持“模具安装/卸载”以同步物理生产环境；“模具停用”可对异常模具进行封存，防止误操作生产。</p>
                  </div>
                </div>
                <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">
                  <p className="text-[10px] text-blue-400/80 font-bold leading-relaxed text-center">
                    <i className="fas fa-lightbulb mr-2"></i>
                    提示：点击看板上任意机台卡片即可进入“设备指挥中心”面板进行上述操作。
                  </p>
                </div>
              </section>
            </div>

            <div className="p-6 bg-white/5 text-center">
              <button 
                onClick={() => setShowLegendModal(false)}
                className="px-12 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/50"
              >
                我已了解
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-1 px-2">
        <div className="flex gap-2">
          {onBackToAdmin && (
            <button 
              onClick={onBackToAdmin}
              className="px-4 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-bold transition-all flex items-center gap-2 group"
              title="返回后台"
            >
              <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform text-blue-400"></i>
              返回后台
            </button>
          )}
          <button className="px-4 py-0.5 bg-blue-700 border border-blue-400 rounded text-[10px] font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            设备看板 (3-MOLD MODE)
          </button>
          <button 
            onClick={() => setShowLegendModal(true)}
            className="px-4 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-bold transition-all flex items-center gap-2 group"
          >
            <i className="fas fa-circle-info text-blue-400 group-hover:scale-110 transition-transform"></i>
            看板说明
          </button>
          {/* 大小材料切换按钮 */}
          <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700 ml-2">
            <button 
              onClick={() => setMaterialType('大材料')}
              className={`px-4 py-0.5 rounded text-[10px] font-black transition-all ${materialType === '大材料' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              大材料模式
            </button>
            <button 
              onClick={() => setMaterialType('小材料')}
              className={`px-4 py-0.5 rounded text-[10px] font-black transition-all ${materialType === '小材料' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              小材料模式
            </button>
          </div>
        </div>
        <h1 className="text-lg font-black tracking-tighter text-blue-100 flex items-center gap-2">
          <i className="fas fa-microchip text-blue-400 text-sm"></i>
          NXP SMART MOLD BOARD - 24 UNITS / 72 MOLDS
        </h1>
        <div className="bg-blue-900/30 px-5 py-2 rounded-xl border border-blue-800/50 text-blue-400 font-mono text-sm font-bold shadow-[0_0_15px_rgba(30,58,138,0.3)]">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-2 mb-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-blue-500 uppercase">Product:</span>
          <select 
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-blue-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Products</option>
            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-blue-500 uppercase">Machine:</span>
          <input 
            type="text"
            placeholder="Search BMD..."
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-blue-100 focus:outline-none focus:border-blue-500 w-24"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-blue-500 uppercase">Mold ID:</span>
          <input 
            type="text"
            placeholder="Search T..."
            value={filterMold}
            onChange={(e) => setFilterMold(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-blue-100 focus:outline-none focus:border-blue-500 w-24"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox"
            checked={onlyProducible}
            onChange={(e) => setOnlyProducible(e.target.checked)}
            className="hidden"
          />
          <div className={`w-3 h-3 rounded border ${onlyProducible ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-blue-500'} flex items-center justify-center transition-colors`}>
            {onlyProducible && <i className="fas fa-check text-[8px] text-white"></i>}
          </div>
          <span className={`text-[10px] font-black uppercase ${onlyProducible ? 'text-blue-400' : 'text-slate-500'}`}>仅显示可生产设备</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox"
            checked={onlyAbnormal}
            onChange={(e) => setOnlyAbnormal(e.target.checked)}
            className="hidden"
          />
          <div className={`w-3 h-3 rounded border ${onlyAbnormal ? 'bg-rose-500 border-rose-500' : 'border-slate-600 group-hover:border-rose-500'} flex items-center justify-center transition-colors`}>
            {onlyAbnormal && <i className="fas fa-check text-[8px] text-white"></i>}
          </div>
          <span className={`text-[10px] font-black uppercase ${onlyAbnormal ? 'text-rose-400' : 'text-slate-500'}`}>显示异常生产设备</span>
        </label>

        {(filterProduct || filterMachine || filterMold || onlyProducible || onlyAbnormal) && (
          <button 
            onClick={() => {
              setFilterProduct('');
              setFilterMachine('');
              setFilterMold('');
              setOnlyProducible(false);
              setOnlyAbnormal(false);
            }}
            className="ml-auto text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <i className="fas fa-undo-alt"></i> RESET
          </button>
        )}
      </div>

      {/* Main Grid - 6x4 */}
      <div className="grid grid-cols-6 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredMachines.map(machine => (
          <div 
            key={machine.id} 
            onClick={() => handleMachineClick(machine)}
            className={`bg-slate-900/40 ${machine.colorClass} rounded-xl p-2.5 flex flex-col justify-between cursor-pointer hover:bg-slate-800/60 transition-all relative group`}
          >
            {/* Machine Header */}
            <div className="flex flex-col mb-2">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-black text-blue-300">{machine.id}</span>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-black text-blue-100 truncate max-w-[100px] leading-tight">{machine.currentProduct}</span>
                  <span className="text-[10px] text-slate-500 font-mono leading-tight">{machine.batchNo}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Molds Row (2, 3, or 4 molds) */}
            <div className={`grid ${
              Object.keys(machine.molds).length === 4 ? 'grid-cols-4' : 
              Object.keys(machine.molds).length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            } gap-1.5 my-2 flex-1`}>
              {Object.entries(machine.molds).map(([pos, mold]: [string, any]) => {
                if (!mold) return null;
                return (
                  <div key={pos} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold">{pos}</span>
                      {mold.isOffline && <span className="w-2.5 h-2.5 bg-red-600 rounded-full"></span>}
                    </div>
                    <div className={`h-6 rounded border-2 flex items-center justify-between px-1.5 text-[11px] font-black relative overflow-hidden ${
                      mold.color === 'green' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                      mold.color === 'blue' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' :
                      mold.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' :
                      'bg-red-500/10 border-red-500/50 text-red-500'
                    }`}>
                      <span>{mold.id}</span>
                      {mold.isShotWarning && (
                        <i className="fas fa-bolt text-[11px] text-amber-500 animate-pulse"></i>
                      )}
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${
                          (mold.maintenanceCountdown / 5000) * 100 > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                          (mold.maintenanceCountdown / 5000) * 100 > 60 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-green-500'
                        }`} style={{ width: `${Math.min(100, (mold.maintenanceCountdown / 5000) * 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center px-0.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Life</span>
                        <span className={`text-[9px] font-black ${
                          (mold.maintenanceCountdown / 5000) * 100 > 90 ? 'text-red-400' : 
                          (mold.maintenanceCountdown / 5000) * 100 > 60 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {Math.round(Math.min(100, (mold.maintenanceCountdown / 5000) * 100))}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Todo Badge in bottom-right corner */}
            {Object.values(machine.molds).reduce((acc: number, m: any) => acc + m.taskCount, 0) > 0 && (
              <div 
                onClick={(e) => handleShowTodo(e, machine)}
                className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-500 text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-indigo-900/50 transition-all hover:scale-110 border border-indigo-400/50 z-10"
                title="点击查看待办清单"
              >
                {Object.values(machine.molds).reduce((acc: number, m: any) => acc + m.taskCount, 0)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="bg-blue-900/30 p-6 border-b border-blue-500/30 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-blue-100 uppercase tracking-widest">设备指挥中心: {selectedMachine.id}</h2>
                <div className="flex gap-4 mt-1">
                  <p className="text-blue-400 text-xs font-bold">当前产品: {selectedMachine.currentProduct}</p>
                  <p className="text-slate-500 text-xs font-mono">批次号: {selectedMachine.batchNo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMachine(null)} className="text-blue-400 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <div className="flex">
              {/* Left Sidebar: Pos Selector */}
              <div className="w-24 bg-slate-950/50 border-r border-blue-900/30 flex flex-col p-2 gap-2">
                {Object.keys(selectedMachine.molds).map(pos => {
                  const mold = (selectedMachine.molds as any)[pos];
                  if (!mold) return null;
                  const isActive = selectedMoldPos === pos;
                  return (
                    <button 
                      key={pos}
                      onClick={() => setSelectedMoldPos(pos as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isActive 
                          ? 'bg-blue-600 border-blue-400 scale-105 shadow-lg shadow-blue-900/50' 
                          : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'
                      }`}
                    >
                      <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-500'}`}>{pos}</span>
                      <span className={`text-[9px] font-bold ${
                        mold.color === 'red' ? 'text-red-500' : 
                        mold.color === 'yellow' ? 'text-yellow-500' : 
                        isActive ? 'text-blue-100' : 'text-green-500'
                      }`}>{mold.id}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Content: Detail & Action for selected POS */}
              {(() => {
                const mold = (selectedMachine.molds as any)[selectedMoldPos] || Object.values(selectedMachine.molds)[0];
                if (!mold) return null;
                return (
                  <div className="flex-1 p-8 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-blue-950/50 p-5 rounded-2xl border border-blue-900">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-[10px] font-black text-blue-500 uppercase">模具状态 ({selectedMoldPos})</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            mold.color === 'green' ? 'bg-green-500/20 text-green-500' :
                            mold.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                            mold.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                          }`}>{mold.statusText}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                          <span className="text-slate-400">模具编号:</span> <span className="text-blue-200 font-bold">{mold.id}</span>
                          <span className="text-slate-400">模具全称:</span> <span className="text-blue-200 font-bold">{mold.moldInfo.name}</span>
                          <span className="text-slate-400">模具简称:</span> <span className="text-blue-200 font-bold">{mold.moldInfo.shortName || '-'}</span>
                          <span className="text-slate-400">待办任务:</span> <span className="text-indigo-400 font-black">{mold.taskCount} 项</span>
                          <span className="text-slate-400">模具型号:</span> <span className="text-blue-200">{mold.moldInfo.type}</span>
                          <span className="text-slate-400">累计冲次:</span> <span className={`font-bold ${mold.isShotWarning ? 'text-amber-500' : 'text-blue-200'}`}>{mold.currentShots.toLocaleString()}</span>
                          <span className="text-slate-400">预警阈值:</span> <span className="text-slate-400">{mold.shotThreshold.toLocaleString()}</span>
                          <span className="text-slate-400">维修状态:</span> <span className={mold.isOffline ? 'text-red-500 font-bold' : 'text-green-500'}>{mold.isOffline ? '已下线' : '正常'}</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-950/50 p-5 rounded-2xl border border-blue-900">
                        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-4">保养指标</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">剩余寿命 (Shots)</span>
                            <span className={mold.status === 'OVERDUE' ? 'text-red-500' : 'text-blue-400'}>{mold.maintenanceCountdown} / 5000</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${mold.status === 'OVERDUE' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(mold.maintenanceCountdown / 5000) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase mb-4">执行操作</h3>
                      <button onClick={() => handleAction('MAINTENANCE')} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        <i className="fas fa-tools"></i> 创建保养任务
                      </button>
                      <button onClick={() => handleAction('REPAIR')} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        <i className="fas fa-exclamation-triangle"></i> 创建报修任务
                      </button>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button onClick={() => handleAction('UNINSTALL')} className="bg-amber-600/20 text-amber-500 border border-amber-600/30 hover:bg-amber-600/30 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                          卸载模具
                        </button>
                        <button onClick={() => setShowInventory(true)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                          <i className="fas fa-plus-circle"></i> 安装模具
                        </button>
                      </div>
                      <button onClick={() => handleAction('DEACTIVATE')} className="w-full bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-1">
                        <i className="fas fa-ban"></i> 模具停用
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-blue-500/30 flex justify-between items-center bg-blue-900/20">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-blue-100 uppercase tracking-widest flex items-center gap-3">
                  <i className="fas fa-warehouse text-blue-400"></i>
                  库存模具清单
                </h2>
                {selectedMachine && (
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">当前设备:</span>
                    <span className="text-blue-400">{selectedMachine.id}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-500 uppercase">正在生产:</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{selectedMachine.currentProduct}</span>
                    <span className="text-slate-500 font-mono">({selectedMachine.batchNo})</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowInventory(false)} className="text-blue-400 hover:text-white transition-colors">
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 gap-4">
                {MOCK_MOLDS.filter(mold => mold.status !== MoldStatus.Deactivated).map(mold => {
                  const machine = allMachines.find(m => 
                    Object.values(m.molds).some((mm: any) => mm.moldInfo.id === mold.id)
                  );
                  
                  return (
                    <div key={mold.id} className={`bg-blue-950/50 border ${mold.status === MoldStatus.Idle ? 'border-blue-900 hover:border-blue-500/50' : 'border-slate-800 opacity-70'} rounded-2xl p-4 space-y-3 transition-all group`}>
                      <div className="flex justify-between items-start">
                        <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">{mold.id}</span>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold block ${
                            mold.status === MoldStatus.Idle ? 'text-green-400' :
                            mold.status === MoldStatus.InUse ? 'text-yellow-400' :
                            mold.status === MoldStatus.Maintenance ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {mold.status === MoldStatus.Idle ? '闲置中' :
                             mold.status === MoldStatus.InUse ? '使用中' :
                             mold.status === MoldStatus.Maintenance ? '保养中' : '维修中'}
                          </span>
                          {mold.status !== MoldStatus.Idle && machine && (
                            <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-tighter mt-0.5">
                              设备号: {machine.id}
                            </span>
                          )}
                           {mold.status === MoldStatus.Idle && (
                             <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-tighter mt-0.5">
                               柜号: {mold.cabNo || '未入库'}
                             </span>
                           )}
                         </div>
                       </div>
                    <p className="text-xs font-bold text-blue-100 line-clamp-1">{mold.name}</p>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <p>位置: {mold.location}</p>
                      <p>Package: {mold.packageType}</p>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">实时 SHOT COUNT</span>
                        <span className="text-[10px] font-black text-indigo-400">{mold.shotTotal.toLocaleString()}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (mold.shotTotal / mold.lifeLimit) > 0.9 ? 'bg-red-500' : 
                            (mold.shotTotal / mold.lifeLimit) > 0.7 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (mold.shotTotal / mold.lifeLimit * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">上限: {mold.lifeLimit.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-slate-600">{(mold.shotTotal / mold.lifeLimit * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    {mold.status === MoldStatus.Idle ? (
                      <button 
                        onClick={() => {
                          setTaskType('INSTALL_SUCCESS');
                          setShowTaskModal(true);
                          setShowInventory(false);
                        }}
                        className="w-full bg-blue-900/50 group-hover:bg-blue-600 text-[10px] font-black py-2 rounded-lg transition-all uppercase tracking-widest"
                      >
                        安装到机台
                      </button>
                    ) : (
                      <div className="w-full bg-slate-800/50 text-slate-500 text-[10px] font-black py-2 rounded-lg text-center uppercase tracking-widest cursor-not-allowed">
                        不可用 ({mold.status === MoldStatus.InUse ? '生产中' : '处理中'})
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Todo List Modal */}
      {showTodoList && todoMachine && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-transparent">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <i className="fas fa-clipboard-list text-indigo-400"></i>
                  {todoMachine.id} 待办清单
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Pending Task List</p>
              </div>
              <button 
                onClick={() => setShowTodoList(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 custom-scrollbar">
              {Object.entries(todoMachine.molds).map(([pos, mold]: [string, any]) => {
                if (!mold) return null;
                const tasks = [];
                if (mold.status === 'OVERDUE') tasks.push({ type: 'MAINTENANCE', title: '例行保养', status: '超期', color: 'red' });
                if (mold.status === 'UPCOMING') tasks.push({ type: 'MAINTENANCE', title: '例行保养', status: '即将到期', color: 'yellow' });
                if (mold.isOffline) tasks.push({ type: 'REPAIR', title: '模具维修', status: '待处理', color: 'red' });
                if (mold.status === 'BUYOFF') tasks.push({ type: 'CHECK', title: 'BUYOFF 验证', status: '进行中', color: 'blue' });
                
                // Add some dummy tasks if count > 0 but no clear state
                if (tasks.length === 0 && mold.taskCount > 0) {
                  tasks.push({ type: 'PART', title: '备件更换', status: '待执行', color: 'indigo' });
                }

                if (tasks.length === 0) return null;

                return (
                  <div key={pos} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{pos}</span>
                      <span className="text-[10px] font-bold text-slate-500">{mold.id}</span>
                    </div>
                    {tasks.map((task, idx) => {
                      const taskId = `${todoMachine.id}-${mold.id}-${task.type}`;
                      const isCompleted = completedTasks.has(taskId);
                      
                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isCompleted 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-white/5 border-white/5 hover:border-indigo-500/30'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-8 rounded-full ${isCompleted ? 'bg-green-500' : `bg-${task?.color || 'slate'}-500`}`}></div>
                            <div>
                              <p className={`text-xs font-black ${isCompleted ? 'text-green-400 line-through' : 'text-slate-200'}`}>{task.title}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                Status: {isCompleted ? '已处理' : task.status}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleTaskComplete(todoMachine.id, mold.id, task.type)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                              isCompleted
                                ? 'bg-green-600 text-white border-green-500'
                                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            {isCompleted ? (
                              <span className="flex items-center gap-1">
                                <i className="fas fa-check-circle"></i>
                                已完成
                              </span>
                            ) : '确认完成'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
              <button 
                onClick={() => setShowTodoList(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                关闭
              </button>
              <button 
                onClick={() => {
                  setShowTodoList(false);
                  handleMachineClick(todoMachine);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
              >
                进入指挥中心
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            {taskType === 'MAINTENANCE' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fas fa-clock"></i>
                  </div>
                  <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">设置保养时间范围</h2>
                  <p className="text-slate-400 text-xs">
                    请为机台 {selectedMachine?.id} 模具 {(selectedMachine?.molds as any)[selectedMoldPos]?.id} 选择保养时间。
                  </p>
                </div>

                <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-blue-900/30">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase">开始时间</label>
                    <input 
                      type="datetime-local" 
                      value={maintenanceTimeRange.start}
                      onChange={(e) => setMaintenanceTimeRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-blue-100 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase">结束时间</label>
                    <input 
                      type="datetime-local" 
                      value={maintenanceTimeRange.end}
                      onChange={(e) => setMaintenanceTimeRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-blue-100 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => setTaskType('SUCCESS')}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                  >
                    确认创建
                  </button>
                </div>
              </div>
            ) : taskType === 'SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">任务已提交</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-green-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">任务详情</p>
                  <p className="text-xs text-slate-300">
                    机台: <span className="text-blue-400 font-bold">{selectedMachine?.id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    模具: <span className="text-blue-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    时间: <span className="text-green-400 font-bold">{maintenanceTimeRange.start.replace('T', ' ')} 至 {maintenanceTimeRange.end.replace('T', ' ')}</span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  返回看板
                </button>
              </div>
            ) : taskType === 'INSTALL_SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-double"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">安装任务已确认</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-blue-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">安装详情</p>
                  <p className="text-xs text-slate-300">
                    目标设备: <span className="text-blue-400 font-bold">{selectedMachine?.id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    安装位置: <span className="text-blue-400 font-bold">{selectedMoldPos}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    状态更新: <span className="text-green-400 font-bold">已同步至生产看板</span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  确认并关闭
                </button>
              </div>
            ) : taskType === 'DEACTIVATE' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-pulse">
                  <i className="fas fa-ban"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">确认停用模具</h2>
                <div className="bg-red-950/20 p-4 rounded-2xl border border-red-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-red-400 uppercase font-bold tracking-widest">警告事项</p>
                  <p className="text-xs text-slate-300">
                    您正在停用模具: <span className="text-red-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.id}</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    停用后，该模具将无法再被安装到任何机台上，且会从生产可用列表中移除。此操作不可逆，请谨慎操作。
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      setTaskType('DEACTIVATE_SUCCESS');
                    }}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
                  >
                    确认停用
                  </button>
                </div>
              </div>
            ) : taskType === 'DEACTIVATE_SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-500/20 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">模具已停用</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  模具 {(selectedMachine?.molds as any)[selectedMoldPos]?.id} 已标记为“已停用”状态。相关数据已同步至模具台账。
                </p>
                <button 
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  关闭并返回
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">任务已提交</h2>
                <p className="text-slate-400 text-sm mb-8">
                  机台 {selectedMachine?.id} 模具 {(selectedMachine?.molds as any)[selectedMoldPos]?.id} ({selectedMoldPos}) 的任务已进入任务中心。
                </p>
                <button 
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  返回看板
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDashboard;
