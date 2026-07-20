import React, { useState, useEffect, useRef } from 'react';
import { fetchMaintenanceRecords, fetchMaintenanceDetail, MaintenanceRecordItem, MaintenanceDetailResponse, MaintenanceDetailFirstStep, MaintenanceDetailSecondStep, MaintenanceDetailThirdStep, MaintenanceDetailFourthStep } from '../../services/maintenanceRecordsService';

const ITEMS_PER_PAGE = 20;

const MaintenanceRecords: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecordItem[]>([]);
  const [allRecords, setAllRecords] = useState<MaintenanceRecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecordItem | null>(null);
  const [detailData, setDetailData] = useState<MaintenanceDetailResponse['data'] | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  const loadData = async (page: number) => {
    if (inFlightRef.current) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      inFlightRef.current = fetchMaintenanceRecords({
        search: searchText,
        date: dateFilter,
        page: page,
        page_size: ITEMS_PER_PAGE
      }).then(response => {
        setRecords(response.data.list);
        setAllRecords(response.data.list);
        setTotalRecords(response.data.total);
      }).catch(err => {
        setError((err as any).message || '获取保养执行记录失败');
      }).finally(() => {
        inFlightRef.current = null;
        setLoading(false);
      });
      await inFlightRef.current;
    } catch (err: any) {
      setError(err.message || '获取保养执行记录失败');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const openDetail = async (record: MaintenanceRecordItem) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    
    try {
      const response = await fetchMaintenanceDetail({ id: record.id });
      setDetailData(response.data);
    } catch (err: any) {
      console.error('获取保养详情失败:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">APP 保养执行记录汇总</h2>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="搜索模具编号、工单编号或操作员..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input 
          type="date" 
          value={dateFilter}
          onChange={handleDateChange}
          className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-sm outline-none" 
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          查询
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">工单编号</th>
              <th className="px-6 py-4 font-bold">任务来源</th>
              <th className="px-6 py-4 font-bold">模具对象</th>
              <th className="px-6 py-4 font-bold">执行人员</th>
              <th className="px-6 py-4 font-bold">保养结果</th>
              <th className="px-6 py-4 font-bold">验收状态</th>
              <th className="px-6 py-4 font-bold">执行项数</th>
              <th className="px-6 py-4 font-bold">完成时间</th>
              <th className="px-6 py-4 font-bold">归位</th>
              <th className="px-6 py-4 font-bold text-right">全流程查看</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{record.order_no}</td>
                <td className="px-6 py-4">
                  {record.task_source === '定时任务' || record.task_source === 'SCHEDULED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      <i className="fas fa-clock"></i> 定时任务
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      <i className="fas fa-hand-pointer"></i> 临时添加
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-indigo-600 font-black">{record.mold_code || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-bold">{record.executor_name || '-'}</td>
                <td className="px-6 py-4">
                  {record.maintenance_result === 'OK' ? (
                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">OK</span>
                  ) : record.maintenance_result === 'NG' ? (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">NG</span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">WAIT</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {record.buyoff_status === 'PASSED' ? (
                    <span className="text-[10px] text-green-600 font-black flex items-center gap-1 uppercase">
                      <i className="fas fa-check-double"></i> Passed
                    </span>
                  ) : record.buyoff_status === 'FAILED' ? (
                    <span className="text-[10px] text-red-600 font-black flex items-center gap-1 uppercase">
                      <i className="fas fa-times-circle"></i> Failed
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-black uppercase">None</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {record.option_count_text}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{record.complete_time || '-'}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                  {record.location || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openDetail(record)}
                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-black uppercase tracking-tighter"
                  >
                    Details <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                  暂无保养执行记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalRecords > 0 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-left mr-1"></i> 上一页
          </button>
          
          <div className="flex gap-1">
            {(() => {
              const pages = [];
              const maxVisible = 5;
              
              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                pages.push(1);
                
                if (currentPage > 3) {
                  pages.push('...');
                }
                
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                  pages.push(i);
                }
                
                if (currentPage < totalPages - 2) {
                  pages.push('...');
                }
                
                if (totalPages > 1) {
                  pages.push(totalPages);
                }
              }
              
              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={index} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              });
            })()}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页 <i className="fas fa-chevron-right ml-1"></i>
          </button>
          
          <span className="text-sm text-slate-500 ml-4">
            共 {totalRecords} 条记录，第 {currentPage}/{totalPages} 页
          </span>
        </div>
      )}

      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <i className="fas fa-wrench text-lg"></i>
                  </div>
                  <h3 className="font-black text-xl tracking-tight">保养执行详情</h3>
                </div>
                <p className="text-xs text-white/70 font-bold mt-2">工单编号: {selectedRecord.order_no} | 模具: {selectedRecord.mold_code}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 space-y-6">
                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-600 font-black text-sm">01</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">第一阶段</h4>
                        </div>
                      </div>
                      <div className="space-y-3 pl-13">
                        {detailData?.data?.first && Object.entries(detailData.data.first).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase capitalize">
                              {key === 'user_name' ? '创建人员' : key === 'date_time' ? '创建时间' : key === 'order_time' ? '计划时间' : key === 'machine_code' ? '机台编号' : key}
                            </span>
                            <span className="text-sm font-medium text-slate-700">{value || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <span className="text-indigo-600 font-black text-sm">02</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">第二阶段</h4>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {detailData?.data?.second && Object.entries(detailData.data.second).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase capitalize">
                              {key === 'user_name' ? '执行人员' : key === 'date_time' ? '执行时间' : key === 'short_name' ? '模具简称' : key}
                            </span>
                            <span className="text-sm font-medium text-slate-700">{value || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <span className="text-purple-600 font-black text-sm">03</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">第三阶段</h4>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {detailData?.data?.third && (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-400 uppercase">审核人员</span>
                              <span className="text-sm font-medium text-slate-700">{detailData.data.third.user_name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-400 uppercase">审核时间</span>
                              <span className="text-sm font-medium text-slate-700">{detailData.data.third.date_time || '-'}</span>
                            </div>
                            <div className="py-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">审核备注</span>
                              <p className="text-sm text-slate-700 italic bg-slate-50 p-3 rounded-lg">{detailData.data.third.comment || '-'}</p>
                            </div>
                            <div className="py-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">保养执行项目</span>
                              <div className="flex flex-wrap gap-2">
                                {detailData.data.third.options?.map((option, i) => (
                                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                                    <i className="fas fa-check mr-1"></i>{option}
                                  </span>
                                ))}
                                {(!detailData.data.third.options || detailData.data.third.options.length === 0) && (
                                  <span className="text-sm text-slate-400 italic">暂无保养项目信息</span>
                                )}
                              </div>
                            </div>
                            {detailData.data.third.picture_path && detailData.data.third.picture_path.length > 0 && (
                              <div className="py-2">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-2">现场图片</span>
                                <div className="grid grid-cols-3 gap-3">
                                  {detailData.data.third.picture_path.map((path, i) => (
                                    <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                                      <img src={path} alt={`图片 ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                          <span className="text-green-600 font-black text-sm">04</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">第四阶段</h4>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {detailData?.data?.fourth && Object.entries(detailData.data.fourth).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase capitalize">
                              {key === 'user_name' ? '验收人员' : key === 'date_time' ? '验收时间' : key === 'buyoff_status' ? '验收状态' : key === 'maintenance_result' ? '保养结果' : key}
                            </span>
                            <span className={`text-sm font-medium ${key === 'buyoff_status' && value === 'PASSED' ? 'text-green-600' : key === 'buyoff_status' && value === 'FAILED' ? 'text-red-600' : key === 'maintenance_result' && value === 'OK' ? 'text-green-600' : key === 'maintenance_result' && value === 'NG' ? 'text-red-600' : 'text-slate-700'}`}>
                              {value || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg sticky top-8">
                      <div className="flex items-center gap-2 mb-6">
                        <i className="fas fa-file-alt text-lg"></i>
                        <h4 className="text-sm font-black uppercase tracking-wider">基础信息</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white/70 uppercase">备注信息</span>
                        </div>
                        <p className="text-sm text-white/90 font-medium bg-white/10 p-3 rounded-lg">{detailData?.remark || '-'}</p>
                        
                        <div className="border-t border-white/20 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">工单编号</span>
                            <span className="text-sm font-mono font-medium">{detailData?.order_no || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">模具编号</span>
                            <span className="text-sm font-mono font-medium">{detailData?.mold_code || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">归位类型</span>
                            <span className="text-sm font-medium">{detailData?.location_type || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">库位/机台</span>
                            <span className="text-sm font-mono font-medium">{detailData?.location || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">完成时间</span>
                            <span className="text-sm font-medium">{detailData?.complete_time || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">保养结论</span>
                            <span className={`text-sm font-bold ${detailData?.maintenance_result === 'OK' ? 'text-green-300' : detailData?.maintenance_result === 'NG' ? 'text-red-300' : 'text-yellow-300'}`}>
                              {detailData?.maintenance_result || 'WAIT'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase">验收状态</span>
                            <span className={`text-sm font-bold ${detailData?.buyoff_status === 'PASSED' ? 'text-green-300' : detailData?.buyoff_status === 'FAILED' ? 'text-red-300' : 'text-gray-300'}`}>
                              {detailData?.buyoff_status || 'NONE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRecords;