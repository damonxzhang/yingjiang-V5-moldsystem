
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

      {/* 通知与预警 */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <i className="fas fa-exclamation-triangle text-amber-500"></i>
          <h3 className="font-bold text-amber-800 text-sm">寿命极限预警</h3>
        </div>
        <p className="text-xs text-amber-700">
          模具 <b>MOLD-002</b> 已达到 98% 的设计寿命，请立即安排更换或大修。
        </p>
      </div>

      {/* 最近动态 */}
      <div>
        <h2 className="text-slate-700 font-bold mb-3">最近活动</h2>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <i className="fas fa-check"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">转换流程完成</p>
              <p className="text-[10px] text-slate-500">MOLD-001 已从仓库安装至 MC-202 机台</p>
              <p className="text-[10px] text-slate-400 mt-1">2 小时前</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
              <i className="fas fa-tools"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">强制保养触发</p>
              <p className="text-[10px] text-slate-500">MOLD-004 拆卸入柜，系统已自动触发保养任务</p>
              <p className="text-[10px] text-slate-400 mt-1">5 小时前</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
