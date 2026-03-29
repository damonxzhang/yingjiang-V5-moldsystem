import { AuthService } from './authService';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

// ==================== 模具台账列表 API ====================

// 模具列表项
export interface MoldListItem {
  mold_id: number;
  mold_code: string;
  short_name: string;
  full_name: string;
  mold_category: string;
  product_type: string;
  location: string;
  thickness: string;
  package_type: string;
  package_size: string;
  current_shots: number;
  max_shots: number;
  maintenance_cycle: string;
  start_time: string;
  current_machine: string;
  status: 'IDLE' | 'IN_USE' | 'MAINTENANCE' | 'DEACTIVATED';
  department: string;
}

// 模具列表响应
export interface MoldListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    list: MoldListItem[];
  };
}

// 模具列表请求参数
export interface FetchMoldListParams {
  user_id: string;
  page?: number;
  page_size?: number;
}

/**
 * 获取模具台账列表
 */
export async function fetchMoldList(
  params: Omit<FetchMoldListParams, 'user_id'>
): Promise<MoldListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: FetchMoldListParams = {
    user_id: '5',
    page: params.page || 1,
    page_size: params.page_size || 10
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取模具列表失败');
  }

  return data as MoldListResponse;
}

// ==================== 模具详情 API ====================

// 模具详情数据
export interface MoldDetailItem {
  mold_id: number;
  mold_code: string;
  name: string;
  full_name: string;
  short_name: string;
  thickness: string;
  mold_category: string;
  product_type: string;
  package_type: string;
  package_size: string;
  pin_code: string;
  department: string;
  life_limit: number;
  maintenance_cycle: string;
  start_time: string;
  current_shots: number;
  status: 'IDLE' | 'IN_USE' | 'MAINTENANCE' | 'DEACTIVATED';
  location: string;
  machine_code: string | null;
}

// 模具详情响应
export interface MoldDetailResponse {
  code: number;
  message: string;
  data: MoldDetailItem;
}

// 模具详情请求参数
export interface FetchMoldDetailParams {
  user_id: string;
  mold_id: number;
}

/**
 * 获取模具完整详情
 */
export async function fetchMoldDetail(
  moldId: number
): Promise<MoldDetailResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: FetchMoldDetailParams = {
    user_id: authData.user_id,
    mold_id: moldId
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取模具详情失败');
  }

  return data as MoldDetailResponse;
}

// ==================== 模具保存 API ====================

// 模具保存请求参数
export interface SaveMoldParams {
  user_id: string;
  mold_id?: number;      // 编辑时必填，新增时不传
  mold_code: string;     // 模具编号
  name?: string;         // 新增时为空，编辑时为详情接口中的 name
  short_name: string;    // 模具简名
  life_limit?: number;   // 暂时为空
}

// 模具保存响应
export interface SaveMoldResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
    mold_id: number;
    message: string;
  };
}

/**
 * 保存模具档案（新增/编辑）
 */
export async function saveMold(
  params: Omit<SaveMoldParams, 'user_id'>
): Promise<SaveMoldResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: SaveMoldParams = {
    user_id: authData.user_id,
    mold_id: params.mold_id,
    mold_code: params.mold_code,
    name: params.name,
    short_name: params.short_name,
    life_limit: params.life_limit
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '保存模具失败');
  }

  return data as SaveMoldResponse;
}

/**
 * 模具管理服务
 */
export const MoldManageService = {
  fetchMoldList,
  fetchMoldDetail,
  saveMold
};
