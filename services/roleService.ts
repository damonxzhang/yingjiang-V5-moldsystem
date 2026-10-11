import { AuthService } from './authService';
import { API_BASE_URL } from './apiConfig';

/** 角色已授权路由项（角色权限列表中的精简路由结构） */
export interface RoleRouteItem {
  route_id: number;            // 路由ID (Routes.route_id)
  route_name: string;          // 路由名称 (Routes.route_name)
}

/** 角色权限列表项（按角色聚合，每个角色一条记录） */
export interface RolePermissionItem {
  role_code: string;           // 角色代码 (Roles.role_code)
  role_name: string;           // 角色名称 (Roles.description)
  route_count: number;         // 已授权路由数量
  routes: RoleRouteItem[];     // 该角色已授权路由数组
}

/** 角色权限列表响应数据结构 */
export interface RoleRouteListResponse {
  code: number;                // 响应状态码，200表示成功
  message: string;             // 响应消息
  data: RolePermissionItem[];  // 角色权限列表
}

/** 菜单分组下的路由（完整路由信息） */
export interface MenuRouteItem {
  route_id: number;            // 路由ID (Routes.route_id)
  route_name: string;          // 路由名称
  route_path: string;          // 路由路径
  route_group: string;         // 路由分组（菜单名称）
  method: string;              // 请求方法 POST/GET/PUT/DELETE
  status: string;              // 状态 ACTIVE / DISABLED
}

/** 菜单分组（菜单树一级节点） */
export interface MenuGroup {
  menu_name: string;           // 菜单（分组）名称
  count: number;               // 分组下路由数量
  children: MenuRouteItem[];   // 分组下的路由列表
}

/** 菜单分组路由列表响应数据结构 */
export interface MenuGroupedListResponse {
  code: number;                // 响应状态码，200表示成功
  message: string;             // 响应消息
  data: {
    total: number;             // 路由总数
    menu_list: MenuGroup[];    // 按菜单分组的路由树
  };
}

/** 角色权限配置弹窗中的路由项（每条路由带 selected 是否已授权标识） */
export interface RoleConfigRouteItem {
  route_id: number;            // 路由ID (Routes.route_id)
  route_name: string;          // 路由名称
  route_path: string;          // 路由路径
  method: string;              // 请求方法 POST/GET/PUT/DELETE
  selected: boolean;           // 该角色是否已授权此路由，true=已勾选
}

/** 角色权限配置分组（所有活跃路由按菜单分组，并统计勾选数量） */
export interface RoleConfigGroup {
  group_name: string;          // 菜单（分组）名称
  count: number;               // 分组下路由总数
  selected_count: number;      // 该角色在该分组下已授权的路由数量
  routes: RoleConfigRouteItem[]; // 分组下的路由列表（带 selected 标识）
}

/** 角色权限配置详情响应数据结构（编辑角色弹窗专用） */
export interface RoleRouteConfigResponse {
  code: number;                // 响应状态码，200表示成功
  message: string;             // 响应消息
  data: {
    role_code: string;         // 角色代码
    role_name: string;         // 角色名称/描述
    groups: RoleConfigGroup[]; // 按菜单分组的全部活跃路由，selected 标识回显勾选
  };
}

/** 新增角色请求参数 */
export interface CreateRoleParams {
  role_code: string;           // 必填, 角色代码（唯一）
  description: string;         // 必填, 角色描述/名称
  route_ids: number[];         // 必填, 授权路由ID列表
}

/** 新增角色响应数据 */
export interface CreateRoleResponse {
  code: number;                // 响应状态码，200表示成功
  message: string;             // 响应消息（如：新增角色并授权成功）
  data: {
    role_code: string;         // 新角色代码
    description: string;       // 新角色描述
    route_count: number;       // 授权路由数量
  } | null;
}

/** 角色路由覆盖式同步请求参数 */
export interface SyncRoleRoutesParams {
  role_code: string;           // 必填, 角色代码
  route_ids: number[];         // 必填, 全量勾选的路由ID列表，传 [] 表示清空全部权限
}

