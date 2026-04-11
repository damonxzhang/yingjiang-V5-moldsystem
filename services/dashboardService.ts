import { AuthService } from './authService';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

// 模具状态类型
export interface DashboardMold {
  mold_id: string;
  mold_code: string;
  name: string;
  current_shots: number;
  max_shots: number;
  mold_category?: string;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE';
  slot?: string;
}

// 机台状态类型
export interface DashboardMachine {
  machine_id: string;
  machine_code: string;
  status: 'NORMAL' | 'MAINTENANCE_DUE' | 'OVERDUE' | 'BUYOFF' | 'DISABLED' | 'OFFLINE';
  part_no: string;
  mold_count: number;
  molds: DashboardMold[];
  pending_tasks: number;
}

// 看板统计摘要
export interface DashboardSummary {
  total: number;
  normal: number;
  warning: number;
  critical: number;
}

// 看板数据响应
export interface DashboardStatusResponse {
  department: string;
  summary: DashboardSummary;
  machines: DashboardMachine[];
}

// 请求参数类型
export interface DashboardStatusRequest {
  user_id: string;
  department: string;           // 必填, 过滤部门: 大材料, 小材料, ALL (查看全部)
  only_alerts?: boolean;
  product_type?: string;
  machine_code?: string;
  mold_code?: string;
  only_producible?: boolean;
  only_abnormal?: boolean;
}

/**
 * 获取看板机台状态数据
 */
export async function fetchDashboardMachinesStatus(
  params: Partial<DashboardStatusRequest> = {}
): Promise<DashboardStatusResponse> {
  // 从认证信息中获取 user_id
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: DashboardStatusRequest = {
    user_id: authData.user_id,
    department: '大材料',         // 默认值为大材料
    only_alerts: false,
    product_type: '',
    machine_code: '',
    mold_code: '',
    only_producible: false,
    only_abnormal: false,
    ...params
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/machines/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  // 处理返回数据，兼容不同的响应格式
  if (data.code !== undefined && data.data !== undefined) {
    // 格式: { code: 200, message: 'success', data: {...} }
    if (data.code !== 200) {
      throw new Error(data.message || '获取看板数据失败');
    }
    return data.data as DashboardStatusResponse;
  }

  // 直接返回数据格式
  return data as DashboardStatusResponse;
}

/**
 * 获取机台基础列表 (用于下拉选择)
 */
export async function fetchMachineList(department: string = 'ALL'): Promise<{ machine_id: string; machine_code: string }[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/machines/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        user_id: authData.user_id,
        department: department
      })
    });

    const data = await response.json();
    
    if (data.code === 200 && Array.isArray(data.data)) {
      // 接口返回字符串数组，映射为统一对象格式
      return data.data.map((code: string) => ({
        machine_id: code,
        machine_code: code
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch machine list:', error);
    return [];
  }
}

/**
 * 获取模台基础列表 (用于下拉选择)
 */
export async function fetchMoldTableList(department: string = 'ALL'): Promise<{ table_id: string; table_code: string }[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/mold-tables/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        user_id: authData.user_id,
        department: department
      })
    });

    const data = await response.json();
    
    if (data.code === 200 && Array.isArray(data.data)) {
      return data.data.map((code: string) => ({
        table_id: code,
        table_code: code
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch mold table list:', error);
    return [];
  }
}

// 创建保养任务请求参数
export interface CreateMaintenanceTaskRequest {
  machine_id: string;
  mold_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  description?: string;
}

// 创建保养任务响应
export interface CreateMaintenanceTaskResponse {
  code: number;
  success: boolean;
  task_id?: string;
  message?: string;
}

/**
 * 创建保养任务
 */
export async function createMaintenanceTask(
  params: CreateMaintenanceTaskRequest
): Promise<CreateMaintenanceTaskResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    ...params,
    user_id: authData.user_id
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/tasks/maintenance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '创建保养任务失败');
  }

  return data as CreateMaintenanceTaskResponse;
}

// 创建报修任务请求参数
export interface CreateRepairTaskRequest {
  machine_id: string;
  mold_id: string;
  user_id: string;
}

// 创建报修任务响应
export interface CreateRepairTaskResponse {
  code: number;
  success: boolean;
  task_id?: string;
  message?: string;
}

/**
 * 创建报修任务
 */
export async function createRepairTask(
  params: CreateRepairTaskRequest
): Promise<CreateRepairTaskResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    ...params,
    user_id: String(authData.user_id)
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/tasks/repair/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '创建报修任务失败');
  }

  return data as CreateRepairTaskResponse;
}

/**
 * 库存模具列表数据类型
 */
export interface InventoryMold {
  mold_id: number;
  mold_code: string;
  short_name: string;
  status: 'IN_USE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE';
  status_label: string;
  location: string;
  cabinet_code: string;
  package_type: string;
  mold_category: string;
  current_shots: string;
  life_limit: string;
  progress: number;
  can_install: boolean;
}

export interface InventoryResponse {
  header: {
    machine_code: string;
    current_product: string;
    lot_number: string;
  };
  molds: InventoryMold[];
}

/**
 * 获取库存模具清单
 */
export async function fetchInventoryMolds(machineId: string, userId: string = '1'): Promise<InventoryResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  console.log('fetchInventoryMolds request:', { machine_id: String(machineId), user_id: String(userId) });
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/mold/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({ 
      machine_id: String(machineId),
      user_id: String(userId)
    })
  });

  const data = await response.json();
  console.log('fetchInventoryMolds response:', data);

  if (data.code !== 200) {
    throw new Error(data.message || '获取库存模具清单失败');
  }

  return data.data as InventoryResponse;
}

