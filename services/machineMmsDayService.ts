import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

export interface MachineMmsDayItem {
  id: number;
  day: string;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export interface MachineMmsDayListResponse {
  code: number;
  message: string;
  data: MachineMmsDayItem;
}

export interface UpdateMachineMmsDayParams {
  id: number;
  day: string;
}

export interface UpdateMachineMmsDayResponse {
  code: number;
  message: string;
  data: null;
}

export async function fetchMachineMmsDay(): Promise<MachineMmsDayListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('当前用户未设置部门信息');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-mms-day/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      department: authData.department
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取保养提醒周期失败');
  }

  return data as MachineMmsDayListResponse;
}

export async function updateMachineMmsDay(
  params: UpdateMachineMmsDayParams
): Promise<UpdateMachineMmsDayResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('当前用户未设置部门信息');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-mms-day/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      ...params,
      department: authData.department
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '更新保养提醒周期失败');
  }

  return data as UpdateMachineMmsDayResponse;
}

export const MachineMmsDayService = {
  fetchMachineMmsDay,
  updateMachineMmsDay
};