import React, { useState } from 'react';
import { Role, Permission, RolePermission } from '../../types';
import { ROLE_PERMISSIONS } from '../../services/mockData';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RolePermission[]>(ROLE_PERMISSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // 定义侧边栏目录与权限的映射关系
  const MENU_PERMISSIONS = [
    { name: '设备生产看板 (主入口)', permission: Permission.MONITOR_SCREEN_VIEW, icon: 'fa-display', category: '看板与决策' },
    { name: '仪表盘 (智能决策)', permission: Permission.DASHBOARD_VIEW, icon: 'fa-chart-pie', category: '看板与决策' },
    { name: '模具监控大屏', permission: Permission.MONITOR_SCREEN_VIEW, icon: 'fa-desktop', category: '看板与决策' },
    { name: '可生产产品 LIST', permission: Permission.MOLD_VIEW, icon: 'fa-list-check', category: '模具管理' },
    { name: '实时 Shot 数监控', permission: Permission.MOLD_VIEW, icon: 'fa-wave-square', category: '模具管理' },
    { name: '模具台账 (大材料)', permission: Permission.MOLD_VIEW, icon: 'fa-cube', category: '模具管理' },
    { name: '模具台账 (小材料)', permission: Permission.MOLD_VIEW, icon: 'fa-cube', category: '模具管理' },
    { name: 'Audit 清单', permission: Permission.MOLD_AUDIT, icon: 'fa-clipboard-list', category: '模具管理' },
    { name: '备件管理 (大材料)', permission: Permission.SPARE_VIEW, icon: 'fa-cog', category: '备件管理' },
    { name: '备件管理 (小材料)', permission: Permission.SPARE_VIEW, icon: 'fa-cog', category: '备件管理' },
    { name: '备件购买预测', permission: Permission.SPARE_PREDICTION, icon: 'fa-magnifying-glass-chart', category: '备件管理' },
    { name: '模具配件绑定', permission: Permission.MOLD_EDIT, icon: 'fa-link', category: '模具管理' },
    { name: '任务中心', permission: Permission.MAINTENANCE_MANAGE, icon: 'fa-envelope-open-text', category: '维保管理' },
    { name: '保养执行记录', permission: Permission.MAINTENANCE_VIEW, icon: 'fa-clipboard-check', category: '维保管理' },
    { name: '维修执行记录', permission: Permission.REPAIR_VIEW, icon: 'fa-tools', category: '维保管理' },
    { name: '角色权限管理', permission: Permission.ROLE_MANAGE, icon: 'fa-user-shield', category: '系统管理' },
    { name: '用户账号管理', permission: Permission.USER_MANAGE, icon: 'fa-users-gear', category: '系统管理' },
  ];

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

  const handleAddRole = () => {
    setEditingRole({
      role: '' as Role,
      permissions: [],
      description: ''
    });
    setIsCreateMode(true);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: RolePermission) => {
    setEditingRole({ ...role });
    setIsCreateMode(false);
    setIsModalOpen(true);
  };

  const togglePermission = (perm: Permission) => {
    if (!editingRole) return;
    const hasPerm = editingRole.permissions.includes(perm);
    const newPerms = hasPerm 
      ? editingRole.permissions.filter(p => p !== perm)
      : [...editingRole.permissions, perm];
    setEditingRole({ ...editingRole, permissions: newPerms });
  };

  const saveRole = () => {
    if (!editingRole || !editingRole.role) return;
    
    if (isCreateMode) {
      setRoles([...roles, editingRole]);
    } else {
      setRoles(roles.map(r => r.role === editingRole.role ? editingRole : r));
    }
    setIsModalOpen(false);
  };

  const handleDeleteRole = (roleToDelete: Role) => {
    if (roleToDelete === Role.Admin) {
      alert('超级管理员角色不可删除');
      return;
    }
    if (confirm(`确定要删除角色 ${getRoleLabel(roleToDelete)} 吗？`)) {
      setRoles(roles.filter(r => r.role !== roleToDelete));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">角色权限管理</h2>
          <p className="text-slate-500 text-sm">定义系统角色及其关联的操作权限</p>
        </div>
        <button 
          onClick={handleAddRole}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          新增角色
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.role} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">{getRoleLabel(role.role)}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{role.role}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{role.description}</p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button 
                    onClick={() => handleEditRole(role)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="编辑权限"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  {role.role !== Role.Admin && (
                    <button 
                      onClick={() => handleDeleteRole(role.role)}
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
                {MENU_PERMISSIONS.filter(m => role.permissions.includes(m.permission)).slice(0, 6).map(menu => (
                  <span key={menu.name} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium border border-indigo-100 flex items-center gap-1">
                    <i className={`fas ${menu.icon} text-[8px]`}></i>
                    {menu.name}
                  </span>
                ))}
                {MENU_PERMISSIONS.filter(m => role.permissions.includes(m.permission)).length > 6 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded text-[10px] font-medium border border-slate-200 italic">
                    +{MENU_PERMISSIONS.filter(m => role.permissions.includes(m.permission)).length - 6} 更多...
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">允许访问的目录: <b className="text-slate-700">{MENU_PERMISSIONS.filter(m => role.permissions.includes(m.permission)).length}</b></span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${role.role === Role.Admin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {role.role === Role.Admin ? '超级用户' : '普通角色'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && editingRole && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  {isCreateMode ? (
                    <div className="space-y-1 flex-1">
                      <input 
                        type="text" 
                        placeholder="输入角色标识 (例如: QUALITY_QC)"
                        className="text-xl font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={editingRole.role}
                        onChange={e => setEditingRole({ ...editingRole, role: e.target.value as Role })}
                      />
                      <input 
                        type="text" 
                        placeholder="输入角色描述 (例如: 质量管理人员)"
                        className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={editingRole.description}
                        onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">配置角色权限: {editingRole.role}</h3>
                      <p className="text-sm text-slate-500">{editingRole.description}</p>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="ml-4 text-slate-400 hover:text-slate-600 p-2">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <div className="space-y-8">
                {Array.from(new Set(MENU_PERMISSIONS.map(m => m.category))).map(category => (
                  <div key={category} className="space-y-4">
                    <h4 className="font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 uppercase tracking-wider text-xs flex items-center gap-2">
                      {category}
                      <span className="text-[10px] text-slate-400 font-normal ml-2">({MENU_PERMISSIONS.filter(m => m.category === category).length} 个目录)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MENU_PERMISSIONS.filter(m => m.category === category).map(menu => (
                        <label 
                          key={menu.name} 
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                            editingRole.permissions.includes(menu.permission) 
                              ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            editingRole.permissions.includes(menu.permission)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}>
                            <i className={`fas ${menu.icon}`}></i>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold transition-colors ${
                              editingRole.permissions.includes(menu.permission) ? 'text-indigo-900' : 'text-slate-700'
                            }`}>
                              {menu.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{menu.permission}</p>
                          </div>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={editingRole.permissions.includes(menu.permission)}
                            onChange={() => togglePermission(menu.permission)}
                            disabled={editingRole.role === Role.Admin}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all">
                取消
              </button>
              <button 
                onClick={saveRole}
                disabled={editingRole.role === Role.Admin}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
