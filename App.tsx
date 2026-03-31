import React, { useState, useEffect } from 'react';
import { AuthData } from './types';
import { AuthService } from './services/authService';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AppLayout from './pages/app/AppLayout';

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'ADMIN'>('ADMIN');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userData, setUserData] = useState<AuthData | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // 组件挂载时检查会话存储和 URL 参数
  useEffect(() => {
    // 检查 URL 参数
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept');
    const guest = params.get('guest');

    if (guest === 'true' && (dept === 'big' || dept === 'small' || dept === '')) {
      setIsGuestMode(true);
      // 访客模式下，模拟一个受限的访客用户
      const deptName = dept === 'big' ? '大材料' : dept === 'small' ? '小材料' : '全部部门';
      const guestAuth: AuthData = {
        user_id: 'GUEST',
        user_name: `访客 (${deptName})`,
        role: dept === 'big' ? 'MOLD_ENGINEER_BIG' : (dept === 'small' ? 'MOLD_ENGINEER_SMALL' : 'SUPER_ADMIN'),
        token: 'guest_token',
        loginTime: new Date().toISOString(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };
      setUserData(guestAuth);
      AuthService.saveAuth(guestAuth);
      setIsLoggedIn(true);
      setView('ADMIN');
    } else {
      const storedAuth = AuthService.getStoredAuth();
      if (storedAuth) {
        setUserData(storedAuth);
        setIsLoggedIn(true);
      }
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

  return (
    <div className="min-h-screen">
      {/* 开发模式切换器 - 生产环境中应移除 - 调整至右下角避免遮挡 Header 按钮 */}
      <div className="fixed bottom-4 right-4 z-[60] p-1 flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-indigo-100 opacity-40 hover:opacity-100 transition-all duration-300">
        <div className="pl-3 pr-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Debug Mode</div>
        {!isGuestMode && (
          <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200">
            <button 
              onClick={() => setView('APP')} 
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${view === 'APP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              APP (现场执行)
            </button>
            <button 
              onClick={() => setView('ADMIN')} 
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Web 后台管理
            </button>
          </div>
        )}
        
        {isLoggedIn && userData && (
          <div className={`px-3 py-1 rounded-full text-[10px] font-black shadow-sm border ${isGuestMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-green-500 text-white border-green-600'}`}>
            <i className={`fas ${isGuestMode ? 'fa-user-secret' : 'fa-user-shield'} mr-1.5`}></i>
            {userData.user_name}
          </div>
        )}

        {!isLoggedIn && (
          <div className="px-3 py-1 rounded-full text-[10px] font-black shadow-sm border bg-slate-400 text-white border-slate-500">
            <i className="fas fa-user-lock mr-1.5"></i>
            未登录
          </div>
        )}

        {isGuestMode && (
          <button 
            onClick={() => window.location.href = window.location.pathname}
            className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors ml-2"
          >
            返回登录
          </button>
        )}
      </div>

      {view === 'APP' ? (
        <AppLayout 
          userRole={userData?.role || 'MOLD_ENGINEER_BIG'} 
          onLogout={handleLogout} 
        />
      ) : (!isLoggedIn || !userData) ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminLayout userRole={userData.role} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
