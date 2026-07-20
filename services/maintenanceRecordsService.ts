import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

export interface MaintenanceRecordItem {
  id: number;             // 记录ID
  order_no: string;       // 工单编号
  task_source: string;    // 任务来源
  mold_code: string;      // 模具编号
  executor_name: string;  // 操作员名称
  maintenance_result: string;  // 保养结果
  buyoff_status: string;  // 验收状态
  option_count: number;   // 执行项数（保养选项数量）
  option_count_text: string;  // 执行项数文本显示
  complete_time: string;  // 完成时间
  location: string;       // 位置信息
}

export interface MaintenanceRecordsListResponse {
  code: number;           // 状态码，200表示成功
  message: string;        // 提示信息
  data: {
    total: number;        // 总记录数
    list: MaintenanceRecordItem[];  // 保养记录列表
  };
}

export interface FetchMaintenanceRecordsParams {
  search?: string;        // 搜索关键词（模具编号、工单编号、操作员）
  date?: string;          // 日期筛选（格式：YYYY-MM-DD）
  page?: number;          // 页码，默认1
  page_size?: number;     // 每页条数，默认20
}

export interface MaintenanceDetailFirstStep {
  user_name: string;      // 创建人姓名
  date_time: string;      // 创建时间
  order_time: string;     // 计划时间
  machine_code: string;   // 机台编号
}

export interface MaintenanceDetailSecondStep {
  user_name: string;      // 执行人员姓名
  date_time: string;      // 执行时间
  short_name: string;     // 模具简称
}

export interface MaintenanceDetailThirdStep {
  user_name: string;      // 审核人员姓名
  date_time: string;      // 审核时间
  comment: string;        // 审核备注
  options: string[];      // 保养执行项目名称列表
  picture_path: string[]; // 图片路径列表
}

export interface MaintenanceDetailFourthStep {
  user_name: string;      // 验收人员姓名
  date_time: string;      // 验收时间
  buyoff_status: string;  // 验收状态
  maintenance_result: string;  // 保养结果
}

export interface MaintenanceDetailResponse {
  code: number;           // 状态码，200表示成功
  message: string;        // 提示信息
  data: {
    remark: string;       // 备注信息
    order_no: string;     // 工单编号
    mold_code: string;    // 模具编号
    maintenance_result: string;  // 保养结论（OK/NG/WAIT）
    buyoff_status: string;  // 验收状态（PASSED/FAILED/NONE）
    location_type: string;  // 归位类型（模具库/机台等）
    location: string;     // 库位/机台位置
    complete_time: string;  // 完成时间
    data: {
      first: MaintenanceDetailFirstStep;    // 创建阶段信息
      second: MaintenanceDetailSecondStep;  // 执行阶段信息
      third: MaintenanceDetailThirdStep;    // 审核阶段信息
      fourth: MaintenanceDetailFourthStep;  // 验收阶段信息
    };
  };
}

export interface FetchMaintenanceDetailParams {
  id: number;             // 记录ID
}

/**
 * 获取APP保养执行记录汇总列表
 * @param params 请求参数
 * @param params.search 可选，搜索模具编号、工单编号或操作员（模糊匹配）
 * @param params.date 可选，日期筛选（格式：YYYY-MM-DD），按完成时间筛选
 * @param params.page 可选，页码，默认1
 * @param params.page_size 可选，每页条数，默认20
 * @returns 返回数据包含 total（总条数）和 list（记录列表）
 */
export async function fetchMaintenanceRecords(
  params: FetchMaintenanceRecordsParams
): Promise<MaintenanceRecordsListResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      search: params.search || '',
      date: params.date || '',
      page: params.page || 1,
      page_size: params.page_size || 20
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取保养执行记录失败');
  }

  return data as MaintenanceRecordsListResponse;
}

/**
 * 根据记录ID获取保养详情信息
 * @param params 请求参数
 * @param params.id 必填，记录ID
 * @returns 返回保养详情数据
 */
export async function fetchMaintenanceDetail(
  params: FetchMaintenanceDetailParams
): Promise<MaintenanceDetailResponse> {
  const authData = AuthService.getStoredAuth();
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/maintenance-options/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      id: params.id
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取保养详情失败');
  }

  return data as MaintenanceDetailResponse;
}

export const MaintenanceRecordsService = {
  fetchMaintenanceRecords,
  fetchMaintenanceDetail
};
