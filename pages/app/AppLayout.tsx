
import React, { useState } from 'react';
import { Role } from '../../types';
import { MOCK_USERS } from '../../services/mockData';
import Home from './Home';
import MoldInquiry from './MoldInquiry';
import TransferFlow from './TransferFlow';
import MaintenanceFlow from './MaintenanceFlow';
import RepairFlow from './RepairFlow';

interface AppLayoutProps {
  userRole: Role;
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ userRole, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'inquiry' | 'transfer' | 'maintenance' | 'repair'>('main');
  const [showProfile, setShowProfile] = useState(false);

  // 获取当前用户信息
  const currentUser = MOCK_USERS.find(u => u.role === userRole);

  const renderScreen = () => {
    switch(currentScreen) {
      case 'inquiry': return <MoldInquiry onBack={() => setCurrentScreen('main')} />;
      case 'transfer': return <TransferFlow onBack={() => setCurrentScreen('main')} />;
      case 'maintenance': return <MaintenanceFlow onBack={() => setCurrentScreen('main')} />;
      case 'repair': return <RepairFlow onBack={() => setCurrentScreen('main')} />;
      default: return <Home userRole={userRole} onNavigate={setCurrentScreen} />;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch(role) {
      case Role.Admin: return '管理员';
      case Role.MoldEngineerBig: return '大材料工程师';
      case Role.MoldEngineerSmall: return '小材料工程师';
      case Role.ShiftLeader: return '带班';
      case Role.Operator: return '操作员';
      default: return role;
    }
  };

  const getRoleShortLabel = (role: Role) => {
    switch(role) {
      case Role.Admin: return '管';
      case Role.MoldEngineerBig: return '大';
      case Role.MoldEngineerSmall: return '小';
      case Role.ShiftLeader: return '带';
      case Role.Operator: return '员';
      default: return 'U';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-slate-100">
      {/* 手机外边框容器 */}
      <div className="relative mx-auto border-slate-900 bg-slate-900 border-[12px] rounded-[3rem] h-[844px] w-[390px] shadow-2xl overflow-hidden flex flex-col">
        {/* 顶部刘海屏装饰 */}
        <div className="absolute top-0 inset-x-0 flex justify-center z-50">
          <div className="bg-slate-900 h-7 w-40 rounded-b-3xl flex items-center justify-around px-4">
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        {/* 内部应用容器 */}
        <div className="flex-1 bg-white rounded-[2rem] overflow-hidden flex flex-col relative">
          {/* 顶部导航 */}
          <header className="bg-blue-600 text-white px-6 pt-10 pb-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-microchip"></i>
              SmartMold Pro
            </h1>
            <button 
              onClick={() => setShowProfile(true)}
              className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-xs border border-blue-400 font-bold active:scale-90 transition-transform"
            >
              {getRoleShortLabel(userRole)}
            </button>
          </header>

          {/* 主体内容 */}
          <main className="flex-1 overflow-y-auto pb-20">
            {renderScreen()}
          </main>

          {/* 底部导航 (简化版) */}
          <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 z-40">
            <button 
              onClick={() => {
                setCurrentScreen('main');
                setShowProfile(false);
              }}
              className={`flex flex-col items-center gap-1 ${currentScreen === 'main' && !showProfile ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <i className="fas fa-home text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">首页</span>
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className={`flex flex-col items-center gap-1 ${showProfile ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <i className="fas fa-user text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">我的</span>
            </button>
          </nav>

          {/* 个人信息弹窗 (Full Screen Modal) */}
          {showProfile && (
            <div className="absolute inset-0 bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out transform">
              {/* 弹窗顶部 */}
              <div className="bg-slate-50 px-6 pt-12 pb-8 flex flex-col items-center text-center">
                <button 
                  onClick={() => setShowProfile(false)}
                  className="absolute top-10 left-6 text-slate-400 hover:text-slate-600 p-2"
                >
                  <i className="fas fa-chevron-left text-xl"></i>
                </button>
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner border-4 border-white">
                  {currentUser?.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-slate-800">{currentUser?.name}</h2>
                <p className="text-blue-600 font-semibold text-sm mt-1">{getRoleLabel(userRole)}</p>
                <p className="text-slate-400 text-xs mt-1">ID: {currentUser?.id}</p>
              </div>

              {/* 详细信息列表 */}
              <div className="flex-1 px-6 py-8 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">个人账户详情</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <i className="fas fa-building"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">所属部门</p>
                        <p className="text-sm font-semibold text-slate-700">{currentUser?.department || '未设置'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <i className="fas fa-envelope"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">邮箱地址</p>
                        <p className="text-sm font-semibold text-slate-700">{currentUser?.email || '未设置'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">最后登录</p>
                        <p className="text-sm font-semibold text-slate-700">{currentUser?.lastLogin || '刚刚'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if(window.confirm('确定要退出登录吗？')) {
                        onLogout();
                      }
                    }}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-red-100 transition-colors border border-red-100"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    退出当前账号
                  </button>
                </div>
              </div>

              {/* 底部装饰 */}
              <div className="p-8 text-center">
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">SmartMold Pro v5.1</p>
              </div>
            </div>
          )}

          {/* 底部小黑条 (iPhone 底部指示器) */}
          <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
