import React, { useState, useEffect } from 'react';
import { message } from '../../components/Message';
import {
  fetchRoleRouteList,
  fetchMenuGroupedList,
  fetchRoleRouteConfig,
  createRole,
  syncRoleRoutes,
  deleteRole,
  RolePermissionItem,
  MenuGroup
} from '../../services/roleService';

/** 超级系统管理员角色代码：后端禁止删除（返回403），前端不展示删除按钮 */
const SUPER_ADMIN_ROLE_CODE = 'SUPER_ADMIN';

/** 根据菜单分组名称匹配图标 */
const getGroupIcon = (groupName: string): string => {
  if (groupName.includes('看板') || groupName.includes('决策')) return 'fa-display';
  if (groupName.includes('模具')) return 'fa-cube';
  if (groupName.includes('备件')) return 'fa-cog';
  if (groupName.includes('维保') || groupName.includes('保养') || groupName.includes('维修')) return 'fa-screwdriver-wrench';
  if (groupName.includes('系统')) return 'fa-user-shield';
  if (groupName.includes('认证') || groupName.includes('权限')) return 'fa-key';
  if (groupName.includes('生产')) return 'fa-industry';
  return 'fa-folder';
};

/** 请求方法对应的标签样式 */
const getMethodClassName = (method: string): string => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'POST': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'PUT': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'DELETE': return 'bg-red-50 text-red-600 border-red-100';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const RoleManagement: React.FC = () => {
  // 角色权限列表
  const [roles, setRoles] = useState<RolePermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 菜单分组路由数据（进入页面时调用 menu-grouped-list 保存，弹窗勾选树复用）
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);

  // 新增/编辑弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formRoleCode, setFormRoleCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  // 弹窗内实际渲染的分组：新增时来自菜单分组路由列表，编辑时来自 role-route-config
  const [modalGroups, setModalGroups] = useState<MenuGroup[]>([]);
  // 编辑权限配置详情加载状态（role-route-config 请求中）
  const [configLoading, setConfigLoading] = useState(false);

  // 删除角色弹窗状态
  const [deleteTarget, setDeleteTarget] = useState<RolePermissionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** 调用 /api/admin/route/role-route-list 获取角色权限列表 */
  const loadRoleList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRoleRouteList();
      setRoles(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取角色权限列表失败');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  /** 调用 /api/admin/route/menu-grouped-list 获取菜单分组路由并保存 */
  const loadMenuGroups = async () => {
    try {
      const response = await fetchMenuGroupedList({ status: 'ACTIVE' });
      setMenuGroups(response.data.menu_list);
    } catch (err) {
      // 勾选树数据加载失败不阻塞角色列表展示
      console.error('获取菜单分组路由失败:', err);
    }
  };

  // 组件挂载时并行加载角色权限列表与菜单分组路由
  useEffect(() => {
    loadRoleList();
    loadMenuGroups();
  }, []);

  /** 点击新增角色：打开空白弹窗，勾选树数据来自已保存的菜单分组路由列表 */
  const handleAddRole = () => {
    setModalMode('add');
    setFormRoleCode('');
    setFormDescription('');
    setSelectedRouteIds([]);
    setConfigLoading(false);
    setModalGroups(menuGroups);
    setIsModalOpen(true);
  };

  /** 点击编辑：调用 /api/admin/route/role-route-config 获取分组与 selected 标识回显勾选 */
  const handleEditRole = async (role: RolePermissionItem) => {
    setModalMode('edit');
    setFormRoleCode(role.role_code);
    setFormDescription(role.role_name);
    // 先用列表数据兜底回显，配置详情返回后再校正
    setSelectedRouteIds(role.routes.map(r => r.route_id));
    setModalGroups(menuGroups);
    setIsModalOpen(true);
    setConfigLoading(true);

    try {
      const response = await fetchRoleRouteConfig({ role_code: role.role_code });
      setFormDescription(response.data.role_name);
      // selected 为 true 的路由即为已授权路由，回显为勾选状态
      setSelectedRouteIds(
        response.data.groups.flatMap(group =>
          group.routes.filter(route => route.selected).map(route => route.route_id)
        )
      );
      // 将配置详情分组映射为弹窗统一渲染结构
      setModalGroups(
        response.data.groups.map(group => ({
          menu_name: group.group_name,
          count: group.count,
          children: group.routes.map(route => ({
            route_id: route.route_id,
            route_name: route.route_name,
            route_path: route.route_path,
            route_group: group.group_name,
            method: route.method,
            status: 'ACTIVE'
          }))
        }))
      );
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取角色权限配置失败');
      setIsModalOpen(false);
    } finally {
      setConfigLoading(false);
    }
  };

  /** 关闭新增/编辑弹窗并清理表单状态 */
  const closeModal = () => {
    setIsModalOpen(false);
    setFormRoleCode('');
    setFormDescription('');
    setSelectedRouteIds([]);
    setModalGroups([]);
    setConfigLoading(false);
    setSaving(false);
  };

  /** 勾选/取消勾选单条路由 */
  const toggleRoute = (routeId: number) => {
    setSelectedRouteIds(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  /** 分组全选/取消全选 */
  const toggleGroup = (group: MenuGroup) => {
    const groupRouteIds = group.children.map(r => r.route_id);
    const allSelected = groupRouteIds.every(id => selectedRouteIds.includes(id));
    setSelectedRouteIds(prev => {
      if (allSelected) {
        // 取消全选：移除该分组下所有路由
        return prev.filter(id => !groupRouteIds.includes(id));
      }
      // 全选：合并该分组下未选中的路由
      const merged = new Set([...prev, ...groupRouteIds]);
      return Array.from(merged);
    });
  };

  /** 弹窗确认：新增调用 role-create，编辑调用 role-route-sync，成功后刷新列表并关闭弹窗 */
  const handleConfirm = async () => {
    if (saving) return;

    // 新增时校验角色代码与描述（编辑模式角色代码不可改，无需校验）
    if (modalMode === 'add') {
      if (!formRoleCode.trim()) {
        message.warning('请输入角色标识');
        return;
      }
      if (!formDescription.trim()) {
        message.warning('请输入角色描述');
        return;
      }
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        const response = await createRole({
          role_code: formRoleCode.trim().toUpperCase(), // 角色代码（唯一），统一转为大写
          description: formDescription.trim(), // 角色描述/名称
          route_ids: selectedRouteIds         // 勾选的授权路由ID列表
        });
        message.success(response.message || '新增角色成功');
      } else {
        const response = await syncRoleRoutes({
          role_code: formRoleCode,            // 角色代码
          route_ids: selectedRouteIds         // 全量勾选的授权路由ID列表
        });
        message.success(response.message || '角色权限同步成功');
      }
      closeModal();
      loadRoleList();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 点击删除：展示删除角色弹窗（超级管理员不展示删除按钮，此处兜底拦截） */
  const handleOpenDelete = (role: RolePermissionItem) => {
    if (role.role_code === SUPER_ADMIN_ROLE_CODE) {
      message.error('超级系统管理员角色不能被删除');
      return;
    }
    setDeleteTarget(role);
  };

  /** 删除弹窗确认：调用 role-delete，成功后刷新列表并关闭弹窗 */
  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      const response = await deleteRole({
        role_code: deleteTarget.role_code     // 要删除的角色代码
      });
      message.success(response.message || '角色删除成功');
      setDeleteTarget(null);
      loadRoleList();
    } catch (err) {
      // 403（超级管理员禁止删除）/ 400（角色下存在用户）等错误由后端消息提示
      message.error(err instanceof Error ? err.message : '删除角色失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">角色权限管理</h2>
          <p className="text-slate-500 text-sm">定义系统角色及其关联的路由访问权限</p>
        </div>
        <button
          onClick={handleAddRole}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          新增角色
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center justify-between">
          <span><i className="fas fa-exclamation-circle mr-2"></i>{error}</span>
          <button onClick={loadRoleList} className="text-sm font-bold text-red-700 hover:text-red-800">
            <i className="fas fa-rotate-right mr-1"></i>重新加载
          </button>
        </div>
      )}

      {!loading && !error && roles.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无角色数据</p>
          </div>
        </div>
      )}

      {!loading && roles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => {
            const isSuperAdmin = role.role_code === SUPER_ADMIN_ROLE_CODE;
            return (
              <div key={role.role_code} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">{role.role_name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{role.role_code}</p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="编辑权限"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {/* 超级系统管理员角色不展示删除按钮 */}
                      {!isSuperAdmin && (
                        <button
                          onClick={() => handleOpenDelete(role)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除角色"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {role.routes.slice(0, 6).map(route => (
                      <span key={route.route_id} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium border border-indigo-100">
                        {route.route_name}
                      </span>
                    ))}
                    {role.routes.length > 6 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded text-[10px] font-medium border border-slate-200 italic">
                        +{role.routes.length - 6} 更多...
                      </span>
                    )}
                    {role.routes.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">暂未授权任何路由</span>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">允许访问的路由: <b className="text-slate-700">{role.route_count}</b></span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${isSuperAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isSuperAdmin ? '超级用户' : '普通角色'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增/编辑角色弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              {/* 标题行：标题与关闭按钮始终同一行 */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">
                  {modalMode === 'add' ? '新增角色' : `配置角色权限: ${formDescription}`}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {modalMode === 'add' ? (
                <div className="space-y-3 mt-3">
                  {/* 角色标识（单独一行） */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">角色标识</label>
                    <input
                      type="text"
                      placeholder="角色标识 (例如: QUALITY_QC)"
                      className="text-sm text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full font-mono uppercase"
                      value={formRoleCode}
                      onChange={e => setFormRoleCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  {/* 角色描述（单独一行，使用 textarea） */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">角色描述</label>
                    <textarea
                      rows={3}
                      placeholder="角色描述 (例如: 质量管理人员)"
                      className="text-sm text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full resize-y min-h-[72px]"
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-mono mt-0.5">{formRoleCode}</p>
              )}
            </div>

            <div className="relative p-8 overflow-y-auto flex-1 bg-white">
              {configLoading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex flex-col justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="mt-3 text-sm text-slate-500">角色权限配置加载中...</span>
                </div>
              )}
              {modalGroups.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
                  <p className="text-sm">菜单路由数据加载中...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {modalGroups.map(group => {
                    const groupRouteIds = group.children.map(r => r.route_id);
                    const selectedInGroup = groupRouteIds.filter(id => selectedRouteIds.includes(id)).length;
                    const allSelected = selectedInGroup === group.children.length && group.children.length > 0;
                    const someSelected = selectedInGroup > 0 && !allSelected;
                    return (
                      <div key={group.menu_name} className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => toggleGroup(group)}
                          />
                          <h4 className="font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 uppercase tracking-wider text-xs flex items-center gap-2">
                            <i className={`fas ${getGroupIcon(group.menu_name)} text-indigo-400`}></i>
                            {group.menu_name}
                            <span className="text-[10px] text-slate-400 font-normal ml-2">
                              ({selectedInGroup}/{group.children.length} 个路由)
                            </span>
                          </h4>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.children.map(route => {
                            const checked = selectedRouteIds.includes(route.route_id);
                            return (
                              <label
                                key={route.route_id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                  checked
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                  checked={checked}
                                  onChange={() => toggleRoute(route.route_id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {route.route_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{route.route_path}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getMethodClassName(route.method)}`}>
                                  {route.method}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              <span className="text-xs text-slate-500">
                已选择 <b className="text-indigo-600">{selectedRouteIds.length}</b> 个路由
              </span>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={saving || configLoading}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving || configLoading || modalGroups.length === 0}
                  className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '提交中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除角色确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">删除角色</h3>
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <i className="fas fa-triangle-exclamation text-xl"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    确定要删除角色「{deleteTarget.role_name}」吗？
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    删除后将同时清除该角色的 {deleteTarget.route_count} 项路由授权，且无法恢复。若该角色下仍存在用户，将无法删除。
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-2">{deleteTarget.role_code}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
