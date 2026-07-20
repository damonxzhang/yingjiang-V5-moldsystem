import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

export interface MaintenanceOptionItem {
  id: number;
  name: string;
  template_month: string;
  template_comment: string;
  department_id: number;
  comment: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceOptionsListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    list: MaintenanceOptionItem[];
  };
}

export interface FetchMaintenanceOptionsParams {
  name?: string;
  template_month?: string;
  status?: number;
  page?: number;
  page_size?: number;
}

export interface ToggleMaintenanceOptionStatusParams {
  id: string;
  status: number;
}

export interface ToggleMaintenanceOptionStatusResponse {
  code: number;
  message: string;
  data: null;
}

export interface SaveMaintenanceOptionParams {
  name: string;
  template_month: string;
  department: string;
  comment?: string;
  status: number;
}

export interface SaveMaintenanceOptionResponse {
  code: number;
  message: string;
  data: null;
}

export interface UpdateMaintenanceOptionParams {
  id: string;
  name?: string;
  template_month?: string;
  comment?: string;
  status: number;
}

export interface UpdateMaintenanceOptionResponse {
  code: number;
  message: string;
  data: null;
}

export interface TemplateMonthItem {
  template_month: string;
  template_comment: string;
}

export interface TemplateMonthResponse {
  code: number;
  message: string;
  data: TemplateMonthItem[];
}

const inFlightRequests = new Map<string, Promise<MaintenanceOptionsListResponse>>();

function getRequestKey(params: FetchMaintenanceOptionsParams, department: string): string {
  return JSON.stringify({
    department,
    name: params.name || '',
    template_month: params.template_month || '',
    status: params.status || '',
    page: params.page || 1,
    page_size: params.page_size || 20
  });
}

export async function fetchMaintenanceOptions(
  params: FetchMaintenanceOptionsParams
): Promise<MaintenanceOptionsListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('用户部门信息缺失');
  }

  const requestKey = getRequestKey(params, authData.department);
  
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/options-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          department: authData.department,
          name: params.name || '',
          template_month: params.template_month || '',
          status: params.status || '',
          page: params.page || 1,
          page_size: params.page_size || 20
        })
      });

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error(data.message || '获取保养选项列表失败');
      }

      return data as MaintenanceOptionsListResponse;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export async function toggleMaintenanceOptionStatus(
  params: ToggleMaintenanceOptionStatusParams
): Promise<ToggleMaintenanceOptionStatusResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      id: params.id,
      status: params.status
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '切换保养选项状态失败');
  }

  return data as ToggleMaintenanceOptionStatusResponse;
}

export async function saveMaintenanceOption(
  params: SaveMaintenanceOptionParams
): Promise<SaveMaintenanceOptionResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      name: params.name,
      template_month: params.template_month,
      department: params.department,
      comment: params.comment || '',
      status: params.status
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '保存保养选项失败');
  }

  return data as SaveMaintenanceOptionResponse;
}

export async function updateMaintenanceOption(
  params: UpdateMaintenanceOptionParams
): Promise<UpdateMaintenanceOptionResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('用户部门信息缺失');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      id: params.id,
      name: params.name || '',
      department: authData.department,
      template_month: params.template_month || '',
      comment: params.comment || '',
      status: params.status
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '更新保养选项失败');
  }

  return data as UpdateMaintenanceOptionResponse;
}

export async function fetchTemplateMonth(
  department: string
): Promise<TemplateMonthResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/template-month`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      department
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取保养模板月份失败');
  }

  return data as TemplateMonthResponse;
}

export const MaintenanceOptionService = {
  fetchMaintenanceOptions,
  toggleMaintenanceOptionStatus,
  saveMaintenanceOption,
  updateMaintenanceOption,
  fetchTemplateMonth
};