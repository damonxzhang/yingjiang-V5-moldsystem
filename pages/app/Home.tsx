
import React, { useState, useEffect } from 'react';
import { Role } from '../../types';
import { DashboardService } from '../../services/dashboardService';
import { AuthService } from '../../services/authService';
import type { MachineTodo, DashboardMachine } from '../../services/dashboardService';

interface HomeProps {
  userRole: Role;
  onNavigate: (screen: 'main' | 'inquiry' | 'transfer' | 'maintenance' | 'maintenance_scan' | 'repair') => void;
}

const Home: React.FC<HomeProps> = ({ userRole, onNavigate }) => {
  const [todoList, setTodoList] = useState<MachineTodo[]>([]);
  const [isLoadingTodo, setIsLoadingTodo] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTodoList();
  }, []);

  const loadTodoList = async () => {
    setIsLoadingTodo(true);
    try {
      const authData = AuthService.getStoredAuth();
      if (!authData) {
        setTodoList([]);
        return;
      }

      const department = authData.department || 'ALL';

      const dashboardData = await DashboardService.fetchDashboardMachinesStatus({
        department: department
      });

      const machinesWithTodos: DashboardMachine[] = (dashboardData?.machines || []).filter(
        (machine) => machine.pending_todos_count && machine.pending_todos_count > 0
      );

      if (machinesWithTodos.length === 0) {
        setTodoList([]);
        return;
      }

      const todoPromises = machinesWithTodos.map((machine) =>
        DashboardService.fetchMachineTodoList({ machine_code: machine.machine_code })
      );

      const results = await Promise.allSettled(todoPromises);

      const allTodos: MachineTodo[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allTodos.push(...result.value);
        }
      });

      allTodos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTodoList(allTodos);
    } catch (error) {
      console.error('获取待办清单失败:', error);
      setTodoList([]);
    } finally {
      setIsLoadingTodo(false);
    }
  };

  const toggleTaskComplete = (machineId: string | number, moldId: string | number, type: string) => {
    const taskId = `${machineId}-${moldId}-${type}`;
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const actions = [
    { id: 'inquiry', name: '模具查询', icon: 'fa-search', color: 'bg-indigo-500', roles: [Role.Admin, Role.MoldEngineerBig, Role.MoldEngineerSmall, Role.Operator, Role.ShiftLeader] },
    { id: 'transfer', name: '模具转换', icon: 'fa-exchange-alt', color: 'bg-green-500', roles: [Role.Admin, Role.Operator, Role.MoldEngineerBig, Role.MoldEngineerSmall, Role.ShiftLeader] },
    { id: 'maintenance', name: 'MMS保养', icon: 'fa-tools', color: 'bg-amber-500', roles: [Role.Admin, Role.ShiftLeader, Role.MoldEngineerBig, Role.MoldEngineerSmall] },
    { id: 'repair', name: '维修执行', icon: 'fa-wrench', color: 'bg-red-500', roles: [Role.Admin, Role.ShiftLeader, Role.MoldEngineerBig, Role.MoldEngineerSmall] },
  ];
  // const filteredActions = actions.filter(a => a.roles.includes(userRole));
  const filteredActions = actions
  return (
    <div className="p-4 space-y-6">
      {/* 快捷操作 */}
      <div>
        <h2 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
          <i className="fas fa-bolt text-amber-400"></i>
          快捷入口
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {filteredActions.map(action => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`${action.color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-2 group-active:scale-95 transition-transform`}>
                <i className={`fas ${action.icon} text-base`}></i>
              </div>
              <span className="text-xs font-semibold text-slate-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 待办清单 */}
      <div>
        <h2 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
          <i className="fas fa-clipboard-list text-indigo-500"></i>
          待办清单
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoadingTodo ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-slate-400 text-xs font-bold">加载中...</span>
            </div>
          ) : todoList.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-3xl text-green-500/50 mb-2"></i>
              <p className="text-slate-400 text-sm">暂无待办事项</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todoList.flatMap((todo) => {
                // 如果有 molds 数组，展开为多项
                if (todo.payload?.molds && todo.payload.molds.length > 1) {
                  return (todo.payload.molds as { mold_code: string; slot: string; type?: string; text?: string }[]).map((m, idx) => {
                    const subType = m.type || todo.type;
                    const subText = m.text || todo.payload?.description || todo.type;
                    const subId = `${todo.id}-${idx}`;
                    const taskId = `${todo.machine_id}-${subId}-${subType}`;
                    const isCompleted = completedTasks.has(taskId);

                    if (subType === 'REMOVAL') {
                      return (
                        <button
                          key={subId}
                          onClick={() => toggleTaskComplete(todo.machine_id, subId, subType)}
                          className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-red-50 text-red-500">
                              <i className="fas fa-arrow-down"></i>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">{m.mold_code}</span>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-600">待拆下</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{subText} · {m.slot}</p>
                              <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase">
                                <i className="fas fa-microchip mr-1"></i>
                                {todo.created_at}
                              </p>
                            </div>
                          </div>
                          <i className="fas fa-chevron-right text-slate-300"></i>
                        </button>
                      );
                    }
                    if (subType === 'MAINTENANCE') {
                      return (
                        <button
                          key={subId}
                          onClick={() => onNavigate('maintenance_scan')}
                          className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <i className="fas fa-tools"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-800">{m.mold_code}</h4>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{subText} - {m.slot}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <i className="far fa-clock"></i>
                                {todo.created_at}
                              </span>
                            </div>
                          </div>
                          <i className="fas fa-chevron-right text-slate-300"></i>
                        </button>
                      );
                    }
                    if (subType === 'REPAIR') {
                      return (
                        <button
                          key={subId}
                          onClick={() => toggleTaskComplete(todo.machine_id, subId, subType)}
                          className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <i className="fas fa-wrench"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-800">{m.mold_code}</h4>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{subText} - {m.slot}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <i className="far fa-clock"></i>
                                {todo.created_at}
                              </span>
                            </div>
                          </div>
                          <i className="fas fa-chevron-right text-slate-300"></i>
                        </button>
                      );
                    }
                    return null;
                  });
                }

                // 无 molds 数组，正常渲染
                const taskId = `${todo.machine_id}-${todo.mold_id}-${todo.type}`;
                const isCompleted = completedTasks.has(taskId);

                // 保养任务使用待保养任务列表卡片样式
                if (todo.type === 'MAINTENANCE') {
                  return (
                    <button
                      key={todo.id}
                      onClick={() => toggleTaskComplete(todo.machine_id, todo.mold_id, todo.type)}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <i className="fas fa-tools"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800">{todo.mold_code}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">#{todo.id}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">MMS推送保养信息 - {todo.slot}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <i className="far fa-clock"></i>
                            {todo.created_at}
                          </span>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-slate-300"></i>
                    </button>
                  );
                }

                // 维修任务使用待维修任务列表卡片样式
                if (todo.type === 'REPAIR') {
                  return (
                    <button
                      key={todo.id}
                      onClick={() => toggleTaskComplete(todo.machine_id, todo.mold_id, todo.type)}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <i className="fas fa-wrench"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800">{todo.mold_code}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">#{todo.id}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">维修待处理 - {todo.slot}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <i className="far fa-clock"></i>
                            {todo.created_at}
                          </span>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-slate-300"></i>
                    </button>
                  );
                }

                // 模具下架任务使用生产清单卡片样式
                if (todo.type === 'REMOVAL') {
                  return (
                    <button
                      key={todo.id}
                      onClick={() => toggleTaskComplete(todo.machine_id, todo.mold_id, todo.type)}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-red-50 text-red-500">
                          <i className="fas fa-arrow-down"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800">{todo.mold_code}</span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-600">
                              待拆下
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">模具下架待处理 · {todo.slot}</p>
                          <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase">
                            <i className="fas fa-microchip mr-1"></i>
                            {todo.created_at}
                          </p>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-slate-300"></i>
                    </button>
                  );
                }

                const typeStyle = {
                  REMOVAL: { dot: 'bg-red-500', label: 'text-red-500', btn: 'bg-red-600/20 text-red-600 border-red-500/30 hover:bg-red-600 hover:text-white', text: '模具下架待处理' },
                  MAINTENANCE: { dot: 'bg-amber-500', label: 'text-amber-500', btn: 'bg-amber-600/20 text-amber-600 border-amber-500/30 hover:bg-amber-600 hover:text-white', text: 'MMS推送保养信息' },
                  REPAIR: { dot: 'bg-blue-500', label: 'text-blue-500', btn: 'bg-blue-600/20 text-blue-600 border-blue-500/30 hover:bg-blue-600 hover:text-white', text: '维修待处理' }
                }[todo.type] || { dot: 'bg-indigo-500', label: 'text-indigo-400', btn: 'bg-amber-600/20 text-amber-600 border-amber-500/30 hover:bg-amber-600 hover:text-white', text: todo.type };
                return (
                  <div key={todo.id} className={`flex items-center justify-between p-4 transition-colors ${isCompleted ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${typeStyle.dot}`}></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{todo.slot}</span>
                          <span className="text-[10px] font-bold text-slate-400">{todo.mold_code}</span>
                        </div>
                        <p className={`text-xs font-black ${isCompleted ? 'text-green-400 line-through' : typeStyle.label}`}>
                          {typeStyle.text}
                        </p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{todo.created_at}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaskComplete(todo.machine_id, todo.mold_id, todo.type)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all border shrink-0 ml-2 ${
                        isCompleted
                          ? 'bg-green-600 text-white border-green-500'
                          : typeStyle.btn
                      }`}
                    >
                      {isCompleted ? (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>
                          已完成
                        </span>
                      ) : '确认信息'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;