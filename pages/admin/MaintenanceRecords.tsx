import React, { useState, useEffect, useRef } from 'react';
import { fetchMaintenanceRecords, fetchMaintenanceDetail, MaintenanceRecordItem, MaintenanceDetailResponse } from '../../services/maintenanceRecordsService';

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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3">
                   <h3 className="font-black text-xl tracking-tight uppercase">模具保养执行鉴定书</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">工单编号: {selectedRecord.order_no} | 模具: {selectedRecord.mold_code}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-8">
                  <section>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <i className="fas fa-info-circle text-indigo-500"></i>
                      Step 1: 保养背景与需求说明
                    </h4>
                    <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-xl">
                      <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                        "{detailData?.remark || '现场未记录文字描述'}"
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <i className="fas fa-tasks text-indigo-500"></i>
                      Step 2: 保养执行项目鉴定
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {detailData?.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <i className="fas fa-check-circle text-green-500"></i>
                          <span className="text-xs font-bold text-slate-700">{option}</span>
                        </div>
                      ))}
                      {(!detailData?.options || detailData.options.length === 0) && (
                        <div className="col-span-2 text-center text-slate-400 italic py-4">暂无保养项目信息</div>
                      )}
                    </div>
                  </section>

                  <section className="bg-slate-900 rounded-[2rem] p-8 text-white">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Step 3: 保养质量鉴定结论</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">保养结论 Maintenance Result</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-black ${(detailData?.maintenance_result || selectedRecord.maintenance_result) === 'OK' ? 'text-green-400' : (detailData?.maintenance_result || selectedRecord.maintenance_result) === 'NG' ? 'text-red-400' : 'text-slate-400'}`}>
                            {detailData?.maintenance_result || selectedRecord.maintenance_result || 'PENDING'}
                          </span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-bold">最终鉴定</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">验收状态 Buyoff Status</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-black ${(detailData?.buyoff_status || selectedRecord.buyoff_status) === 'PASSED' ? 'text-green-400' : (detailData?.buyoff_status || selectedRecord.buyoff_status) === 'FAILED' ? 'text-red-400' : 'text-slate-400'}`}>
                            {detailData?.buyoff_status || selectedRecord.buyoff_status || 'NONE'}
                          </span>
                          <i className={`fas ${(detailData?.buyoff_status || selectedRecord.buyoff_status) === 'PASSED' ? 'fa-check-double text-green-400' : (detailData?.buyoff_status || selectedRecord.buyoff_status) === 'FAILED' ? 'fa-times-circle text-red-400' : 'fa-clock text-slate-400'} text-xl`}></i>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="col-span-4 space-y-8">
                  <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-location-dot"></i>
                      物理归位扫码识别
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">归位类型</span>
                        <span className="text-sm font-black text-indigo-900">{detailData?.location_type || selectedRecord.location || '-'}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-indigo-200 pb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">库位/机台</span>
                        <span className="text-sm font-mono font-black text-indigo-900">{detailData?.location || selectedRecord.location || '-'}</span>
                      </div>
                      <div className="pt-2">
                         <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase ${detailData?.location_binding_success ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'}`}>
                           {detailData?.location_binding_success ? 'Location Binding Success' : 'Location Binding Pending'}
                         </span>
                      </div>
                    </div>
                  </section>

                  <section className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      {selectedRecord.executor_name ? selectedRecord.executor_name.slice(0, 1) : '-'}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">主责人员</p>
                      <p className="text-sm font-black text-slate-800">{selectedRecord.executor_name || '-'}</p>
                      <p className="text-[10px] text-slate-400">完成于: {selectedRecord.complete_time || '-'}</p>
                    </div>
                  </section>

                  {detailData?.acceptor_name && (
                    <section className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-sm">
                        {detailData.acceptor_name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">验收人员</p>
                        <p className="text-sm font-black text-slate-800">{detailData.acceptor_name}</p>
                        <p className="text-[10px] text-slate-400">验收于: {detailData.acceptor_time || '-'}</p>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRecords;