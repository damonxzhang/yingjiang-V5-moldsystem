import React, { useState, useEffect, useRef } from 'react';
import {
  fetchMachineStatusHistory,
  MachineStatusHistoryItem,
  FetchMachineStatusHistoryParams
} from '../../services/machineStatusHistoryService';
import Pagination from '../../components/Pagination';

/**
 * 前端机台状态变更记录数据类型
 */
interface StatusHistoryRecord {
  id: number;
  machineId: number;
  machineCode: string;
  action: 'ENABLE' | 'DISABLE' | 'ABNORMAL' | 'NORMAL';
  reason: string;
  operatorId: number;
  operatorName: string;
  createdAt: string;
}

/**
 * 操作类型标签映射
 */
const ACTION_LABELS: Record<string, string> = {
  'ENABLE': '启用',
  'DISABLE': '停用',
  'ABNORMAL': '异常',
  'NORMAL': '恢复正常'
};

/**
 * 操作类型颜色映射
 */
const ACTION_COLORS: Record<string, string> = {
  'ENABLE': 'bg-green-100 text-green-700 border-green-200',
  'DISABLE': 'bg-slate-100 text-slate-700 border-slate-200',
  'ABNORMAL': 'bg-red-100 text-red-700 border-red-200',
  'NORMAL': 'bg-blue-100 text-blue-700 border-blue-200'
};

const ITEMS_PER_PAGE = 20;

const MachineStatusHistory: React.FC = () => {
  const [records, setRecords] = useState<StatusHistoryRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FetchMachineStatusHistoryParams>({
    department: 'ALL',
    page: 1,
    page_size: ITEMS_PER_PAGE
  });

  const isFirstRender = useRef(true);
  const isLoadingRef = useRef(false);

  /**
   * 将 API 数据映射为前端数据格式
   */
  const mapApiToFrontend = (apiItem: MachineStatusHistoryItem): StatusHistoryRecord => {
    return {
      id: apiItem.id,
      machineId: apiItem.machine_id,
      machineCode: apiItem.machine_code,
      action: apiItem.action,
      reason: apiItem.reason || '-',
      operatorId: apiItem.operator_id,
      operatorName: apiItem.operator_name,
      createdAt: apiItem.created_at
    };
  };

  /**
   * 加载机台状态变更记录列表数据
   */
  const loadStatusHistoryList = async (page: number = 1) => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchMachineStatusHistory({
        ...filters,
        page: page,
        page_size: ITEMS_PER_PAGE
      });

      if (response.code === 200 && response.data) {
        const mappedRecords = response.data.items.map(mapApiToFrontend);
        setRecords(mappedRecords);
        setTotalRecords(response.data.total);
      } else {
        setError(response.message || '获取数据失败');
        setRecords([]);
        setTotalRecords(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadStatusHistoryList(1);
    }
  }, []);

  // 当页码变化时重新加载
  useEffect(() => {
    if (!isFirstRender.current) {
      loadStatusHistoryList(currentPage);
    }
  }, [currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          机台启用日志
        </h2>
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
      {!loading && !error && records.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无状态变更记录</p>
          </div>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-4 font-bold">机台编号</th>
                <th className="px-4 py-4 font-bold">操作类型</th>
                <th className="px-4 py-4 font-bold">变更原因</th>
                <th className="px-4 py-4 font-bold">操作人</th>
                <th className="px-4 py-4 font-bold">操作时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono font-bold text-slate-700">{record.machineCode}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${ACTION_COLORS[record.action]}`}>
                      {ACTION_LABELS[record.action]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm">{record.reason}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {record.operatorName.charAt(0)}
                      </div>
                      <span className="text-slate-600 text-sm">{record.operatorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm font-mono">{record.createdAt}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页 */}
          <Pagination 
            totalRecords={totalRecords} 
            currentPage={currentPage}
            onPageChange={setCurrentPage} 
          />
        </div>
      )}
    </div>
  );
};

export default MachineStatusHistory;