/**
 * 执行模具安装
 */
export async function installMold(machineId: string, moldId: number, slot: string, userId: string = '1'): Promise<any> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    action: 'INSTALL',
    machine_id: String(machineId),
    slot: slot,
    mold_id: String(moldId),
    user_id: String(userId)
  };

  console.log('installMold request:', requestBody);
  const response = await fetch(`${API_BASE_URL}/api/admin/machine/install`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  console.log('installMold response:', data);

  if (data.code !== 200) {
    throw new Error(data.message || '模具安装失败');
  }

  return data;
}

// 模具停用请求参数
export interface DisableMoldRequest {
  mold_id: string;
  reason: string;
  user_id: string;
}

// 模具停用响应
export interface DisableMoldResponse {
  code: number;
  success: boolean;
  message?: string;
}

/**
 * 模具停用
 */
export async function disableMold(
  params: DisableMoldRequest
): Promise<DisableMoldResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    ...params,
    user_id: String(authData.user_id)
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '模具停用失败');
  }

  return data as DisableMoldResponse;
}

// 模具安装/卸载请求参数
export interface MoldActionRequest {
  action: 'INSTALL' | 'UNINSTALL';
  machine_id: string;
  slot: string;
  mold_id: string;
  user_id: string;
}

// 模具安装/卸载响应
export interface MoldActionResponse {
  code: number;
  success: boolean;
  message?: string;
}

/**
 * 模具安装/卸载操作
 */
export async function moldAction(
  params: MoldActionRequest
): Promise<MoldActionResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    ...params,
    user_id: String(authData.user_id)
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine/mold-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '模具操作失败');
  }

  return data as MoldActionResponse;
}

// 槽位信息
export interface MachineSlot {
  slot: string;
  short_name: string;
  status: string;
}

// 当前模具详细信息
export interface CurrentMoldDetail {
  mold_id: string;
  mold_code: string;
  short_name: string;
  full_name: string;
  type: string;
  mold_category: string;
  pending_tasks: number;
  current_shots: number;
  warning_threshold: number;
  maintenance_status: string;
  remaining_life: number;
  total_life: number;
  life_percent: number;
}

// 机台详情响应
export interface MachineDetailResponse {
  machine_id: string;
  machine_code: string;
  product_type: string;
  batch_no: string;
  pending_tasks: number;
  slots: MachineSlot[];
  current_mold: CurrentMoldDetail;
  department: string;
  operation?: boolean;
}

// 机台详情请求参数
export interface MachineDetailRequest {
  user_id: string;
  machine_id: string;
  slot?: string;
}

/**
 * 获取机台及模具槽位详细信息
 */
export async function fetchMachineDetail(
  params: Omit<MachineDetailRequest, 'user_id'>
): Promise<MachineDetailResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: MachineDetailRequest = {
    user_id: authData.user_id,
    machine_id: params.machine_id,
    slot: params.slot
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取机台详情失败');
  }

  // 处理返回数据，兼容不同的响应格式
  if (data.code !== undefined && data.data !== undefined) {
    // 格式: { code: 200, message: 'success', data: {...} }
    if (data.code !== 200) {
      throw new Error(data.message || '获取机台详情失败');
    }
    return data.data as MachineDetailResponse;
  }

  // 直接返回数据格式
  return data as MachineDetailResponse;
}

// 机台编号列表响应
export interface MachineCodesResponse {
  code: number;
  message: string;
  data: {
    machine_id: number;
    machine_code: string;
  }[];
}

// 机台编号选项类型
export interface MachineCodeOption {
  machine_id: number;
  machine_code: string;
}

/**
 * 获取所有机台编号列表
 */
export async function fetchMachineCodes(): Promise<MachineCodeOption[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/machines/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        user_id: authData.user_id,
        department: 'ALL'
      })
    });

    const data = await response.json();

    if (data.code === 200 && Array.isArray(data.data)) {
      return data.data as MachineCodeOption[];
    }

    if (Array.isArray(data)) {
      return data as MachineCodeOption[];
    }

    return [];
  } catch (error) {
    console.error('获取机台编号列表失败:', error);
    return [];
  }
}

// 机台待办事项类型
export type TodoType = 'MAINTENANCE' | 'REPAIR' | 'INSTALL' | 'UNINSTALL' | 'DISABLE';

// 机台待办事项
export interface MachineTodo {
  id: number;
  machine_id: number;
  mold_id: number;
  mold_code: string;
  slot: string;
  user_id: number;
  user_name: string;
  created_at: string;
  is_read: number;
  type: TodoType;
  payload: Record<string, any>;
}

// 机台待办列表响应
export interface MachineTodoListResponse {
  code: number;
  message: string;
  data: MachineTodo[];
}

// 机台待办列表请求参数
export interface MachineTodoListRequest {
  machine_id: string;
}

/**
 * 获取机台待办清单列表
 */
export async function fetchMachineTodoList(
  params: MachineTodoListRequest
): Promise<MachineTodo[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine/todo-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      machine_id: params.machine_id
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取待办清单失败');
  }

  // 确保返回的是数组
  if (Array.isArray(data.data)) {
    return data.data as MachineTodo[];
  }
  
  // 如果 data.data 不是数组，返回空数组
  return [];
}

/**
 * Dashboard 服务
 */
export const DashboardService = {
  fetchDashboardMachinesStatus,
  fetchMachineDetail,
  fetchMachineCodes,
  createMaintenanceTask,
  createRepairTask,
  disableMold,
  moldAction,
  fetchMachineTodoList
};
