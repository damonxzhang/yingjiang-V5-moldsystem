import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

// ==================== 机台台账列表 API ====================

/**
 * 机台列表项 - API 返回的数据结构
 */
export interface MachineBaseListItem {
  machine_id: number;
  machine_code: string;
  status: 'NORMAL' | 'DISABLED' | 'FAULT' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  location: string;
  type: string;
  part_no: string;
  total_slots: number;
  department: string;
  created_at: string;
}

/**
 * 机台列表响应
 */
export interface MachineBaseListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    list: MachineBaseListItem[];
  };
}

/**
 * 机台列表请求参数
 */
export interface FetchMachineBaseListParams {
  department: string;
  machine_code?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

/**
 * 获取机台台账列表
 * @param params 查询参数
 * @returns Promise<MachineBaseListResponse>
 */
export async function fetchMachineBaseList(
  params: FetchMachineBaseListParams
): Promise<MachineBaseListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    department:authData.department || params.department ||  'ALL',
    machine_code: params.machine_code || '',
    status: params.status || '',
    page: params.page || 1,
    page_size: params.page_size || 20
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-base/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取机台列表失败');
  }

  return data as MachineBaseListResponse;
}

// ==================== 机台详情 API ====================

/**
 * 机台详情数据
 */
export interface MachineBaseDetailItem {
  machine_id: number;
  machine_code: string;
  status: string;
  location: string;
  type: string;
  part_no: string;
  total_slots: number;
  department_id: number;
  department: string;
}

/**
 * 机台详情响应
 */
export interface MachineBaseDetailResponse {
  code: number;
  message: string;
  data: MachineBaseDetailItem;
}

/**
 * 获取机台详情
 * @param machineId 机台ID
 * @returns Promise<MachineBaseDetailResponse>
 */
export async function fetchMachineBaseDetail(
  machineId: number
): Promise<MachineBaseDetailResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-base/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({ machine_id: machineId })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取机台详情失败');
  }

  return data as MachineBaseDetailResponse;
}

// ==================== 保存机台 API ====================

/**
 * 保存机台请求参数
 */
export interface SaveMachineBaseParams {
  machine_id?: number | null;
  machine_code: string;
  department: string;
  status?: string;
  location?: string;
  type?: string;
  part_no?: string;
  total_slots?: number;
}

/**
 * 保存机台响应
 */
export interface SaveMachineBaseResponse {
  code: number;
  message: string;
  data: {
    machine_id: number;
  };
}

/**
 * 保存机台（新增/编辑）
 * @param params 保存参数
 * @returns Promise<SaveMachineBaseResponse>
 */
export async function saveMachineBase(
  params: SaveMachineBaseParams
): Promise<SaveMachineBaseResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-base/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '保存机台失败');
  }

  return data as SaveMachineBaseResponse;
}

// ==================== 删除机台 API ====================

/**
 * 删除机台响应
 */
export interface DeleteMachineBaseResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}

/**
 * 删除机台
 * @param machineId 机台ID
 * @returns Promise<DeleteMachineBaseResponse>
 */
export async function deleteMachineBase(
  machineId: number
): Promise<DeleteMachineBaseResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-base/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({ machine_id: machineId })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '删除机台失败');
  }

  return data as DeleteMachineBaseResponse;
}
