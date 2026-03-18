
import React, { useState, useEffect } from 'react';
import { Role, AuthData } from './types';
import { AuthService } from './services/authService';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AppLayout from './pages/app/AppLayout';

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'ADMIN'>('ADMIN');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userData, setUserData] = useState<AuthData | null>(null);

  // 组件挂载时检查会话存储
  useEffect(() => {
    const storedAuth = AuthService.getStoredAuth();
    if (storedAuth) {
      setUserData(storedAuth);
      setIsLoggedIn(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (data: AuthData) => {
    setUserData(data);
    setIsLoggedIn(true);
  };

  // 处理登出
  const handleLogout = () => {
    AuthService.logout();
    setUserData(null);
    setIsLoggedIn(false);
  };

  // 正在检查认证状态
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，显示登录页面
  if (!isLoggedIn || !userData) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen">
      {/* 开发模式切换器 - 生产环境中应移除 */}
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
        <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-bold">
          {userData.username}
        </div>
      </div>

      {view === 'APP' ? (
        <AppLayout userRole={userData.role} onLogout={handleLogout} />
      ) : (
        <AdminLayout userRole={userData.role} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
