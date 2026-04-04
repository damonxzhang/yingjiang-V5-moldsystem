import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DashboardService, DashboardStatusResponse, CreateMaintenanceTaskRequest, CreateRepairTaskRequest, DisableMoldRequest, MoldActionRequest, MachineDetailResponse, InventoryMold, InventoryResponse, fetchInventoryMolds, installMold } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';

interface MachineDashboardProps {
  onSwitchView?: (view: 'tooling' | 'machine') => void;
  onBackToAdmin?: () => void;
  department?: string;
}

const MachineDashboard: React.FC<MachineDashboardProps> = ({ onSwitchView, onBackToAdmin, department }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // 检查是否为访客模式 - 通过 user_id 判断
  const isGuestMode = useMemo(() => {
    const authData = AuthService.getStoredAuth();
    if (authData) {
      return authData.user_id === 'GUEST';
    }
    return false;
  }, []);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [selectedMoldPos, setSelectedMoldPos] = useState<'P1' | 'P2' | 'P3'>('P1');
  // 当前材料类型状态
  const [currentMaterialType, setCurrentMaterialType] = useState<'大材料' | '小材料' | 'ALL'>('大材料');

  // 初始化材料类型（优先从 prop 获取，其次从登录用户信息获取，最后默认大材料）
  useEffect(() => {
    if (department) {
      setCurrentMaterialType(department === '小材料' ? '小材料' : (department === '大材料' ? '大材料' : 'ALL'));
    } else {
      // 从登录用户信息获取 department
      const authData = AuthService.getStoredAuth();
      if (authData?.department) {
        setCurrentMaterialType(authData.department === '小材料' ? '小材料' : (authData.department === '大材料' ? '大材料' : 'ALL'));
      } else {
        setCurrentMaterialType('大材料');
      }
    }
  }, [department]);
  const [showInventory, setShowInventory] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  const [todoMachine, setTodoMachine] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [taskType, setTaskType] = useState<string>('');
  const [maintenanceTimeRange, setMaintenanceTimeRange] = useState({ start: '', end: '' });
  const [showLegendModal, setShowLegendModal] = useState(false);
  // 存储API返回的看板数据
  const [dashboardData, setDashboardData] = useState<DashboardStatusResponse | null>(null);
  // 创建保养任务加载状态
  const [isCreatingMaintenance, setIsCreatingMaintenance] = useState(false);
  // 创建保养任务错误信息
  const [maintenanceError, setMaintenanceError] = useState<string>('');
  // 创建报修任务加载状态
  const [isCreatingRepair, setIsCreatingRepair] = useState(false);
  // 创建报修任务错误信息
  const [repairError, setRepairError] = useState<string>('');
  // 模具停用加载状态
  const [isDisablingMold, setIsDisablingMold] = useState(false);
  // 模具停用错误信息
  const [disableMoldError, setDisableMoldError] = useState<string>('');
  // 模具安装加载状态
  const [isInstallingMold, setIsInstallingMold] = useState(false);
  // 模具卸载加载状态
  const [isUninstallingMold, setIsUninstallingMold] = useState(false);
  // 模具安装/卸载错误信息
  const [moldActionError, setMoldActionError] = useState<string>('');
  // 机台详情数据
  const [machineDetail, setMachineDetail] = useState<MachineDetailResponse | null>(null);
  // 加载机台详情状态
  const [isLoadingMachineDetail, setIsLoadingMachineDetail] = useState(false);

  // 库存模具数据
  const [inventoryData, setInventoryData] = useState<InventoryResponse | null>(null);
  // 加载库存模具状态
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  // 库存模具筛选关键字
  const [inventoryFilter, setInventoryFilter] = useState('');
  // 登录提示弹窗状态
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState('');

  // 筛选状态
  const [filterProduct, setFilterProduct] = useState('');
  // 筛选状态
  const [filterMachine, setFilterMachine] = useState('');      // 机台编号筛选关键字
  const [filterMold, setFilterMold] = useState('');            // 模具编号筛选关键字
  const [onlyProducible, setOnlyProducible] = useState(false); // 仅显示可生产设备（模具未下线且未超期）
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);     // 仅显示异常生产设备（模具超期、即将保养或下线）
  // 数据刷新触发器
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Product 下拉列表选项
  const [productOptions, setProductOptions] = useState<string[]>([]);

  // 页面加载时获取 Product 下拉列表
  const hasFetchedProductOptions = useRef(false);
  useEffect(() => {
    if (hasFetchedProductOptions.current) return;
    hasFetchedProductOptions.current = true;
    const fetchProductOptions = async () => {
      try {
        const codes = await DashboardService.fetchMachineCodes();
        setProductOptions(Array.isArray(codes) ? codes : []);
      } catch (error) {
        console.error('获取机台编号列表失败:', error);
        setProductOptions([]);
      }
    };
    fetchProductOptions();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // 用于防抖的定时器ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 调用API获取看板数据
  useEffect(() => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置防抖延迟（机器码和模具编号输入完成后500ms再请求）
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await DashboardService.fetchDashboardMachinesStatus({
          department: currentMaterialType,
          product_type: filterProduct,
          machine_code: filterMachine,
          mold_code: filterMold,
          only_producible: onlyProducible,
          only_abnormal: onlyAbnormal
        });
        setDashboardData(data);
      } catch (error) {
        console.error('获取看板数据失败:', error);
      }
    }, 500);

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filterProduct, filterMachine, filterMold, onlyProducible, onlyAbnormal, refreshTrigger, currentMaterialType]);

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

  // 处理 API 返回的设备数据
  const allMachines = useMemo(() => {
    return (dashboardData?.machines || []).map((item) => {
      // 使用 API 原始字段名，保持与接口一致
      const machine_code = item.machine_code;
      const machine_id = item.machine_id;
      const status = item.status; // 机台状态: NORMAL, MAINTENANCE_DUE, OVERDUE, BUYOFF, DISABLED, OFFLINE
      const pending_tasks = item.pending_tasks || 0;
      const part_no = item.part_no;
      const mold_count = item.mold_count;

      // 根据 life_percent 计算前端状态
      const getStatusByLifePercent = (life_percent: number) => {
        if (life_percent >= 90) return { status: 'OVERDUE', statusText: '超期', color: 'red' };
        if (life_percent >= 75) return { status: 'UPCOMING', statusText: '即将保养', color: 'yellow' };
        return { status: 'NORMAL', statusText: '正常', color: 'green' };
      };

      const createMoldData = (pos: string, moldItemInfo: any) => {
        // 如果 moldItemInfo 为空，返回一个状态为 EMPTY 的对象
        if (!moldItemInfo) {
          return {
            pos,
            mold_id: `EMPTY-${pos}`,
            mold_code: '',
            name: '',
            short_name: '',
            status: 'EMPTY',
            statusText: '无模具',
            color: 'slate',
            life_percent: 0,
            current_shots: 0,
            max_shots: 0,
            remaining_shots: 0,
            shotThreshold: 0,
            isShotWarning: false,
            isOffline: false
          };
        }

        const life_percent = moldItemInfo.life_percent || 0;
        const statusInfo = getStatusByLifePercent(life_percent);

        // 计算剩余冲次
        const max_shots = moldItemInfo.max_shots || 500000;
        const current_shots = moldItemInfo.current_shots || 0;
        const remaining_shots = max_shots - current_shots;
        const shotThreshold = max_shots * 0.75; // 预警阈值为75%
        const isShotWarning = current_shots > shotThreshold;

        return {
          pos,
          // 使用 API 原始字段名
          mold_id: String(moldItemInfo.mold_id),
          mold_code: moldItemInfo.mold_code,
          name: moldItemInfo.name,
          short_name: moldItemInfo.short_name,
          // 前端状态字段
          status: moldItemInfo.status === 'EMPTY' ? 'EMPTY' : statusInfo.status,
          statusText: moldItemInfo.status === 'EMPTY' ? '无模具' : statusInfo.statusText,
          color: moldItemInfo.status === 'EMPTY' ? 'slate' : statusInfo.color,
          // 其他字段保持 API 原始命名
          life_percent,
          current_shots,
          max_shots,
          remaining_shots,
          shotThreshold,
          isShotWarning,
          mold_category: moldItemInfo.mold_category,
          type: moldItemInfo.mold_category || moldItemInfo.type,
          isOffline: moldItemInfo.status === 'OFFLINE'
        };
      };

      // 直接使用 API 返回的 molds 数据
      const molds = (item?.molds || []).reduce((acc: any, moldItem: any) => {
        const pos = moldItem.mold_number || 'P1';
        const moldData = createMoldData(pos, moldItem);
        // 只添加非 null 的模具数据
        if (moldData) {
          acc[pos] = moldData;
        }
        return acc;
      }, {});

      // 整体状态逻辑：使用机台状态优先，其次根据模具状态计算
      // 过滤掉 null 值的模具数组
      const validMolds = Object.values(molds).filter(Boolean) as any[];
      // molds 为空时显示灰色
      let colorClass = validMolds.length === 0
        ? 'border-[3px] border-slate-600 shadow-[0_0_12px_rgba(71,85,105,0.3)]'
        : 'border-[3px] border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]';
      if (status === 'OVERDUE' || status === 'DISABLED' || status === 'OFFLINE' || validMolds.some((m: any) => m.status === 'OVERDUE')) {
        colorClass = 'border-[3px] border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      } else if (status === 'MAINTENANCE_DUE' || validMolds.some((m: any) => m.status === 'UPCOMING')) {
        colorClass = 'border-[3px] border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]';
      } else if (status === 'BUYOFF' || validMolds.some((m: any) => m.status === 'BUYOFF')) {
        colorClass = 'border-[3px] border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
      }

      return {
        // 使用 API 原始字段名
        machine_code,
        machine_id,
        status,
        pending_tasks,
        part_no,
        mold_count,
        // 前端需要的额外字段
        colorClass,
        currentProduct: part_no || '',
        molds
      };
    });
  }, [dashboardData]);

  const handleMachineClick = async (machine: any) => {
    // 过滤掉 null 值，获取有效的模具位置
    const validMoldEntries = Object.entries(machine.molds || {}).filter(([_, mold]) => mold != null);
    if (!machine || !machine.machine_code || validMoldEntries.length === 0) {
      alert(`设备 ${machine?.machine_code || '未知'} 当前无模具生产数据，无法查看详情`);
      return;
    }
    setSelectedMachine(machine);

    // 获取第一个有模具的槽位作为默认槽位
    const availablePos = validMoldEntries.map(([pos]) => pos);
    const defaultSlot = availablePos.length > 0 ? availablePos[0] : 'P1';
    setSelectedMoldPos(defaultSlot as any);

    // 调用 API 获取机台详情
    setIsLoadingMachineDetail(true);
    try {
      const detail = await DashboardService.fetchMachineDetail({
        machine_id: machine.machine_id,
        slot: defaultSlot
      });
       const authData = AuthService.getStoredAuth();
      if(detail.department != authData?.department){
        detail.operation = false; // 不可操作
      }else{
        detail.operation = true; // 可操作
      }
      console.log("detail:",detail)
      setMachineDetail(detail);
    } catch (error: any) {
      console.error('获取机台详情失败:', error);
      alert('获取机台详情失败: ' + (error.message || '未知错误'));
    } finally {
      setIsLoadingMachineDetail(false);
    }
  };

  // 处理槽位切换
  const handleSlotChange = async (slot: string) => {
    setSelectedMoldPos(slot as any);
    if (selectedMachine) {
      setIsLoadingMachineDetail(true);
      try {
        const detail = await DashboardService.fetchMachineDetail({
          machine_id: selectedMachine.machine_id,
          slot: slot
        });
        setMachineDetail(detail);
      } catch (error: any) {
        console.error('获取机台详情失败:', error);
        alert('获取机台详情失败: ' + (error.message || '未知错误'));
      } finally {
        setIsLoadingMachineDetail(false);
      }
    }
  };

  // 处理访客点击操作按钮 - 显示登录提示
  const handleGuestActionClick = (actionName: string) => {
    setLoginPromptAction(actionName);
    setShowLoginPrompt(true);
  };

  // 跳转到登录页面
  const handleGoToLogin = () => {
    setShowLoginPrompt(false);
    // 清除访客认证数据
    AuthService.logout();
    // 刷新页面回到登录页
    window.location.href = '/';
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
      // 重置错误状态
      setMaintenanceError('');
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

  // 处理创建保养任务
  const handleCreateMaintenanceTask = async () => {
    if (!selectedMachine || !selectedMoldPos) {
      setMaintenanceError('请选择机台和模具位置');
      return;
    }

    // 优先使用 machineDetail 中的数据
    if (!machineDetail?.machine_id || !machineDetail?.current_mold?.mold_id) {
      setMaintenanceError('未找到对应的机台或模具信息');
      return;
    }

    setIsCreatingMaintenance(true);
    setMaintenanceError('');

    try {
      const requestData: CreateMaintenanceTaskRequest = {
        machine_id: machineDetail.machine_id,
        mold_id: machineDetail.current_mold.mold_id,
        user_id: '', // 将由 service 自动填充
        start_time: maintenanceTimeRange.start.replace('T', ' '),
        end_time: maintenanceTimeRange.end.replace('T', ' '),
        // description: '例行保养'
      };

      const response = await DashboardService.createMaintenanceTask(requestData);

      if (response?.code === 200) {
        setTaskType('SUCCESS');
      } else {
        setMaintenanceError(response.message || '创建保养任务失败');
      }
    } catch (error: any) {
      setMaintenanceError(error.message || '创建保养任务失败');
    } finally {
      setIsCreatingMaintenance(false);
    }
  };
// console.log("taskType:",taskType)
  // 处理创建报修任务
  const handleCreateRepairTask = async () => {
    if (!selectedMachine || !selectedMoldPos) {
      setRepairError('请选择机台和模具位置');
      return;
    }

    // 优先使用 machineDetail 中的数据
    if (!machineDetail?.machine_id || !machineDetail?.current_mold?.mold_id) {
      setRepairError('未找到对应的机台或模具信息');
      return;
    }

    setIsCreatingRepair(true);
    setRepairError('');

    try {
      const requestData = {
        machine_id: machineDetail.machine_id,
        mold_id: machineDetail.current_mold.mold_id
      };

      const response = await DashboardService.createRepairTask(requestData as CreateRepairTaskRequest);

      if (response?.code === 200) {
        setTaskType('REPAIR_SUCCESS');
      } else {
        setRepairError(response.message || '创建报修任务失败');
      }
    } catch (error: any) {
      setRepairError(error.message || '创建报修任务失败');
    } finally {
      setIsCreatingRepair(false);
    }
  };

  // 处理模具停用
  const handleDisableMold = async () => {
    if (!selectedMachine || !selectedMoldPos) {
      setDisableMoldError('请选择机台和模具位置');
      return;
    }

    // 优先使用 machineDetail 中的数据
    if (!machineDetail?.current_mold?.mold_id) {
      setDisableMoldError('未找到对应的模具信息');
      return;
    }

    setIsDisablingMold(true);
    setDisableMoldError('');

    try {
      const requestData = {
        mold_id: machineDetail.current_mold.mold_id,
        reason: '手动触发停用'
      };

      const response = await DashboardService.disableMold(requestData as DisableMoldRequest);

      if (response?.code === 200) {
        setTaskType('DEACTIVATE_SUCCESS');
      } else {
        setDisableMoldError(response.message || '模具停用失败');
      }
    } catch (error: any) {
      setDisableMoldError(error.message || '模具停用失败');
    } finally {
      setIsDisablingMold(false);
    }
  };

  // 处理模具安装/卸载
  const handleMoldAction = async (action: 'INSTALL' | 'UNINSTALL') => {
    if (!selectedMachine || !selectedMoldPos) {
      setMoldActionError('请选择机台和模具位置');
      return;
    }

    // 优先使用 machineDetail 中的数据
    if (!machineDetail?.machine_id || !machineDetail?.current_mold?.mold_id) {
      setMoldActionError('未找到对应的机台或模具信息');
      return;
    }

    if (action === 'INSTALL') {
      setIsInstallingMold(true);
    } else {
      setIsUninstallingMold(true);
    }
    setMoldActionError('');

    try {
      // slot 使用选中的 selectedMoldPos
      const requestData = {
        action,
        machine_id: machineDetail.machine_id,
        slot: selectedMoldPos,
        mold_id: machineDetail.current_mold.mold_id
      };

      const response = await DashboardService.moldAction(requestData as MoldActionRequest);
      if (response?.code === 200) {
        if (action === 'INSTALL') {
          setTaskType('INSTALL_SUCCESS');
        } else {
          setTaskType('UNINSTALL_SUCCESS');
        }
        setShowTaskModal(true);
      } else {
        setMoldActionError(response.message || '模具操作失败');
      }
    } catch (error: any) {
      setMoldActionError(error.message || '模具操作失败');
    } finally {
      if (action === 'INSTALL') {
        setIsInstallingMold(false);
      } else {
        setIsUninstallingMold(false);
      }
    }
  };

  // 处理打开安装模具弹窗
  const handleOpenInventoryModal = async () => {
    if (!selectedMachine) return;
    
    setIsFetchingInventory(true);
    setShowInventory(true);
    setInventoryFilter('');
    try {
      const data = await fetchInventoryMolds(selectedMachine.machine_id);
      setInventoryData(data);
    } catch (error: any) {
      console.error('获取库存模具清单失败:', error);
      alert('获取库存模具清单失败: ' + (error.message || '未知错误'));
    } finally {
      setIsFetchingInventory(false);
    }
  };

  const [selectedMoldInfo, setSelectedMoldInfo] = useState<any>(null);

  // 处理模具安装（从弹窗选择后）
  const handleInstallMold = async (mold: InventoryMold) => {
    if (!selectedMachine || !selectedMoldPos) return;
    
    setIsInstallingMold(true);
    try {
      await installMold(selectedMachine.machine_id, mold.mold_id, selectedMoldPos);
      setSelectedMoldInfo(mold);
      setTaskType('INSTALL_SUCCESS');
      setShowTaskModal(true);
      setShowInventory(false);
      // 刷新数据
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('模具安装失败:', error);
      alert('模具安装失败: ' + (error.message || '未知错误'));
    } finally {
      setIsInstallingMold(false);
    }
  };
  // console.log('allMachines:', allMachines);
  // console.log("selectedMoldPos:",selectedMoldPos)
  // console.log("selectedMachine:",selectedMachine)
  
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
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start group">
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
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
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
                  ].map((item) => (
                    <div key={item.title} className={`bg-slate-800/80 p-4 rounded-2xl border-[3px] ${item.color} flex flex-col gap-3 group hover:scale-[1.02] transition-all`}>
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
              onClick={() => {
                if (currentMaterialType !== '大材料') {
                  setCurrentMaterialType('大材料');
                  // 触发数据刷新
                  setRefreshTrigger(prev => prev + 1);
                }
              }}
              className={`px-4 py-0.5 rounded text-[10px] font-black transition-all ${currentMaterialType === '大材料' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              大材料模式
            </button>
            <button 
              onClick={() => {
                if (currentMaterialType !== '小材料') {
                  setCurrentMaterialType('小材料');
                  // 触发数据刷新
                  setRefreshTrigger(prev => prev + 1);
                }
              }}
              className={`px-4 py-0.5 rounded text-[10px] font-black transition-all ${currentMaterialType === '小材料' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              小材料模式
            </button>
          </div>
        </div>
        <h1 className="text-lg font-black tracking-tighter text-blue-100 flex items-center gap-2">
          <i className="fas fa-microchip text-blue-400 text-sm"></i>
          NXP SMART MOLD BOARD - 24 UNITS / 72 MOLDS
        </h1>
        <div className="bg-blue-900/30 px-5 py-2 rounded-xl border border-blue-800/50 text-blue-400 font-mono text-lg font-black shadow-[0_0_15px_rgba(30,58_138,0.3)]">
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
            {Array.isArray(productOptions) && productOptions.map(p => <option key={p} value={p}>{p}</option>)}
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
      <div className="grid grid-cols-6 gap-3 h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar" style={{ gridAutoRows: 'calc((100vh - 120px - 45px) / 4)' }}>
        {allMachines.map(machine=> (
          <div
            key={machine.machine_code}
            onClick={() => handleMachineClick(machine)}
            className={`bg-slate-900/40 ${machine.colorClass} rounded-xl p-2.5 flex flex-col justify-between cursor-pointer hover:bg-slate-800/60 transition-all relative group h-full overflow-hidden`}
          >
            {/* Machine Header */}
            <div className="flex flex-col mb-2">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-black text-blue-300">{machine.machine_code}</span>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-black text-blue-100 truncate max-w-[100px] leading-tight">{machine.currentProduct}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Molds Row (2, 3, or 4 molds) */}
            {/* 过滤掉 null 值的模具条目 */}
            {(() => {
              const validMoldEntries = Object.entries(machine.molds).filter(([_, m]) => m != null);
              return (
            <div className={`grid ${
              validMoldEntries.length === 4 ? 'grid-cols-4' :
              validMoldEntries.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            } gap-1.5 my-2 flex-1`}>
              {validMoldEntries.map(([pos, mold]: [string, any]) => {
                return (
                  <div key={pos} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold">{pos}</span>
                      {mold.isOffline && <span className="w-2.5 h-2.5 bg-red-600 rounded-full"></span>}
                    </div>
                    <div className={`h-6 rounded border-2 flex items-center justify-between px-1.5 text-[9px] font-black relative overflow-hidden ${
                      mold.status === 'EMPTY' ? 'bg-slate-500/5 border-slate-500/30 text-slate-500/0' :
                      mold.color === 'green' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                      mold.color === 'blue' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' :
                      mold.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' :
                      'bg-red-500/10 border-red-500/50 text-red-500'
                    }`}>
                      {mold.status !== 'EMPTY' && (
                        <>
                          <span>{mold.short_name || mold.mold_code || mold.mold_id}</span>
                          {mold.isShotWarning && (
                            <i className="fas fa-bolt text-[9px] text-amber-500 animate-pulse"></i>
                          )}
                        </>
                      )}
                    </div>
                    {/* Tiny Progress Bar - 使用 life_percent */}
                    {mold.status !== 'EMPTY' && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${
                            mold.life_percent > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                            mold.life_percent > 60 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-green-500'
                          }`} style={{ width: `${Math.min(100, mold.life_percent)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center px-0.5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Life</span>
                          <span className={`text-[9px] font-black ${
                            mold.life_percent > 90 ? 'text-red-400' :
                            mold.life_percent > 60 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {Math.round(mold.life_percent)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
              );
            })()}

            {/* Todo Badge in bottom-right corner */}
            {(Object.values(machine.molds) as any[]).reduce((acc: number, m: any) => acc + (m.taskCount || 0), 0) > 0 && (
              <div
                onClick={(e) => handleShowTodo(e, machine)}
                className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-500 text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-indigo-900/50 transition-all hover:scale-110 border border-indigo-400/50 z-10"
                title="点击查看待办清单"
              >
                {(Object.values(machine.molds) as any[]).reduce((acc: number, m: any) => acc + (m.taskCount || 0), 0)}
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
                <h2 className="text-xl font-black text-blue-100 uppercase tracking-widest">设备指挥中心: {machineDetail?.machine_code || selectedMachine.machine_code}</h2>
                <div className="flex gap-4 mt-1">
                  <p className="text-slate-500 text-xs font-mono">批次号: {(machineDetail as any)?.part_no || selectedMachine.part_no || '---'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMachine(null)} className="text-blue-400 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="flex">
              {/* Left Sidebar: Pos Selector */}
              <div className="w-24 bg-slate-950/50 border-r border-blue-900/30 flex flex-col p-2 gap-2">
                {machineDetail?.slots ? (
                  machineDetail.slots.map((slot) => {
                    const isActive = selectedMoldPos === slot.slot;
                    const getStatusColor = (status: string) => {
                      return status === 'EMPTY' ? 'text-slate-500' : 'text-green-500';
                    };
                    return (
                      <button
                        key={slot.slot}
                        onClick={() => handleSlotChange(slot.slot)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-blue-600 border-blue-400 scale-105 shadow-lg shadow-blue-900/50'
                            : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'
                        }`}
                      >
                        <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-500'}`}>{slot.slot}</span>
                        <span className={`text-[9px] font-bold ${getStatusColor(slot.status)}`}>{slot.short_name}</span>
                      </button>
                    );
                  })
                ) : (
                  Object.keys(selectedMachine.molds).map(pos => {
                    const mold = (selectedMachine.molds as any)[pos];
                    if (!mold) return null;
                    const isActive = selectedMoldPos === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => handleSlotChange(pos)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-blue-600 border-blue-400 scale-105 shadow-lg shadow-blue-900/50'
                            : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'
                        }`}
                      >
                        <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-500'}`}>{pos}</span>
                        <span className={`text-[9px] font-bold ${
                          mold.status === 'EMPTY' ? 'text-slate-500' : 'text-green-500'
                        }`}>{mold.mold_code || mold.mold_id}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Content: Detail & Action for selected POS */}
              {(() => {
                // 优先使用 API 返回的详情数据
                const currentMold = machineDetail?.current_mold;
                const mold = (selectedMachine.molds as any)[selectedMoldPos] || Object.values(selectedMachine.molds)[0];
                if (!mold && !currentMold) return null;

                // 获取维护状态显示
                const getMaintenanceStatusText = (status: string) => {
                  switch (status) {
                    case 'NORMAL': return '正常';
                    case 'WARNING': return '预警';
                    case 'CRITICAL': return '超期';
                    default: return '正常';
                  }
                };

                const getMaintenanceStatusColor = (status: string) => {
                  switch (status) {
                    case 'NORMAL': return 'bg-green-500/20 text-green-500';
                    case 'WARNING': return 'bg-yellow-500/20 text-yellow-500';
                    case 'CRITICAL': return 'bg-red-500/20 text-red-500';
                    default: return 'bg-green-500/20 text-green-500';
                  }
                };

                return (
                  <div className="flex-1 p-8 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-blue-950/50 p-5 rounded-2xl border border-blue-900">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-[10px] font-black text-blue-500 uppercase">模具状态 ({selectedMoldPos})</h3>
                          {isLoadingMachineDetail ? (
                            <span className="text-[10px] text-slate-500">加载中...</span>
                          ) : currentMold ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getMaintenanceStatusColor(currentMold.maintenance_status)}`}>
                              {getMaintenanceStatusText(currentMold.maintenance_status)}
                            </span>
                          ) : (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              mold.status === 'EMPTY' ? 'bg-slate-500/20 text-slate-500' :
                              mold.color === 'green' ? 'bg-green-500/20 text-green-500' :
                              mold.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                              mold.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                            }`}>{mold.statusText}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                          <span className="text-slate-400">模具编号:</span>
                          <span className="text-blue-200 font-bold">{currentMold?.mold_code || mold.mold_code || mold.mold_id}</span>

                          <span className="text-slate-400">模具全称:</span>
                          <span className="text-blue-200 font-bold">{currentMold?.full_name || mold.name || '-'}</span>

                          <span className="text-slate-400">模具简称:</span>
                          <span className="text-blue-200 font-bold">{currentMold?.short_name || mold.short_name || '-'}</span>

                          <span className="text-slate-400">待办任务:</span>
                          <span className="text-indigo-400 font-black">{currentMold?.pending_tasks ?? mold.taskCount} 项</span>

                          <span className="text-slate-400">模具型号:</span>
                          <span className="text-blue-200">{currentMold?.mold_category || mold.mold_category || mold.type || '-'}</span>

                          <span className="text-slate-400">累计冲次:</span>
                          <span className={`font-bold ${(currentMold?.current_shots || mold.current_shots) > (currentMold?.warning_threshold || mold.shotThreshold) ? 'text-amber-500' : 'text-blue-200'}`}>
                            {(currentMold?.current_shots || mold.current_shots).toLocaleString()}
                          </span>

                          <span className="text-slate-400">最大寿命:</span>
                          <span className="text-slate-400">{(currentMold?.max_shots || mold.max_shots || 0).toLocaleString()}</span>

                          <span className="text-slate-400">寿命使用:</span>
                          <span className={(currentMold?.life_percent || mold.life_percent) >= 90 ? 'text-red-500 font-bold' : (currentMold?.life_percent || mold.life_percent) >= 75 ? 'text-yellow-500' : 'text-green-500'}>
                            {currentMold?.life_percent || mold.life_percent}%
                          </span>

                          <span className="text-slate-400">维修状态:</span>
                          <span className={mold.status === 'EMPTY' ? 'text-slate-500' : mold.isOffline ? 'text-red-500 font-bold' : 'text-green-500'}>
                            {mold.status === 'EMPTY' ? '无' : mold.isOffline ? '已下线' : '正常'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-950/50 p-5 rounded-2xl border border-blue-900">
                        <h3 className="text-[10px] font-black text-blue-500 uppercase mb-4">保养指标</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">使用寿命</span>
                            <span className={(currentMold?.maintenance_status || mold.status) === 'CRITICAL' || (currentMold?.maintenance_status || mold.status) === 'OVERDUE' ? 'text-red-500' : 'text-blue-400'}>
                              {(currentMold?.current_shots || mold.current_shots || 0).toLocaleString()} / {(currentMold?.max_shots || mold.max_shots || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${(currentMold?.maintenance_status || mold.status) === 'CRITICAL' || (currentMold?.maintenance_status || mold.status) === 'OVERDUE' ? 'bg-red-500' : (currentMold?.maintenance_status || mold.status) === 'WARNING' || (currentMold?.maintenance_status || mold.status) === 'UPCOMING' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.max(0, Math.min(100, (((currentMold?.current_shots || mold.current_shots || 0) / (currentMold?.max_shots || mold.max_shots || 1)) * 100)))}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold mt-2">
                            <span className="text-slate-400">寿命使用率</span>
                            <span className={(currentMold?.life_percent || mold.life_percent) >= 90 ? 'text-red-500' : (currentMold?.life_percent || mold.life_percent) >= 75 ? 'text-yellow-500' : 'text-green-500'}>
                              {currentMold?.life_percent || mold.life_percent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase mb-4">执行操作</h3>
                      <button
                        onClick={() => isGuestMode ? handleGuestActionClick('创建保养任务') : handleAction('MAINTENANCE')}
                        disabled={(!isGuestMode && false) || !machineDetail?.operation}
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          (isGuestMode || !machineDetail?.operation) ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }`}
                      >
                        <i className="fas fa-tools"></i> 创建保养任务
                      </button>
                      <button
                        onClick={() => isGuestMode ? handleGuestActionClick('创建报修任务') : handleAction('REPAIR')}
                        disabled={(!isGuestMode && false) || !machineDetail?.operation}
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          (isGuestMode || !machineDetail?.operation) ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                        }`}
                      >
                        <i className="fas fa-exclamation-triangle"></i> 创建报修任务
                      </button>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={() => isGuestMode ? handleGuestActionClick('卸载模具') :(!machineDetail?.operation?"":handleMoldAction('UNINSTALL'))}
                          disabled={(!isGuestMode || !machineDetail?.operation)&& (isUninstallingMold || isInstallingMold)}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            (isGuestMode || !machineDetail?.operation) ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed' :
                            isUninstallingMold
                              ? 'bg-amber-600/40 text-amber-400 border border-amber-600/50 opacity-75'
                              : 'bg-amber-600/20 text-amber-500 border border-amber-600/30 hover:bg-amber-600/30'
                          } ${isInstallingMold && !isGuestMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isGuestMode ? (
                            '卸载模具'
                          ) : isUninstallingMold ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> 处理中...
                            </>
                          ) : (
                            '卸载模具'
                          )}
                        </button>
                        <button
                          onClick={() =>  isGuestMode ? handleGuestActionClick('安装模具') :( !machineDetail?.operation?"":handleOpenInventoryModal()) }
                          disabled={(!isGuestMode || !machineDetail?.operation)&& (isInstallingMold || isUninstallingMold)}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            (isGuestMode || !machineDetail?.operation) ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed' :
                            isInstallingMold
                              ? 'bg-blue-600/40 text-blue-300 border border-blue-500/50 opacity-75'
                              : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                          } ${isUninstallingMold && !isGuestMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isGuestMode ? (
                            <><i className="fas fa-plus-circle"></i> 安装模具</>
                          ) : isInstallingMold ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> 处理中...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-plus-circle"></i> 安装模具
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => isGuestMode ? handleGuestActionClick('模具停用') :(!machineDetail?.operation?"": handleAction('DEACTIVATE'))}
                        disabled={(!isGuestMode && false) || !machineDetail?.operation}
                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-1 ${
                           (isGuestMode || !machineDetail?.operation)  ? 'bg-slate-800/30 text-slate-600 border border-slate-700/50 cursor-not-allowed' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
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

      {/* 登录提示弹窗 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-2xl w-full max-w-md shadow-2xl">
            {/* 弹窗头部 */}
            <div className="p-5 border-b border-blue-500/30 bg-blue-900/20">
              <h3 className="text-lg font-black text-blue-100 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-lock text-blue-400"></i>
                需要登录
              </h3>
            </div>
            {/* 弹窗内容 */}
            <div className="p-6">
              <p className="text-slate-300 text-sm font-medium">
                <span className="text-blue-400 font-bold">{loginPromptAction}</span> 功能需要登录后才能使用
              </p>
            </div>
            {/* 弹窗按钮 */}
            <div className="p-5 border-t border-blue-500/30 flex gap-3 justify-end">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleGoToLogin}
                className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-blue-500/30 flex justify-between items-center bg-blue-900/20">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-blue-100 uppercase tracking-widest flex items-center gap-3">
                  <i className="fas fa-warehouse text-blue-400"></i>
                  库存模具清单
                </h2>
                {inventoryData?.header && (
                  <div className="flex items-center gap-4 text-[11px] font-bold mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 uppercase">当前设备:</span>
                      <span className="text-blue-400 font-bold">{inventoryData.header.machine_code || selectedMachine?.machine_code}</span>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 uppercase">当前产品:</span>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{inventoryData.header.current_product}</span>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 uppercase">当前批次:</span>
                      <span className="text-slate-300 font-mono">{inventoryData.header.lot_number}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Search Box */}
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input 
                    type="text" 
                    placeholder="搜索模具编号/封装类型..."
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-64 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setShowInventory(false)} 
                  className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
              {isFetchingInventory ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">正在获取库存数据...</p>
                </div>
              ) : inventoryData?.molds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-slate-500">
                  <i className="fas fa-box-open text-5xl opacity-20"></i>
                  <p className="font-bold uppercase tracking-widest text-xs">未找到可安装模具</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {(inventoryData?.molds || [])
                    .filter(mold => 
                      mold.mold_code.toLowerCase().includes(inventoryFilter.toLowerCase()) || 
                      mold.package_type.toLowerCase().includes(inventoryFilter.toLowerCase()) ||
                      mold.short_name.toLowerCase().includes(inventoryFilter.toLowerCase())
                    )
                    .map((mold) => (
                    <div 
                      key={mold.mold_id} 
                      className={`relative group bg-slate-900/50 border ${mold.can_install ? 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50' : 'border-slate-800/50 opacity-60'} rounded-2xl p-5 transition-all flex flex-col gap-4 overflow-hidden`}
                    >
                      {/* Background Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">{mold.short_name}</span>
                          <span className="text-lg font-black text-white tracking-tight">{mold.mold_code}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border ${
                          mold.status === 'IN_USE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          mold.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          mold.status === 'IDLE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {mold.status_label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 relative z-10">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">封装类型</span>
                          <span className="text-xs font-bold text-slate-200">{mold.package_type}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">库位/柜号</span>
                          <span className="text-xs font-bold text-slate-200">{mold.location} / {mold.cabinet_code}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">当前寿命</span>
                          <span className="text-xs font-bold text-slate-200">{mold.current_shots} / {mold.life_limit}</span>
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-500">消耗进度</span>
                            <span className={mold.progress > 90 ? 'text-red-400' : mold.progress > 75 ? 'text-amber-400' : 'text-blue-400'}>{mold.progress}%</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                mold.progress > 90 ? 'bg-red-500' : mold.progress > 75 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${mold.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-4 border-t border-white/5 flex gap-2 relative z-10">
                        <button 
                          onClick={() => mold.can_install && handleInstallMold(mold)}
                          disabled={!mold.can_install || isInstallingMold}
                          className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            mold.can_install 
                              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isInstallingMold ? (
                            <><i className="fas fa-spinner fa-spin"></i> 处理中</>
                          ) : (
                            <><i className="fas fa-arrow-down-to-bracket"></i> 安装到机台</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  {todoMachine.machine_code} 待办清单
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
                      <span className="text-[10px] font-bold text-slate-500">{mold.mold_code || mold.mold_id}</span>
                    </div>
                    {tasks.map((task) => {
                      const taskId = `${todoMachine.machine_code}-${mold.mold_id}-${task.type}`;
                      const isCompleted = completedTasks.has(taskId);

                      return (
                        <div key={taskId} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
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
                            onClick={() => toggleTaskComplete(todoMachine.machine_code, mold.mold_id, task.type)}
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

                {maintenanceError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-xs font-bold">{maintenanceError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    disabled={isCreatingMaintenance}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleCreateMaintenanceTask}
                    disabled={isCreatingMaintenance}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingMaintenance ? '创建中...' : '确认创建'}
                  </button>
                </div>
              </div>
            ) : taskType === 'REPAIR' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">创建报修任务</h2>
                  <p className="text-slate-400 text-xs">
                    请确认为机台 {selectedMachine?.machine_code} 模具 {(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id} 创建报修任务。
                  </p>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-red-900/30">
                  <p className="text-[10px] text-red-400 uppercase font-bold mb-2">报修信息</p>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300">
                      机台编号: <span className="text-blue-400 font-bold">{selectedMachine?.machine_code}</span>
                    </p>
                    <p className="text-slate-300">
                      模具编号: <span className="text-blue-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
                    </p>
                    <p className="text-slate-300">
                      模具位置: <span className="text-blue-400 font-bold">{selectedMoldPos}</span>
                    </p>
                  </div>
                </div>

                {repairError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-xs font-bold">{repairError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    disabled={isCreatingRepair}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateRepairTask}
                    disabled={isCreatingRepair}
                    className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingRepair ? '创建中...' : '确认报修'}
                  </button>
                </div>
              </div>
            ) : taskType === 'REPAIR_SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">报修任务已提交</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-red-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">任务详情</p>
                  <p className="text-xs text-slate-300">
                    机台: <span className="text-blue-400 font-bold">{selectedMachine?.machine_code}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    模具: <span className="text-blue-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    状态: <span className="text-red-400 font-bold">等待维修</span>
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
            ) : taskType === 'SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">任务已提交</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-green-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">任务详情</p>
                  <p className="text-xs text-slate-300">
                    机台: <span className="text-blue-400 font-bold">{selectedMachine?.machine_code}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    模具: <span className="text-blue-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
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
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">模具安装成功</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-blue-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">安装详情</p>
                  <p className="text-xs text-slate-300">
                    目标设备: <span className="text-blue-400 font-bold">{selectedMachine?.machine_code}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    安装位置: <span className="text-blue-400 font-bold">{selectedMoldPos}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    模具编号: <span className="text-blue-400 font-bold">{selectedMoldInfo?.short_name || selectedMoldInfo?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.short_name || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    状态更新: <span className="text-green-400 font-bold">已同步至生产看板</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                    setSelectedMoldInfo(null);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  确认并关闭
                </button>
              </div>
            ) : taskType === 'UNINSTALL_SUCCESS' ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  <i className="fas fa-check-double"></i>
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">模具卸载成功</h2>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-amber-900/30 mb-8 text-left space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">卸载详情</p>
                  <p className="text-xs text-slate-300">
                    来源设备: <span className="text-blue-400 font-bold">{selectedMachine?.machine_code}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    卸载位置: <span className="text-blue-400 font-bold">{selectedMoldPos}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    模具编号: <span className="text-blue-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    状态更新: <span className="text-green-400 font-bold">已同步至生产看板</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20"
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
                    您正在停用模具: <span className="text-red-400 font-bold">{(selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id}</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    停用后，该模具将无法再被安装到任何机台上，且会从生产可用列表中移除。此操作不可逆，请谨慎操作。
                  </p>
                </div>
                {disableMoldError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-center">
                    <p className="text-red-400 text-xs font-bold">{disableMoldError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    disabled={isDisablingMold}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDisableMold}
                    disabled={isDisablingMold}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDisablingMold ? '停用中...' : '确认停用'}
                  </button>
                </div>
              </div>
            ) : taskType === 'DEACTIVATE_SUCCESS' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-check text-slate-300 text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">模具已停用</h2>
                <p className="text-slate-400 text-sm mb-10 leading-relaxed px-4">
                  模具 {machineDetail?.current_mold?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_code || (selectedMachine?.molds as any)[selectedMoldPos]?.mold_id} 已标记为"已停用"状态。相关数据已同步至模具台账。
                </p>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedMachine(null);
                    setMachineDetail(null);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 py-3.5 rounded-xl font-bold text-sm transition-all"
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
