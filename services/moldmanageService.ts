import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

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
  status: 'IDLE' | 'IN_USE' | 'MAINTENANCE' | 'REPAIR' | 'DEACTIVATED' | 'SCRAP';
  mold_status: string; // 模具启用状态 (启用 / 停用)
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
  department: string;  // 必填, 从用户信息中获取: 大材料, 小材料, ALL (查看全部)
  page?: number;
  page_size?: number;
  mold_code?: string;  // 模具编号筛选
  status?: string;     // 状态筛选 (IDLE: 闲置, IN_USE: 使用中, MAINTENANCE: 保养中, REPAIR: 维修中, SCRAP: 停用)
  responsible_person?: string;  // 负责人模糊查询
  product_type?: string;        // 产品类型模糊查询
  location?: string;            // 位置模糊查询
  shots_min?: string;           // SHOT COUNT 下限
  shots_max?: string;           // SHOT COUNT 上限
}

/**
 * 获取模具台账列表
 */
export async function fetchMoldList(
  params: Omit<FetchMoldListParams, 'user_id' | 'department'>
): Promise<MoldListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  if (!authData.department) {
    throw new Error('当前用户未设置部门信息');
  }

  const baseBody: FetchMoldListParams = {
    user_id: authData.user_id,
    department: authData.department,
    page: params.page || 1,
    page_size: params.page_size || 20
  };

  if (params.mold_code) baseBody.mold_code = params.mold_code;
  if (params.status) baseBody.status = params.status;
  if (params.responsible_person) baseBody.responsible_person = params.responsible_person;
  if (params.product_type) baseBody.product_type = params.product_type;
  if (params.location) baseBody.location = params.location;
  if (params.shots_min) baseBody.shots_min = params.shots_min;
  if (params.shots_max) baseBody.shots_max = params.shots_max;

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(baseBody)
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
  department: string;           // 所属部门
  mold_id?: number;             // 编辑时必填，新增时不传
  mold_code: string;            // 模具编号
  name?: string;                // 新增时为空，编辑时为详情接口中的 name
  full_name?: string;           // 新增时为空，编辑时为详情接口中的 full_name
  short_name: string;           // 模具简名
  thickness: string;            // 模具厚度
  mold_category: string;        // 模具分类
  product_type: string;         // 产品类型
  package_type: string;         // 封装规格
  package_size?: string;        // 新增时为空，编辑时为详情接口中的 package_size
  pin_code?: string;            // PIN CODE
  life_limit?: number;          // 新增时为空，编辑时为详情接口中的 life_limit
  maintenance_cycle: string;    // 保养周期
  start_time: string;           // 开始保养时间
  location?: string;            // 新增时为空，编辑时为详情接口中的 location
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
    department: params.department,
    mold_id: params.mold_id,
    mold_code: params.mold_code,
    name: params.name,
    full_name: params.full_name,
    short_name: params.short_name,
    thickness: params.thickness,
    mold_category: params.mold_category,
    product_type: params.product_type,
    package_type: params.package_type,
    package_size: params.package_size,
    pin_code: params.pin_code,
    life_limit: params.life_limit,
    maintenance_cycle: params.maintenance_cycle,
    start_time: params.start_time,
    location: params.location
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

// ==================== 模具内部配件清单 API ====================

export interface InternalComponentItem {
  component_id: number;
  mold_id: string;
  category: string;
  name: string;
  is_spare: 'Y' | 'N';
  sn: string;
  life_limit: string;
  current_shots: string;
  created_at: string;
  updated_at: string;
}

export interface InternalComponentsResponse {
  code: number;
  message: string;
  data: {
    upper?: InternalComponentItem[];
    lower?: InternalComponentItem[];
    transfer?: InternalComponentItem[];
  };
}

/**
 * 获取模具内部配件清单
 */
export async function fetchInternalComponents(
  moldId: string
): Promise<InternalComponentsResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/internal-components`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({ mold_id: moldId })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '获取内部配件清单失败');
  }

  return data as InternalComponentsResponse;
}

// ==================== 模具状态切换 API ====================

// 模具状态切换请求参数
export interface ToggleStatusParams {
  user_id: string; // 用户ID
  mold_id: string; // 待操作的模具 ID
  status: 'IDLE' | 'DEACTIVATED'; // 目标状态: IDLE (启用/开启), DEACTIVATED (停用/禁用)
}

// 模具状态切换响应
export interface ToggleStatusResponse {
  code: number;
  message: string;
  data: {
    success: boolean; // 执行结果
    message: string; // 提示消息
  };
}

/**
 * 切换模具状态（启用/停用）
 */
export async function toggleStatus(
  params: Omit<ToggleStatusParams, 'user_id'>
): Promise<ToggleStatusResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const requestBody: ToggleStatusParams = {
    user_id: authData.user_id,
    mold_id: params.mold_id,
    status: params.status
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/mold/toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '切换模具状态失败');
  }

  return data as ToggleStatusResponse;
}

/**
 * 模具管理服务
 */
export const MoldManageService = {
  fetchMoldList,
  fetchMoldDetail,
  saveMold,
  fetchInternalComponents,
  toggleStatus
};
