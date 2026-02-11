
import React, { useState } from 'react';
import { Role } from './types';
import AdminLayout from './pages/admin/AdminLayout';
import AppLayout from './pages/app/AppLayout';

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'ADMIN'>('ADMIN');
  const [role, setRole] = useState<Role>(Role.Operator);

  return (
    <div className="min-h-screen">
      {/* 模拟切换 - 生产环境中应由身份验证处理 */}
      <div className="fixed top-0 right-0 z-50 p-2 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setView('APP')} 
          className={`px-3 py-1 rounded-full text-xs font-bold ${view === 'APP' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
        >
          APP (现场执行)
        </button>
        <button 
          onClick={() => setView('ADMIN')} 
          className={`px-3 py-1 rounded-full text-xs font-bold ${view === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
        >
          Web 后台管理
        </button>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value as Role)}
          className="px-3 py-1 rounded-full text-xs bg-white border border-slate-300 outline-none"
        >
          <option value={Role.Admin}>管理员</option>
          <option value={Role.MoldEngineer}>模具工程师</option>
          <option value={Role.MaintenanceEngineer}>维修工程师</option>
          <option value={Role.Operator}>现场操作员</option>
          <option value={Role.ProductionSupervisor}>生产主管</option>
          <option value={Role.WarehouseAdmin}>仓库管理员</option>
        </select>
      </div>

      {view === 'APP' ? (
        <AppLayout userRole={role} />
      ) : (
        <AdminLayout userRole={role} />
      )}
    </div>
  );
};

export default App;
