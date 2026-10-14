import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../../types';
import { message } from '../../components/Message';
import {
  fetchUserList,
  fetchUserDetail,
  fetchRoles,
  fetchDepartments,
  saveUser as createUserApi,
  updateUser,
  deleteUser as deleteUserApi,
  UserListItem,
  RoleOption,
  DepartmentOption
} from '../../services/userService';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 20;

/** 将接口用户数据映射为页面使用的 User 结构 */
const mapUserItem = (item: UserListItem): User => ({
  id: String(item.user_id),
  username: item.user_code,
  name: item.user_name,
  cardNo: item.card_no,
  role: (item.role_code?.[0] || '') as Role,   // 主角色取角色数组第一个（兼容旧逻辑）
  roles: item.role_code || [],                 // 角色代码数组（多角色）
  roleName: item.role_name,                    // 所有角色名称，逗号分隔
  departmentId: item.department_id,
  department: item.department_name,
  createdAt: item.created_at,
  status: item.status === 'ACTIVE' ? 'active' : 'inactive'
});

const UserManagement: React.FC = () => {
  // 列表相关状态
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // 角色/部门下拉数据
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // 弹窗相关状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 角色多选下拉展开状态
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const isLoadingRef = useRef(false);
  const isFirstRender = useRef(true);

  // 点击角色下拉框外部时收起下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** 调用 /api/admin/user/list 获取用户列表 */
  const loadUsers = async (page: number = 1) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchUserList({
        page,
        page_size: ITEMS_PER_PAGE
      });
      setUsers(response.data.list.map(mapUserItem));
      setTotalRecords(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
      setUsers([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  /** 并行加载角色列表 (/api/admin/user/roles) 与部门列表 (/api/admin/user/departments) */
  const loadRolesAndDepartments = async () => {
    try {
      const [roleRes, deptRes] = await Promise.all([
        fetchRoles(),
        fetchDepartments()
      ]);
      setRoles(roleRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      // 下拉数据加载失败不阻塞用户列表展示
      console.error('获取角色/部门列表失败:', err);
    }
  };

  // 组件挂载时加载第一页用户列表及角色/部门下拉数据
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadUsers(1);
      loadRolesAndDepartments();
    }
  }, []);

  // 页码变化时重新加载数据
  useEffect(() => {
    if (!isFirstRender.current) {
      loadUsers(currentPage);
    }
  }, [currentPage]);

  const getRoleLabel = (role: Role) => {
    switch(role) {
      case Role.Admin: return '系统管理员';
      case Role.MoldEngineerBig: return '大材料工程师';
      case Role.MoldEngineerSmall: return '小材料工程师';
      case Role.ShiftLeader: return '带班';
      case Role.Operator: return '操作员';
      default: return role;
    }
  };

  /** 关闭弹窗并清理编辑态，避免下次打开残留旧数据 */
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setDetailLoading(false);
    setModalMode('add');
    setRoleDropdownOpen(false);
  };

  /** 新增用户：打开空白弹窗，部门默认取第一个，角色默认 OPERATOR */
  const handleAddUser = () => {
    setModalMode('add');
    setEditingUser({
      id: '',
      username: '',
      name: '',
      cardNo: '',
      role: Role.Operator,
      roles: [Role.Operator],
      departmentId: departments[0]?.department_id,
      department: departments[0]?.department_name,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  /** 切换角色选中状态（多选），主角色同步为数组第一个 */
  const toggleRole = (roleCode: string) => {
    if (!editingUser) return;
    const current = editingUser.roles || [];
    const next = current.includes(roleCode)
      ? current.filter(r => r !== roleCode)
      : [...current, roleCode];
    setEditingUser({ ...editingUser, roles: next, role: (next[0] || '') as Role });
  };

  /** 编辑用户：先打开弹窗（行数据兜底），再调用 /api/admin/user/detail 拉取详情回显 */
  const handleEditUser = async (user: User) => {
    setModalMode('edit');
    setEditingUser({ ...user });
    setIsModalOpen(true);
    setDetailLoading(true);

    try {
      const response = await fetchUserDetail(user.id);
      setEditingUser(mapUserItem(response.data));
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取用户详情失败');
      closeModal();
    } finally {
      setDetailLoading(false);
    }
  };

  /** 删除用户：调用 /api/admin/user/delete，成功后刷新列表 */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;

    try {
      const response = await deleteUserApi({ user_id: userId });
      message.success(response.message || '删除用户成功');
      // 当前页只剩一条且不是第一页时，删除后自动回退一页
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadUsers(currentPage);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除用户失败');
    }
  };

  /** 保存用户：编辑调用 /api/admin/user/update，新增调用 /api/admin/user/save，成功后刷新列表 */
  const handleSaveUser = async () => {
    if (!editingUser || saving) return;

    // 必填项校验
    if (!editingUser.name.trim()) {
      message.warning('请输入姓名');
      return;
    }
    if (!editingUser.username.trim()) {
      message.warning('请输入登录账号');
      return;
    }
    if (!editingUser.cardNo?.trim()) {
      message.warning('请输入工卡号');
      return;
    }
    if (!editingUser.roles || editingUser.roles.length === 0) {
      message.warning('请选择系统角色（至少一个）');
      return;
    }
    if (!editingUser.departmentId) {
      message.warning('请选择所属部门');
      return;
    }

    const baseParams = {
      user_code: editingUser.username.trim(),    // 员工工号（唯一）
      user_name: editingUser.name.trim(),        // 用户姓名
      card_no: editingUser.cardNo.trim(),        // 工卡号
      role_code: editingUser.roles,          // 角色代码数组（支持多选）
      department_id: editingUser.departmentId,   // 部门ID
      status: editingUser.status === 'active' ? 'ACTIVE' : 'DISABLED' // 启用/禁用
    };

    setSaving(true);
    try {
      if (modalMode === 'edit') {
        const response = await updateUser({
          user_id: editingUser.id,
          ...baseParams
        });
        message.success(response.message || '更新用户成功');
        closeModal();
        loadUsers(currentPage);
      } else {
        const response = await createUserApi(baseParams);
        message.success(response.message || '新增用户成功');
        closeModal();
        // 新增后回到第一页并刷新
        setCurrentPage(1);
        loadUsers(1);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">用户管理</h2>
          <p className="text-slate-500 text-sm">管理后台系统用户及其角色分配</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <i className="fas fa-plus"></i>
          新增用户
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无用户数据</p>
          </div>
        </div>
      )}

      {!loading && users.length > 0 && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户信息</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">所属角色</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">部门</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm border-2 border-white shadow-sm">
                      {user.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    user.role === Role.Admin ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    user.role === Role.MoldEngineerBig ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    user.role === Role.MoldEngineerSmall ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' :
                    user.role === Role.ShiftLeader ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {user.roleName || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">{user.department || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-500 font-mono">{user.createdAt || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-400'}`}></div>
                    <span className={`text-[10px] font-bold ${user.status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
                      {user.status === 'active' ? '正常' : '禁用'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="编辑用户"
                    >
                      <i className="fas fa-user-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="删除用户"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* 分页控件 */}
      <Pagination
        totalRecords={totalRecords}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* 新增/编辑用户弹窗 */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {modalMode === 'edit' ? '编辑用户信息' : '新增系统用户'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="relative p-8 space-y-5">
              {/* 详情加载中提示 */}
              {detailLoading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex flex-col justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="mt-3 text-sm text-slate-500">用户详情加载中...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">姓名</label>
                  <input 
                    type="text" 
                    placeholder="例如: 张三"
                    disabled={detailLoading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                    value={editingUser.name}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">登录账号</label>
                  <input 
                    type="text" 
                    placeholder="例如: E001"
                    disabled={detailLoading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                    value={editingUser.username}
                    onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">工卡号</label>
                  <input 
                    type="text" 
                    placeholder="例如: CARD001"
                    disabled={detailLoading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                    value={editingUser.cardNo || ''}
                    onChange={e => setEditingUser({...editingUser, cardNo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">系统角色（可多选）</label>
                  <div className="relative" ref={roleDropdownRef}>
                    {/* 多选下拉触发框：显示已选角色名称 */}
                    <button
                      type="button"
                      disabled={detailLoading}
                      onClick={() => setRoleDropdownOpen(open => !open)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60 flex items-center justify-between gap-2"
                    >
                      <span className={`truncate ${editingUser.roles && editingUser.roles.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {editingUser.roles && editingUser.roles.length > 0
                          ? (roles.length > 0
                              ? roles.filter(r => editingUser.roles!.includes(r.role_code)).map(r => r.description).join('、')
                              : editingUser.roles.map(r => getRoleLabel(r as Role)).join('、'))
                          : '请选择角色'}
                      </span>
                      <i className={`fas fa-chevron-${roleDropdownOpen ? 'up' : 'down'} text-xs text-slate-400 shrink-0`}></i>
                    </button>
                    {/* 多选下拉面板：checkbox 列表 */}
                    {roleDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {(roles.length > 0
                          ? roles.map(r => ({ code: r.role_code, label: r.description }))
                          : Object.values(Role).map(r => ({ code: r as string, label: getRoleLabel(r) }))
                        ).map(option => {
                          const checked = editingUser.roles?.includes(option.code) || false;
                          return (
                            <label
                              key={option.code}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={checked}
                                onChange={() => toggleRole(option.code)}
                              />
                              <span className="text-sm font-medium">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">所属部门</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none disabled:opacity-60"
                    disabled={detailLoading}
                    value={editingUser.departmentId ?? ''}
                    onChange={e => {
                      const deptId = Number(e.target.value);
                      const dept = departments.find(d => d.department_id === deptId);
                      setEditingUser({
                        ...editingUser,
                        departmentId: deptId,
                        department: dept?.department_name
                      });
                    }}
                  >
                    <option value="" disabled>请选择部门</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">账号状态</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${editingUser.status === 'active' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'} ${detailLoading ? 'pointer-events-none opacity-60' : ''}`}>
                    <input type="radio" className="hidden" checked={editingUser.status === 'active'} onChange={() => setEditingUser({...editingUser, status: 'active'})} />
                    <i className="fas fa-check-circle text-xs"></i>
                    <span className="text-xs font-bold uppercase tracking-wide">启用</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${editingUser.status === 'inactive' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-400'} ${detailLoading ? 'pointer-events-none opacity-60' : ''}`}>
                    <input type="radio" className="hidden" checked={editingUser.status === 'inactive'} onChange={() => setEditingUser({...editingUser, status: 'inactive'})} />
                    <i className="fas fa-ban text-xs"></i>
                    <span className="text-xs font-bold uppercase tracking-wide">禁用</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={detailLoading || saving}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? '保存中...'
                  : modalMode === 'edit' ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
