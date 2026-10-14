import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

/** 用户列表项（接口返回的单条用户数据） */
export interface UserListItem {
  user_id: number;            // 用户ID (Users.user_id)
  user_code: string;          // 登录账号/员工工号 (Users.user_code)
  user_name: string;          // 用户姓名 (Users.user_name)
  card_no: string;            // 工卡号 (Users.card_no)
  role_code: string[];        // 角色代码数组 (Users.role_code，JSON数组格式，支持多角色)
  role_name: string;          // 所有角色名称字符串，逗号分隔 (关联查询 Roles.description)
  department_id: number;      // 部门ID (Users.department_id，关联键)
  department_name: string;    // 部门名称 (Departments.department_name，关联查询)
  status: string;             // 状态 ACTIVE启用 / DISABLED禁用 (Users.status)
  created_at: string;         // 创建时间 (Users.created_at)
}

/** 用户列表请求参数 */
export interface FetchUserListParams {
  page?: number;              // 当前页码，从1开始，默认1
  page_size?: number;         // 每页条数，默认20
  keyword?: string;           // 搜索关键词（匹配 user_code / user_name），可选
  role_code?: string;         // 角色代码筛选（JSON_CONTAINS 匹配包含该角色的用户），可选
  department_id?: number | string; // 部门ID精确筛选，可选
  status?: string;            // 状态筛选 ACTIVE / DISABLED，可选
}

/** 用户列表响应数据结构 */
export interface UserListResponse {
  code: number;               // 响应状态码，200表示成功
  message: string;            // 响应消息
  data: {
    list: UserListItem[];     // 用户数据列表
    total: number;            // 总记录数
    page: number;             // 当前页码
    page_size: number;        // 每页条数
  };
}

/** 用户详情响应数据结构（data 为单个用户对象，字段同列表项） */
export interface UserDetailResponse {
  code: number;               // 响应状态码，200表示成功
  message: string;            // 响应消息
  data: UserListItem;         // 用户详细信息
}

/** 角色下拉项 */
export interface RoleOption {
  role_code: string;          // 角色代码 (Roles.role_code)
  description: string;        // 角色描述/名称 (Roles.description)
}

/** 部门下拉项 */
export interface DepartmentOption {
  department_id: number;      // 部门ID (Departments.department_id)
  department_name: string;    // 部门名称 (Departments.department_name)
}

/** 角色列表响应数据结构 */
export interface RoleListResponse {
  code: number;               // 响应状态码，200表示成功
  message: string;            // 响应消息
  data: RoleOption[];         // 角色列表
}

/** 部门列表响应数据结构 */
export interface DepartmentListResponse {
  code: number;               // 响应状态码，200表示成功
  message: string;            // 响应消息
  data: DepartmentOption[];   // 部门列表
}

/** 新增用户请求参数 */
export interface SaveUserParams {
  user_code: string;          // 必填, 员工工号 (唯一)
  user_name: string;          // 必填, 用户姓名
  card_no: string;            // 必填, 工卡号
  role_code: string[];        // 必填, 角色代码数组 (支持多选, 默认 ["OPERATOR"])
  department_id: number;      // 必填, 部门ID
  status: string;             // 必填, 状态 ACTIVE / DISABLED
}

/** 更新用户请求参数 */
export interface UpdateUserParams extends SaveUserParams {
  user_id: string;            // 必填, 用户ID
}

/** 删除用户请求参数 */
export interface DeleteUserParams {
  user_id: string;            // 必填, 用户ID
}

/** 通用操作响应（新增/更新/删除） */
export interface UserMutationResponse {
  code: number;               // 响应状态码，200表示成功
  message: string;            // 响应消息（如：新增用户成功）
  data: {
    user_id?: number;         // 新增时返回新用户ID
    user_code?: string;       // 新增时返回工号
    user_name?: string;       // 新增时返回姓名
  } | null;
}

/**
 * 统一的鉴权 POST 请求
 * 自动校验登录状态与部门信息，并携带 Bearer token 请求头
 */