/** 角色路由覆盖式同步响应数据 */
export interface SyncRoleRoutesResponse {
  code: number;                // 响应状态码，200表示成功
  message: string;             // 响应消息（如：同步完成: 已清除旧关联, 新增 N 条）
  data: {
    role_code: string;         // 角色代码
    inserted: number;          // 新写入的关联数量
  } | null;
}

/** 删除角色请求参数 */
export interface DeleteRoleParams {
  role_code: string;           // 必填, 要删除的角色代码
}

/** 删除角色响应数据 */
export interface DeleteRoleResponse {
  code: number;                // 响应状态码，200表示成功；403表示超级管理员禁止删除；400表示角色下存在用户
  message: string;             // 响应消息
  data: {
    role_code: string;         // 被删除的角色代码
    route_deleted: number;     // 同步清理的角色路由关联数量
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
 * 获取角色权限列表（按角色聚合展示已授权路由）
 * 接口：POST /api/admin/route/role-route-list
 */
export async function fetchRoleRouteList(
  params?: { role_code?: string }
): Promise<RoleRouteListResponse> {
  return postAuth<RoleRouteListResponse>(`${API_BASE_URL}/api/admin/route/role-route-list`, {
    role_code: params?.role_code || ''    // 可选, 按角色代码筛选，空=返回全部角色
  });
}

/**
 * 获取菜单分组路由列表（所有活跃路由按菜单分组，用于弹窗勾选树渲染）
 * 接口：POST /api/admin/route/menu-grouped-list
 */
export async function fetchMenuGroupedList(
  params?: { status?: string }
): Promise<MenuGroupedListResponse> {
  return postAuth<MenuGroupedListResponse>(`${API_BASE_URL}/api/admin/route/menu-grouped-list`, {
    status: params?.status || 'ACTIVE'    // 可选, 状态筛选，空=返回全部 (ACTIVE/DISABLED)
  });
}

/**
 * 获取角色权限配置详情（编辑角色弹窗专用）
 * 返回所有活跃路由按菜单分组，每条路由带 selected 标识表示该角色是否已授权
 * 接口：POST /api/admin/route/role-route-config
 */
export async function fetchRoleRouteConfig(
  params: { role_code: string }
): Promise<RoleRouteConfigResponse> {
  return postAuth<RoleRouteConfigResponse>(`${API_BASE_URL}/api/admin/route/role-route-config`, {
    role_code: params.role_code          // 必填, 角色代码
  });
}

/**
 * 新增角色并绑定路由（事务保证角色与授权写入一致）
 * 接口：POST /api/admin/route/role-create
 */
export async function createRole(
  params: CreateRoleParams
): Promise<CreateRoleResponse> {
  return postAuth<CreateRoleResponse>(`${API_BASE_URL}/api/admin/route/role-create`, {
    role_code: params.role_code,          // 必填, 角色代码（唯一，重复报错）
    description: params.description,      // 必填, 角色描述/名称
    route_ids: params.route_ids           // 必填, 授权路由ID列表
  });
}

/**
 * 编辑角色权限（覆盖式同步：先清除旧关联，再写入新关联）
 * 接口：POST /api/admin/route/role-route-sync
 */
export async function syncRoleRoutes(
  params: SyncRoleRoutesParams
): Promise<SyncRoleRoutesResponse> {
  return postAuth<SyncRoleRoutesResponse>(`${API_BASE_URL}/api/admin/route/role-route-sync`, {
    role_code: params.role_code,          // 必填, 角色代码
    route_ids: params.route_ids           // 必填, 全量勾选的路由ID列表，[] 表示清空全部权限
  });
}

/**
 * 删除角色（同时清理角色路由关联；超级管理员返回403，角色下有用户返回400）
 * 接口：POST /api/admin/route/role-delete
 */
export async function deleteRole(
  params: DeleteRoleParams
): Promise<DeleteRoleResponse> {
  return postAuth<DeleteRoleResponse>(`${API_BASE_URL}/api/admin/route/role-delete`, {
    role_code: params.role_code           // 必填, 要删除的角色代码
  });
}

export const RoleService = {
  fetchRoleRouteList,
  fetchMenuGroupedList,
  fetchRoleRouteConfig,
  createRole,
  syncRoleRoutes,
  deleteRole
};
