
import React, { useState } from 'react';
import { Role } from '../../types';
import Home from './Home';
import MoldInquiry from './MoldInquiry';
import TransferFlow from './TransferFlow';
import MaintenanceFlow from './MaintenanceFlow';
import RepairFlow from './RepairFlow';

interface AppLayoutProps {
  userRole: Role;
}

const AppLayout: React.FC<AppLayoutProps> = ({ userRole }) => {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'inquiry' | 'transfer' | 'maintenance' | 'repair'>('main');

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
            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-xs border border-blue-400 font-bold">
              {getRoleLabel(userRole)}
            </div>
          </header>

          {/* 主体内容 */}
          <main className="flex-1 overflow-y-auto pb-20">
            {renderScreen()}
          </main>

          {/* 底部导航 (简化版) */}
          <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 z-40">
            <button 
              onClick={() => setCurrentScreen('main')}
              className={`flex flex-col items-center gap-1 ${currentScreen === 'main' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <i className="fas fa-home text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">首页</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 text-slate-400"
            >
              <i className="fas fa-user text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">我的</span>
            </button>
          </nav>

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
