
import React, { useState } from 'react';
import { Role, Permission } from '../../types';
import { ROLE_PERMISSIONS } from '../../services/mockData';
import Dashboard from './Dashboard';
import MoldManagement from './MoldManagement';
import MaintenanceCenter from './MaintenanceCenter';
import SparePartManagement from './SparePartManagement';
import MaintenanceRecords from './MaintenanceRecords';
import RepairRecords from './RepairRecords';
import MoldSpareBinding from './MoldSpareBinding';
import ShotCountMonitor from './ShotCountMonitor';
import ProductionReadyList from './ProductionReadyList';
import ToolingDashboard from './ToolingDashboard';
import MachineDashboard from './MachineDashboard';
import SparePartPrediction from './SparePartPrediction';
import RoleManagement from './RoleManagement';
import UserManagement from './UserManagement';
import MaintenanceOptionManagement from './MaintenanceOptionManagement';
import RepairOptionManagement from './RepairOptionManagement';

interface AdminLayoutProps {
  userRole: Role;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ userRole }) => {
  const [activePage, setActivePage] = useState<'dashboard' | 'production_list' | 'shot_monitor' | 'molds_big' | 'molds_small' | 'molds_audit' | 'spares_big' | 'spares_small' | 'prediction' | 'binding' | 'maintenance_confirm' | 'maintenance_logs' | 'repair_logs' | 'tooling_screen' | 'machine_screen' | 'role_manage' | 'user_manage' | 'maintenance_option_manage' | 'repair_option_manage'>('machine_screen');

  // 获取当前角色的权限
  const userPermissions = ROLE_PERMISSIONS.find(rp => rp.role === userRole)?.permissions || [];

  const hasPermission = (permission: Permission) => {
    return userPermissions.includes(permission);
  };

  const menuItems = [
    { id: 'machine_screen', name: '设备生产看板 (主入口)', icon: 'fa-display', permission: Permission.MONITOR_SCREEN_VIEW },
    { id: 'dashboard', name: '仪表盘 (待定)', icon: 'fa-chart-pie', permission: Permission.DASHBOARD_VIEW },
    { id: 'tooling_screen', name: '模具监控大屏', icon: 'fa-desktop', permission: Permission.MONITOR_SCREEN_VIEW },
    { id: 'production_list', name: '可生产产品 LIST', icon: 'fa-list-check', permission: Permission.MOLD_VIEW },
    { id: 'shot_monitor', name: '实时 Shot 数监控', icon: 'fa-wave-square', permission: Permission.MOLD_VIEW },
    { id: 'molds_big', name: '模具台账 (大材料)', icon: 'fa-cube', department: '大材料', permission: Permission.MOLD_VIEW },
    { id: 'molds_small', name: '模具台账 (小材料)', icon: 'fa-cube', department: '小材料', permission: Permission.MOLD_VIEW },
    { id: 'molds_audit', name: 'Audit 清单（单独账号）', icon: 'fa-clipboard-list', permission: Permission.MOLD_AUDIT },
    { id: 'spares_big', name: '备件管理 (大材料)', icon: 'fa-cog', department: '大材料', permission: Permission.SPARE_VIEW },
    { id: 'spares_small', name: '备件管理 (小材料)', icon: 'fa-cog', department: '小材料', permission: Permission.SPARE_VIEW },
    { id: 'prediction', name: '备件购买预测', icon: 'fa-magnifying-glass-chart', permission: Permission.SPARE_PREDICTION },
    { id: 'binding', name: '模具配件绑定', icon: 'fa-link', permission: Permission.MOLD_EDIT },
    { id: 'maintenance_confirm', name: '【任务中心（待定）】', icon: 'fa-envelope-open-text', permission: Permission.MAINTENANCE_MANAGE },
    { id: 'maintenance_logs', name: '保养执行记录', icon: 'fa-clipboard-check', permission: Permission.MAINTENANCE_VIEW },
    { id: 'repair_logs', name: '维修执行记录', icon: 'fa-tools', permission: Permission.REPAIR_VIEW },
    { id: 'maintenance_option_manage', name: '保养选项管理', icon: 'fa-wrench', permission: Permission.MAINTENANCE_OPTION_MANAGE },
    { id: 'repair_option_manage', name: '维修选项管理', icon: 'fa-screwdriver-wrench', permission: Permission.REPAIR_OPTION_MANAGE },
    { id: 'role_manage', name: '角色权限管理', icon: 'fa-user-shield', permission: Permission.ROLE_MANAGE },
    { id: 'user_manage', name: '用户账号管理', icon: 'fa-users-gear', permission: Permission.USER_MANAGE },
  ];

  // 过滤出有权限的菜单
  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

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

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard />;
      case 'tooling_screen': return <ToolingDashboard onSwitchView={(view) => setActivePage(view === 'tooling' ? 'tooling_screen' : 'machine_screen')} />;
      case 'machine_screen': return <MachineDashboard onSwitchView={(view) => setActivePage(view === 'tooling' ? 'tooling_screen' : 'machine_screen')} />;
      case 'production_list': return <ProductionReadyList />;
      case 'shot_monitor': return <ShotCountMonitor />;
      case 'molds_big': return <MoldManagement department="大材料" />;
      case 'molds_small': return <MoldManagement department="小材料" />;
      case 'molds_audit': return <MoldManagement isAuditMode={true} />;
      case 'maintenance_confirm': return <MaintenanceCenter />;
      case 'spares_big': return <SparePartManagement department="大材料" />;
      case 'spares_small': return <SparePartManagement department="小材料" />;
      case 'prediction': return <SparePartPrediction />;
      case 'binding': return <MoldSpareBinding />;
      case 'maintenance_logs': return <MaintenanceRecords />;
      case 'repair_logs': return <RepairRecords />;
      case 'maintenance_option_manage': return <MaintenanceOptionManagement />;
      case 'repair_option_manage': return <RepairOptionManagement />;
      case 'role_manage': return <RoleManagement />;
      case 'user_manage': return <UserManagement />;
      default: return <div className="p-10 text-slate-400 italic">该模块正在开发中...</div>;
    }
  };

  const isBigScreen = activePage === 'tooling_screen' || activePage === 'machine_screen';

  return (
    <div className={`flex min-h-screen ${isBigScreen ? 'bg-[#050a30]' : 'bg-slate-100'}`}>
      {/* 侧边栏 */}
      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full shadow-2xl z-40 transition-transform ${isBigScreen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 relative group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-lg leading-none">SmartMold</h1>
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase font-mono">V 5.1.20260213.002</span>
          </div>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          {visibleMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-left ${activePage === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span className="font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              {userRole.slice(0, 2)}
            </div>
            <div className="text-xs">
              <p className="text-white font-bold">{getRoleLabel(userRole)}</p>
              <p className="text-slate-500">登录用户</p>
            </div>
          </div>
          <button className="mt-4 w-full text-left text-xs text-slate-500 hover:text-white flex items-center gap-2">
            <i className="fas fa-sign-out-alt"></i>
            退出系统
          </button>
        </div>
      </aside>

      {/* 主工作区 */}
      <main className={`flex-1 ${isBigScreen ? 'ml-0' : 'ml-64'} min-h-screen flex flex-col transition-all`}>
        {!isBigScreen && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <i className="fas fa-home text-xs"></i>
              <i className="fas fa-chevron-right text-[10px]"></i>
              <span className="text-sm font-medium capitalize">
                {visibleMenuItems.find(m => m.id === activePage)?.name || activePage}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <i className="far fa-bell text-lg"></i>
              </button>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                刷新数据
              </button>
            </div>
          </header>
        )}

        {isBigScreen && (
          <button 
            onClick={() => setActivePage('dashboard')}
            className="fixed top-4 left-4 z-50 bg-blue-900/50 hover:bg-blue-800 text-blue-300 w-10 h-10 rounded-full flex items-center justify-center border border-blue-500/30 transition-all group"
            title="返回后台"
          >
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          </button>
        )}

        <div className={isBigScreen ? '' : 'p-8'}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
