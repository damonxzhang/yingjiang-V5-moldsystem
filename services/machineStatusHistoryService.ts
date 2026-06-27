import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

/**
 * 机台状态变更记录项
 */
export interface MachineStatusHistoryItem {
  id: number;
  machine_id: number;
  machine_code: string;
  action: 'ENABLE' | 'DISABLE' | 'ABNORMAL' | 'NORMAL';
  reason: string;
  operator_id: number;
  operator_name: string;
  created_at: string;
}

/**
 * 机台状态变更记录响应
 */
export interface MachineStatusHistoryResponse {
  code: number;
  message: string;
  data: {
    total: number;
    items: MachineStatusHistoryItem[];
    page: number;
    page_size: number;
  };
}

/**
 * 机台状态变更记录请求参数
 */
export interface FetchMachineStatusHistoryParams {
  department?: string;
  page?: number;
  page_size?: number;
}

/**
 * 获取机台状态变更记录列表
 * @param params 查询参数
 * @returns Promise<MachineStatusHistoryResponse>
 */
export async function fetchMachineStatusHistory(
  params: FetchMachineStatusHistoryParams
): Promise<MachineStatusHistoryResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody = {
    department: params.department || 'ALL',
    page: params.page || 1,
    page_size: params.page_size || 20
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine/status-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取机台状态变更记录失败');
  }

  return data as MachineStatusHistoryResponse;
}
