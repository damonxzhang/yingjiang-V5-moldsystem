import React, { useState, useEffect, useRef } from 'react';
import {
  fetchMachineBaseList,
  fetchMachineBaseDetail,
  saveMachineBase,
  deleteMachineBase,
  MachineBaseListItem,
  FetchMachineBaseListParams
} from '../../services/machineBaseService';
import { AuthService } from '../../services/authService';

/**
 * 前端机台数据类型
 */
interface MachineBase {
  id: string;
  machineId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  department: string;
  location: string;
  partNo: string;
  totalSlots: number;
  status: 'NORMAL' | 'DISABLED' | 'FAULT' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  createdAt: string;
}

/**
 * 状态标签映射
 */
const STATUS_LABELS: Record<string, string> = {
  'NORMAL': '启用',
  'DISABLED': '停用',
  'FAULT': '故障',
  'WARNING': '预警',
  'CRITICAL': '临界',
  'MAINTENANCE': '维保中'
};

/**
 * 状态颜色映射
 */
const STATUS_COLORS: Record<string, string> = {
  'NORMAL': 'bg-green-100 text-green-700 border-green-200',
  'DISABLED': 'bg-gray-100 text-gray-700 border-gray-200',
  'FAULT': 'bg-red-100 text-red-700 border-red-200',
  'WARNING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'CRITICAL': 'bg-purple-100 text-purple-700 border-purple-200',
  'MAINTENANCE': 'bg-blue-100 text-blue-700 border-blue-200'
};

const ITEMS_PER_PAGE = 20;

