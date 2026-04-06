import { AuthService } from './authService';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

// 槽位数据接口
export interface SlotItem {
  slot: string;
  mold_id: number | null;
  mold_code: string | null;
  mold_name: string | null;
  is_bound: string; // "已绑定" | "未绑定"
  slot_status: string | null;
}

// 机台槽位配置数据接口
export interface MachineSlotData {
  machine_id: number;
  machine_name: string;
  machine_status: string;
  location: string;
  slots: SlotItem[];
}

// 机台槽位列表请求参数
export interface MachineSlotListRequest {
  department?: string;  // 过滤部门: 大材料, 小材料, ALL (查看全部)，不传则从用户信息获取
  machine_code?: string; // 可选, 机台名称模糊查询
}

// 机台槽位列表响应
export interface MachineSlotListResponse {
  code: number;
  message: string;
  data: MachineSlotData[];
}

/**
 * 获取机台槽位列表
 * @param params 请求参数
 * @returns 机台槽位列表数据
 */
export async function fetchMachineSlotList(
  params: Partial<MachineSlotListRequest> = {}
): Promise<MachineSlotData[]> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  // 从用户信息获取 department，如果没有则默认为 'ALL'
  const department = authData.department || 'ALL';

  const requestBody = {
    department,
    machine_code: params.machine_code || ''
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/machine-slots/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify(requestBody)
  });

  const data: MachineSlotListResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取机台槽位列表失败');
  }

  return data.data;
}