async function postAuth<T>(url: string, body: Record<string, unknown>): Promise<T> {
  // 获取本地存储的登录认证信息（包含token、department等字段）
  const authData = AuthService.getStoredAuth();

  // 校验登录状态：authData为空表示未登录或登录已过期
  if (!authData) {
    throw new Error('未登录或登录已过期');
  }

  // 校验部门信息：department为空表示用户未设置部门
  if (!authData.department) {
    throw new Error('当前用户未设置部门信息');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Authorization: Bearer认证方式，携带用户token
      'Authorization': `Bearer ${authData.token}`,
      // Content-Type: 请求体格式为JSON
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }

  return data as T;
}

/**
 * 分页获取系统用户列表
 * 接口：POST /api/admin/user/list
 * 支持关键词、角色、部门、状态筛选
 */
export async function fetchUserList(
  params: FetchUserListParams
): Promise<UserListResponse> {
  return postAuth<UserListResponse>(`${API_BASE_URL}/api/admin/user/list`, {
    page: params.page || 1,                  // 当前页码，从1开始
    page_size: params.page_size || 20,       // 每页条数，固定为20
    keyword: params.keyword || '',           // 搜索关键词，可选
    role_code: params.role_code || '',       // 角色代码筛选（JSON_CONTAINS 匹配），可选
    department_id: params.department_id || '', // 部门ID精确筛选，可选
    status: params.status || ''              // 状态筛选 ACTIVE / DISABLED，可选
  });
}

/**
 * 根据 user_id 获取单个用户的详细信息
 * 接口：POST /api/admin/user/detail
 */
export async function fetchUserDetail(
  userId: number | string
): Promise<UserDetailResponse> {
  return postAuth<UserDetailResponse>(`${API_BASE_URL}/api/admin/user/detail`, {
    user_id: String(userId)                  // 必填, 用户ID (Users.user_id)
  });
}

/**
 * 获取所有角色列表（用于用户表单下拉选择）
 * 接口：POST /api/admin/user/roles
 */
export async function fetchRoles(): Promise<RoleListResponse> {
  return postAuth<RoleListResponse>(`${API_BASE_URL}/api/admin/user/roles`, {});
}

/**
 * 获取所有部门列表（用于用户表单下拉选择）
 * 接口：POST /api/admin/user/departments
 */
export async function fetchDepartments(): Promise<DepartmentListResponse> {
  return postAuth<DepartmentListResponse>(`${API_BASE_URL}/api/admin/user/departments`, {});
}

/**
 * 新增系统用户（user_code 唯一，密码后端默认 123456）
 * 接口：POST /api/admin/user/save
 */
export async function saveUser(
  params: SaveUserParams
): Promise<UserMutationResponse> {
  return postAuth<UserMutationResponse>(`${API_BASE_URL}/api/admin/user/save`, {
    user_code: params.user_code,             // 必填, 员工工号 (唯一)
    user_name: params.user_name,             // 必填, 用户姓名
    card_no: params.card_no,                 // 必填, 工卡号
    role_code: params.role_code,             // 必填, 角色代码数组（支持多选）
    department_id: params.department_id,     // 必填, 部门ID
    status: params.status                    // 必填, 状态 ACTIVE / DISABLED
  });
}

/**
 * 更新用户信息
 * 接口：POST /api/admin/user/update
 */
export async function updateUser(
  params: UpdateUserParams
): Promise<UserMutationResponse> {
  return postAuth<UserMutationResponse>(`${API_BASE_URL}/api/admin/user/update`, {
    user_id: String(params.user_id),         // 必填, 用户ID
    user_code: params.user_code,             // 用户工号（修改时做唯一校验）
    user_name: params.user_name,             // 用户姓名
    card_no: params.card_no,                 // 工卡号
    role_code: params.role_code,             // 角色代码数组（支持多选）
    department_id: params.department_id,     // 部门ID
    status: params.status                    // 状态 ACTIVE / DISABLED
  });
}

/**
 * 根据 user_id 删除用户
 * 接口：POST /api/admin/user/delete
 */
export async function deleteUser(
  params: DeleteUserParams
): Promise<UserMutationResponse> {
  return postAuth<UserMutationResponse>(`${API_BASE_URL}/api/admin/user/delete`, {
    user_id: String(params.user_id)          // 必填, 用户ID
  });
}

export const UserService = {
  fetchUserList,
  fetchUserDetail,
  fetchRoles,
  fetchDepartments,
  saveUser,
  updateUser,
  deleteUser
};