const MachineBaseList: React.FC = () => {
  const [machines, setMachines] = useState<MachineBase[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | 'VIEW'>('ADD');
  const [currentMachine, setCurrentMachine] = useState<Partial<MachineBase>>({});
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FetchMachineBaseListParams>({
    department: 'ALL',
    machine_code: '',
    status: '',
    page: 1,
    page_size: ITEMS_PER_PAGE
  });

  const isFirstRender = useRef(true);
  const isLoadingRef = useRef(false);

  /**
   * 将 API 数据映射为前端数据格式
   */
  const mapApiToFrontend = (apiItem: MachineBaseListItem): MachineBase => {
    return {
      id: String(apiItem.machine_id),
      machineId: apiItem.machine_id,
      machineCode: apiItem.machine_code,
      machineName: apiItem.machine_code,
      machineType: apiItem.type || '-',
      department: apiItem.department || '-',
      location: apiItem.location || '-',
      partNo: apiItem.part_no || '-',
      totalSlots: apiItem.total_slots || 0,
      status: apiItem.status || 'NORMAL',
      createdAt: apiItem.created_at || '-'
    };
  };

  /**
   * 加载机台列表数据
   */
  const loadMachineList = async (page: number = 1) => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchMachineBaseList({
        ...filters,
        page: page,
        page_size: ITEMS_PER_PAGE
      });

      if (response.code === 200 && response.data) {
        const mappedMachines = response.data.list.map(mapApiToFrontend);
        setMachines(mappedMachines);
        setTotalRecords(response.data.total);
      } else {
        setError(response.message || '获取数据失败');
        setMachines([]);
        setTotalRecords(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      setMachines([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    // 防止 React StrictMode 导致的重复请求
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadMachineList(1);
    }
  }, []);

  // 当页码变化时重新加载
  useEffect(() => {
    if (!isFirstRender.current) {
      loadMachineList(currentPage);
    }
  }, [currentPage]);

  // 计算总页数
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  /**
   * 处理查询按钮点击
   */
  const handleSearch = () => {
    setCurrentPage(1);
    loadMachineList(1);
  };

  /**
   * 处理保存机台
   */
  const handleSave = async () => {
    try {
      const saveParams = {
        machine_id: modalMode === 'EDIT' ? currentMachine.machineId : undefined,
        machine_code: currentMachine.machineCode || '',
        department: currentMachine.department || '大材料',
        status: currentMachine.status || 'NORMAL',
        location: currentMachine.location || '',
        type: currentMachine.machineType || '',
        part_no: currentMachine.partNo || '',
        total_slots: currentMachine.totalSlots || 4
      };

      const response = await saveMachineBase(saveParams);

      if (response.code === 200) {
        alert(response.message || '保存成功');
        // 重置加载标志，确保能刷新数据
        isLoadingRef.current = false;
        loadMachineList(currentPage);
      } else {
        alert(response.message || '保存失败');
      }
    } catch (err) {
      console.error('保存机台失败:', err);
      alert(err instanceof Error ? err.message : '保存失败');
    }

    setIsModalOpen(false);
    setCurrentMachine({});
  };

  /**
   * 处理删除机台
   */
  const handleDelete = async (machineId: number) => {
    if (!confirm('确定要删除该机台吗？')) return;

    try {
      const response = await deleteMachineBase(machineId);
      if (response.code === 200) {
        alert('删除成功');
        // 重置加载标志，确保能刷新数据
        isLoadingRef.current = false;
        // 按当前筛选条件重新请求接口
        loadMachineList(currentPage);
      } else {
        alert(response.message || '删除失败');
      }
    } catch (err) {
      console.error('删除机台失败:', err);
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  /**
   * 处理编辑机台
   */
  const handleEdit = async (machine: MachineBase) => {
    setModalMode('EDIT');
    setIsModalOpen(true);
    setModalLoading(true);
    setCurrentMachine({}); // 清空之前的数据

    try {
      const response = await fetchMachineBaseDetail(machine.machineId);

      if (response.code === 200 && response.data) {
        const detail = response.data;
        setCurrentMachine({
          machineId: detail.machine_id,
          machineCode: detail.machine_code,
          department: detail.department,
          location: detail.location,
          machineType: detail.type,
          partNo: detail.part_no,
          totalSlots: detail.total_slots,
          status: detail.status as any
        });
      } else {
        // 如果获取详情失败，使用列表中的数据
        setCurrentMachine(machine);
      }
    } catch (err) {
      console.error('获取机台详情失败:', err);
      setCurrentMachine(machine);
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * 处理查看机台详情
   */
  const handleView = async (machine: MachineBase) => {
    setModalMode('VIEW');
    setIsModalOpen(true);
    setModalLoading(true);
    setCurrentMachine({}); // 清空之前的数据

    try {
      const response = await fetchMachineBaseDetail(machine.machineId);

      if (response.code === 200 && response.data) {
        const detail = response.data;
        setCurrentMachine({
          machineId: detail.machine_id,
          machineCode: detail.machine_code,
          department: detail.department,
          location: detail.location,
          machineType: detail.type,
          partNo: detail.part_no,
          totalSlots: detail.total_slots,
          status: detail.status as any
        });
      } else {
        setCurrentMachine(machine);
      }
    } catch (err) {
      console.error('获取机台详情失败:', err);
      setCurrentMachine(machine);
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * 获取当前用户部门
   */
  const getUserDepartment = () => {
    const authData = AuthService.getStoredAuth();
    return authData?.department || 'ALL';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          机台管理
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setModalMode('ADD');
              setIsModalOpen(true);
              setModalLoading(false);
              setCurrentMachine({
                department: getUserDepartment() === 'ALL' ? '大材料' : getUserDepartment(),
                status: 'NORMAL'
              });
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition-colors"
          >
            + 新增机台
          </button>
        </div>
      </div>

      {/* 筛选控件 */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">机台编号:</label>
          <input
            type="text"
            value={filters.machine_code}
            onChange={(e) => setFilters({ ...filters, machine_code: e.target.value })}
            placeholder="输入机台编号"
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">部门:</label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ALL">全部部门</option>
            <option value="大材料">大材料</option>
            <option value="小材料">小材料</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">状态:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="NORMAL">启用</option>
            <option value="DISABLED">停用</option>
            {/* <option value="FAULT">故障</option>
            <option value="WARNING">预警</option>
            <option value="CRITICAL">临界</option>
            <option value="MAINTENANCE">维保中</option> */}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            查询
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* 空数据提示 */}
      {!loading && !error && machines.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无机台数据</p>
          </div>
        </div>
      )}

      {!loading && machines.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-4 font-bold">机台编号</th>
                <th className="px-4 py-4 font-bold">部门</th>
                <th className="px-4 py-4 font-bold">位置</th>
                <th className="px-4 py-4 font-bold">机台类型</th>
                <th className="px-4 py-4 font-bold">资产编号</th>
                <th className="px-4 py-4 font-bold">状态</th>
                <th className="px-4 py-4 font-bold">创建时间</th>
                <th className="px-4 py-4 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machines.map(machine => (
                <tr key={machine.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono font-bold text-slate-700">{machine.machineCode}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                      {machine.department}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600">{machine.location}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600">{machine.machineType}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-slate-500">{machine.partNo}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_COLORS[machine.status]}`}>
                      {STATUS_LABELS[machine.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm">{machine.createdAt}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(machine)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleEdit(machine)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                      >
                        编辑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页 */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              共 {totalRecords} 条记录，第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // 显示当前页附近的页码
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }
                const page = startPage + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增/编辑/查看弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === 'ADD' ? '新增机台' : modalMode === 'EDIT' ? '编辑机台' : '机台详情'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalLoading(false);
                }}
                disabled={modalLoading}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 relative">
              {modalLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <span className="mt-3 text-sm text-slate-500">加载中...</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">机台编号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={currentMachine.machineCode || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, machineCode: e.target.value })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                    placeholder="请输入机台编号"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">所属部门 <span className="text-red-500">*</span></label>
                  <select
                    value={currentMachine.department || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, department: e.target.value })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                  >
                    <option value="">请选择部门</option>
                    <option value="大材料">大材料</option>
                    <option value="小材料">小材料</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">存放位置</label>
                  <input
                    type="text"
                    value={currentMachine.location || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, location: e.target.value })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                    placeholder="请输入存放位置"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">机台类型</label>
                  <input
                    type="text"
                    value={currentMachine.machineType || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, machineType: e.target.value })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                    placeholder="请输入机台类型"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">资产编号</label>
                  <input
                    type="text"
                    value={currentMachine.partNo || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, partNo: e.target.value })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                    placeholder="请输入资产编号"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">状态</label>
                  <select
                    value={currentMachine.status || ''}
                    onChange={(e) => setCurrentMachine({ ...currentMachine, status: e.target.value as any })}
                    disabled={modalMode === 'VIEW' || modalLoading}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                  >
                    <option value="">请选择状态</option>
                    <option value="NORMAL">启用</option>
                    <option value="DISABLED">停用</option>
                    {/* <option value="FAULT">故障</option>
                    <option value="WARNING">预警</option>
                    <option value="CRITICAL">临界</option>
                    <option value="MAINTENANCE">维保中</option> */}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalLoading(false);
                }}
                disabled={modalLoading}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              {modalMode !== 'VIEW' && (
                <button
                  onClick={handleSave}
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  保存
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineBaseList;
