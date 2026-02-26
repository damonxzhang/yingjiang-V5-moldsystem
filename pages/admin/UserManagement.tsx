import React, { useState } from 'react';
import { User, Role } from '../../types';
import { MOCK_USERS } from '../../services/mockData';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const handleAddUser = () => {
    setEditingUser({
      id: `U-${Date.now()}`,
      username: '',
      name: '',
      role: Role.Operator,
      status: 'active',
      department: ''
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除该用户吗？')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const saveUser = () => {
    if (!editingUser) return;
    const exists = users.find(u => u.id === editingUser.id);
    if (exists) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    } else {
      setUsers([...users, editingUser]);
    }
    setIsModalOpen(false);
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户信息</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">所属角色</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">部门</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">最后登录</th>
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
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">{user.department || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-500 font-mono">{user.lastLogin || '从未登录'}</span>
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

      {/* 编辑用户弹窗 */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {users.find(u => u.id === editingUser.id) ? '编辑用户信息' : '新增系统用户'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">姓名</label>
                  <input 
                    type="text" 
                    placeholder="例如: 张三"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editingUser.name}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">登录账号</label>
                  <input 
                    type="text" 
                    placeholder="例如: zhangsan_01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editingUser.username}
                    onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">系统角色</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={editingUser.role}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                  >
                    {Object.values(Role).map(role => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">所属部门</label>
                  <input 
                    type="text" 
                    placeholder="例如: 生产部"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editingUser.department || ''}
                    onChange={e => setEditingUser({...editingUser, department: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">账号状态</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${editingUser.status === 'active' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                    <input type="radio" className="hidden" checked={editingUser.status === 'active'} onChange={() => setEditingUser({...editingUser, status: 'active'})} />
                    <i className="fas fa-check-circle text-xs"></i>
                    <span className="text-xs font-bold uppercase tracking-wide">启用</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${editingUser.status === 'inactive' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                    <input type="radio" className="hidden" checked={editingUser.status === 'inactive'} onChange={() => setEditingUser({...editingUser, status: 'inactive'})} />
                    <i className="fas fa-ban text-xs"></i>
                    <span className="text-xs font-bold uppercase tracking-wide">禁用</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-all">
                取消
              </button>
              <button 
                onClick={saveUser}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                {users.find(u => u.id === editingUser.id) ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
