
import React, { useState } from 'react';
import { Role } from './types';
import AdminLayout from './pages/admin/AdminLayout';
import AppLayout from './pages/app/AppLayout';

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'ADMIN'>('ADMIN');
  const [role, setRole] = useState<Role>(Role.Admin);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-microchip text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SmartMold Pro</h1>
          <p className="text-slate-500">欢迎使用模具管理系统，请登录以继续</p>
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            登录系统
          </button>
        </div>
      </div>
    );
  }

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
          <option value={Role.MoldEngineerBig}>大材料工程师</option>
          <option value={Role.MoldEngineerSmall}>小材料工程师</option>
          <option value={Role.ShiftLeader}>带班</option>
          <option value={Role.Operator}>操作员</option>
        </select>
      </div>

      {view === 'APP' ? (
        <AppLayout userRole={role} onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <AdminLayout userRole={role} />
      )}
    </div>
  );
};

export default App;
