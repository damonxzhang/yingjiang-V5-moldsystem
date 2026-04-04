import { AuthService } from './authService';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

// 可绑定模具列表项
export interface AvailableMoldItem {
  mold_id: number;
  mold_code: string;
  short_name: string;
  department: string;
  status: 'IDLE' | 'IN_USE' | 'MAINTENANCE' | 'REPAIR' | 'DEACTIVATED';
  status_label: string;
  location: string;
  cabinet_code: string;
  package_type: string;
  current_shots: string;
  life_limit: string;
  progress: number;
  can_install: boolean;
}

// 可绑定模具列表响应
export interface AvailableMoldsResponse {
  code: number;
  message: string;
  data: {
    header: {
      machine_code: string;
      current_product: string;
      lot_number: string;
    } | null;
    molds: AvailableMoldItem[];
  };
}

// 可绑定模具列表请求参数
export interface FetchAvailableMoldsParams {
  user_id: string;
  department: string;
  mold_code?: string;
}

// 机台编号项
export interface MachineCodeItem {
  machine_id: number;
  machine_code: string;
}

// 机台编号响应
export interface MachineCodesResponse {
  code: number;
  message: string;
  data: MachineCodeItem[];
}

// 模台信息项
export interface MachineSlot {
  slot: string;
  mold_id: number | null;
  mold_code: string | null;
  mold_name: string | null;
  is_bound: string;
  slot_status: string | null;
}

// 模台信息响应
export interface MachineSlotsResponse {
  code: number;
  message: string;
  data: MachineSlot[];
}

// 绑定请求参数
export interface BindMachineSlotParams {
  mold_id: number;
  machine_id: number;
  slot: string;
}

// 绑定响应
export interface BindMachineSlotResponse {
  code: number;
  message: string;
}

/**
 * 获取可绑定模具列表
 * department 参数从 authData 中获取
 */
export async function fetchAvailableMolds(
  moldCode?: string
): Promise<AvailableMoldItem[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: FetchAvailableMoldsParams = {
    user_id: authData.user_id,
    department: authData.department || 'ALL',
    mold_code: moldCode
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/molds/available`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取可绑定模具列表失败');
  }

  return data.data?.molds || [];
}

/**
 * 获取所有机台编号
 */
export async function fetchMachineCodes(): Promise<MachineCodeItem[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    department: authData.department || 'ALL'
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/machines/codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data: MachineCodesResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取机台编号失败');
  }

  return data.data || [];
}

/**
 * 获取指定机台的模台信息
 */
export async function fetchMachineSlots(machineId: number): Promise<MachineSlot[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    machine_id: machineId
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-slots/machine-slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data: MachineSlotsResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取模台信息失败');
  }

  return data.data || [];
}

/**
 * 绑定模具和模台
 */
export async function bindMachineSlot(moldId: number, machineId: number, slot: string): Promise<void> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: BindMachineSlotParams = {
    mold_id: moldId,
    machine_id: machineId,
    slot: slot
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-slots/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data: BindMachineSlotResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '绑定失败');
  }
}

/**
 * 模具绑定服务
 */
export const MoldBindingService = {
  fetchAvailableMolds,
  fetchMachineCodes,
  fetchMachineSlots,
  bindMachineSlot
};
