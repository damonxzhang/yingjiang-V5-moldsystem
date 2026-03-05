
import React from 'react';
import { Role } from '../../types';

interface HomeProps {
  userRole: Role;
  onNavigate: (screen: any) => void;
}

const Home: React.FC<HomeProps> = ({ userRole, onNavigate }) => {
  const actions = [
    { id: 'inquiry', name: '模具查询', icon: 'fa-search', color: 'bg-indigo-500', roles: [Role.Admin, Role.MoldEngineerBig, Role.MoldEngineerSmall, Role.Operator, Role.ShiftLeader] },
    { id: 'transfer', name: '模具转换', icon: 'fa-exchange-alt', color: 'bg-green-500', roles: [Role.Admin, Role.Operator, Role.MoldEngineerBig, Role.MoldEngineerSmall, Role.ShiftLeader] },
    { id: 'maintenance', name: '保养执行', icon: 'fa-tools', color: 'bg-amber-500', roles: [Role.Admin, Role.ShiftLeader, Role.MoldEngineerBig, Role.MoldEngineerSmall] },
    { id: 'repair', name: '维修执行', icon: 'fa-wrench', color: 'bg-red-500', roles: [Role.Admin, Role.ShiftLeader, Role.MoldEngineerBig, Role.MoldEngineerSmall] },
  ];

  const filteredActions = actions.filter(a => a.roles.includes(userRole));

  return (
    <div className="p-4 space-y-6">
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">在线模具</p>
          <p className="text-2xl font-bold text-slate-800">12</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">待处理任务</p>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
          <i className="fas fa-bolt text-amber-400"></i>
          快捷入口
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {filteredActions.map(action => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`${action.color} text-white w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-active:scale-95 transition-transform`}>
                <i className={`fas ${action.icon} text-xl`}></i>
              </div>
              <span className="text-sm font-semibold text-slate-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
