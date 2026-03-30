
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Mold, MoldStatus, BuyoffStatus, MoldComponent } from '../../types';
import { fetchMoldList, MoldListItem, fetchMoldDetail, MoldDetailItem, saveMold, fetchInternalComponents, InternalComponentItem } from '../../services/moldmanageService';

/**
 * 将 API 内部组件映射为前端 MoldComponent 类型
 */
function mapApiComponentToFrontend(apiComp: InternalComponentItem): MoldComponent {
  const categoryMap: Record<string, '上模件' | '下模件' | 'Transfer件'> = {
    'UPPER': '上模件',
    'LOWER': '下模件',
    'TRANSFER': 'Transfer件'
  };

  return {
    category: categoryMap[apiComp.category] || '上模件',
    name: apiComp.name,
    isSpare: apiComp.is_spare === 'Y',
    sn: apiComp.sn,
    lifeLimit: apiComp.life_limit
  };
}

/**
 * 将 API 模具数据映射为前端 Mold 类型
 */
function mapApiMoldToFrontend(apiMold: MoldListItem): Mold {
  // 状态映射：API 状态 -> 前端 MoldStatus
  const statusMap: Record<string, MoldStatus> = {
    'IDLE': MoldStatus.Idle,
    'IN_USE': MoldStatus.InUse,
    'MAINTENANCE': MoldStatus.Maintenance,
    'DEACTIVATED': MoldStatus.Deactivated
  };
  return {
    id: apiMold.mold_code,           // mold.id -> mold_code
    moldId: apiMold.mold_id,         // API 原始 mold_id
    name: apiMold.name || apiMold.full_name || apiMold.short_name,
    fullName: apiMold.full_name,
    type: apiMold.mold_category || '注塑模',
    vendor: 'TOWA',                  // API 暂无此字段，使用默认值
    shotTotal: apiMold.current_shots, // mold.shotTotal -> current_shots
    lifeLimit: apiMold.max_shots,    // mold.lifeLimit -> max_shots
    status: statusMap[apiMold.status] || MoldStatus.Idle,
    location: apiMold.location,
    machineId: apiMold.current_machine && apiMold.current_machine !== '离线/库房' 
      ? apiMold.current_machine 
      : undefined,
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: apiMold.mold_code,
    orderNumber: '-',
    cabNo: '-',
    packageType: apiMold.package_type,  // mold.packageType -> package_type
    packageSize: apiMold.package_size,  // mold.packageSize -> package_size
    packageThickness: '0',
    substrateThickness: '0',
    pinCode: '-',
    components: [],
    shortName: apiMold.short_name,      // mold.shortName -> short_name
    thickness: apiMold.thickness,       // mold.thickness -> thickness
    moldCategory: apiMold.mold_category, // mold.moldCategory -> mold_category
    productType: apiMold.product_type,   // mold.productType -> product_type
    department: apiMold.department === '大材料' ? '大材料' : '小材料',
    maintenanceCycle: apiMold.maintenance_cycle,  // mold.maintenanceCycle -> maintenance_cycle
    maintenanceStartTime: apiMold.start_time       // mold.maintenanceStartTime -> start_time
  };
}

/**
 * 将 API 模具详情映射为表单数据
 */
function mapApiMoldDetailToForm(apiMold: MoldDetailItem): Partial<Mold> {
  return {
    id: apiMold.mold_code,              // 模具编号 -> mold_code
    name: apiMold.name,                 // 模具名称 -> name
    fullName: apiMold.full_name,         // 模具完整名称 -> full_name
    location: apiMold.location,          // 存放位置 -> location
    shortName: apiMold.short_name,      // 模具简名 -> short_name
    thickness: apiMold.thickness,       // 模具厚度 -> thickness
    moldCategory: apiMold.mold_category, // 模具分类 -> mold_category
    productType: apiMold.product_type,   // 产品类型 -> product_type
    packageType: apiMold.package_type,   // 封装规格 -> package_type
    pinCode: apiMold.pin_code,           // PIN CODE -> pin_code
    maintenanceCycle: apiMold.maintenance_cycle,  // 保养周期 -> maintenance_cycle
    maintenanceStartTime: apiMold.start_time      // 开始保养时间 -> start_time
  };
}

interface MoldManagementProps {
  department?: '大材料' | '小材料';
  isAuditMode?: boolean;
}

const ITEMS_PER_PAGE = 20;

const MoldManagement: React.FC<MoldManagementProps> = ({ department, isAuditMode }) => {
  console.log("department:",department);
  console.log("isAuditMode:",isAuditMode);
  const [molds, setMolds] = useState<Mold[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | 'VIEW'>('ADD');
  const [currentMold, setCurrentMold] = useState<Partial<Mold>>({});
  const [currentMoldDetail, setCurrentMoldDetail] = useState<MoldDetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const isLoadingRef = useRef(false);

  // 从 API 获取模具列表
  const loadMolds = async (page: number = 1) => {
    // 防止重复请求
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setLoading(true);
    setError(null);
    try {
      // 根据 department 确定接口参数值
      const departmentParam = department || 'ALL';

      const response = await fetchMoldList({
        department: departmentParam,
        page: page,
        page_size: ITEMS_PER_PAGE
      });
      console.log("response:",response);

      if (response.code === 200 && response.data) {
        const mappedMolds = response.data.list.map(mapApiMoldToFrontend);
        console.log("mappedMolds:",mappedMolds);
        setMolds(mappedMolds);
        setTotalRecords(response.data.total);
      } else {
        setError(response.message || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      // 如果 API 失败，使用 mock 数据作为 fallback
      const fallbackMolds = department
        ? MOCK_MOLDS.filter(m => m.department === department)
        : MOCK_MOLDS;
      setMolds(fallbackMolds);
      setTotalRecords(fallbackMolds.length);
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
      loadMolds(currentPage);
    }
  }, []);

  // 当页码或部门变化时重新加载
  useEffect(() => {
    if (!isFirstRender.current) {
      loadMolds(currentPage);
    }
  }, [currentPage, department]);

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  const paginatedMolds = molds;

  const handleSave = async () => {
    try {
      // 准备保存参数
      const saveParams = {
        department: department || '大材料',         // 所属部门
        mold_id: modalMode === 'EDIT' ? currentMoldDetail?.mold_id : undefined,
        mold_code: currentMold.id || '',           // 模具编号
        name: currentMold.name || '',              // 模具名称
        full_name: currentMold.fullName || '',      // 模具完整名称
        short_name: currentMold.shortName || '',   // 模具简名
        thickness: currentMold.thickness || '',    // 模具厚度
        mold_category: currentMold.moldCategory || '',  // 模具分类
        product_type: currentMold.productType || '',     // 产品类型
        package_type: currentMold.packageType || '',     // 封装规格
        package_size: modalMode === 'EDIT' ? currentMoldDetail?.package_size : undefined,  // 编辑时使用详情中的 package_size
        pin_code: currentMold.pinCode || '',       // PIN CODE
        life_limit: modalMode === 'EDIT' ? currentMoldDetail?.life_limit : undefined,      // 编辑时使用详情中的 life_limit
        maintenance_cycle: currentMold.maintenanceCycle || '',  // 保养周期
        start_time: currentMold.maintenanceStartTime || '',     // 开始保养时间
        location: currentMold.location || ''                    // 存放位置
      };

      console.log('保存模具参数:', saveParams);

      const response = await saveMold(saveParams);
      console.log('保存模具响应:', response);

      if (response.code === 200 && response.data?.success) {
        // 保存成功，刷新列表
        alert(response.data.message || '保存成功');
        loadMolds(currentPage);
      } else {
        alert(response.message || '保存失败');
      }
    } catch (err) {
      console.error('保存模具失败:', err);
      alert(err instanceof Error ? err.message : '保存失败');
    }

    setIsModalOpen(false);
    setCurrentMold({});
    setCurrentMoldDetail(null);
  };

  const handleDeactivate = (id: string) => {
    if (confirm('确定要停用该模具吗？停用后将无法在生产看板中查看。')) {
      setMolds(molds.map(m => m.id === id ? { ...m, status: MoldStatus.Deactivated } : m));
    }
  };

  // 查看 BOM 详情
  const handleViewBOM = async (mold: Mold) => {
    if (!mold.moldId) {
      console.error('模具 ID 不存在');
      return;
    }

    setModalMode('EDIT');
    setIsModalOpen(true);
    setCurrentMoldDetail(null);

    try {
      const response = await fetchMoldDetail(mold.moldId);
      console.log('模具详情:', response);

      if (response.code === 200 && response.data) {
        // 保存详情数据，用于后续保存操作
        setCurrentMoldDetail(response.data);
        // 将详情数据映射到表单
        const formData = mapApiMoldDetailToForm(response.data);
        
        // 获取内部组件数据
        try {
          const compResponse = await fetchInternalComponents(String(mold.moldId));
          if (compResponse.code === 200 && compResponse.data) {
            const allComponents: MoldComponent[] = [
              ...(compResponse.data.upper || []).map(mapApiComponentToFrontend),
              ...(compResponse.data.lower || []).map(mapApiComponentToFrontend),
              ...(compResponse.data.transfer || []).map(mapApiComponentToFrontend)
            ];
            formData.components = allComponents;
          }
        } catch (compErr) {
          console.error('获取内部组件失败:', compErr);
        }

        setCurrentMold(formData);
      } else {
        console.error('获取模具详情失败:', response.message);
        // 如果接口失败，使用列表中的数据
        setCurrentMold(mold);
      }
    } catch (err) {
      console.error('获取模具详情失败:', err);
      // 如果接口失败，使用列表中的数据
      setCurrentMold(mold);
    }
  };

  const renderComponentTable = (components: MoldComponent[]) => {
    const groups = {
      '上模件': components.filter(c => c.category === '上模件'),
      '下模件': components.filter(c => c.category === '下模件'),
      'Transfer件': components.filter(c => c.category === 'Transfer件'),
    };

    // 如果没有任何数据，返回 null 让父组件显示“暂无数据”
    if (components.length === 0) return null;

    return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {Object.entries(groups).map(([groupName, items]) => (
          items.length > 0 && (
            <div key={groupName} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {groupName}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                  {items.length} 项
                </span>
              </div>
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-400 bg-white border-b border-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">组件名称</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">S/N</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">备件</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">寿命上限</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{item.sn}</td>
                      <td className="px-4 py-3 text-center">
                        {item.isSpare ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                            <i className="fas fa-check"></i> YES
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-black text-right">
                        <span className={`${item.lifeLimit === 'N/A' ? 'text-slate-400 font-medium' : 'text-indigo-600'}`}>
                          {item.lifeLimit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>
    );
  };
console.log("loading:",loading)
console.log("molds:",molds)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isAuditMode ? '模具 Audit 清单' : `模具档案与 BOM 管理 ${department ? `(${department})` : ''}`}
        </h2>
        {!isAuditMode && (
          <div className="flex gap-2">
            <button onClick={() => { setModalMode('ADD'); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
              + 新增模具档案
            </button>
          </div>
        )}
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* 空数据提示 */}
      {!loading && !error && molds.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-center">
            <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">暂无模具数据</p>
          </div>
        </div>
      )}

      {!loading && molds.length > 0 && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1200px]">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-4 py-4 font-bold">模具编号/简名</th>
              <th className="px-4 py-4 font-bold">分类/产品类型</th>
              <th className="px-4 py-4 font-bold">位置</th>
              <th className="px-4 py-4 font-bold">厚度</th>
              <th className="px-4 py-4 font-bold">PACKAGE TYPE/SIZE</th>
              <th className="px-4 py-4 font-bold">实时 SHOT COUNT</th>
              <th className="px-4 py-4 font-bold">SHOT 上限</th>
              <th className="px-4 py-4 font-bold">保养周期</th>
              <th className="px-4 py-4 font-bold">开始时间</th>
              <th className="px-4 py-4 font-bold">所在设备</th>
              {!isAuditMode && <th className="px-4 py-4 font-bold text-center">状态是否有效</th>}
              <th className="px-4 py-4 font-bold">状态</th>
              <th className="px-4 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedMolds.map(mold => (
              <tr key={mold.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-slate-800">{mold.id}</p>
                  <p className="text-[10px] text-indigo-500 font-bold">{mold.shortName || '-'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-bold text-slate-700">{mold.moldCategory || '-'}</p>
                  <p className="text-[10px] text-slate-400">{mold.productType || '-'}</p>
                </td>
                <td className="px-4 py-4 text-xs font-medium text-slate-600">{mold.location}</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-700">{mold.thickness || '-'}</td>
                <td className="px-4 py-4 text-xs">
                  <span className="font-bold text-indigo-600">{mold.packageType}</span>
                  <span className="mx-1 text-slate-300">/</span>
                  <span className="text-slate-500">{mold.packageSize}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-slate-700">{mold.shotTotal.toLocaleString()}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-indigo-600">{mold.lifeLimit.toLocaleString()}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-medium text-slate-600">{mold.maintenanceCycle || '-'}</p>
                </td>
                <td className="px-4 py-4 text-xs font-medium text-slate-600">
                  {mold.maintenanceStartTime || '-'}
                </td>
                <td className="px-4 py-4">
                  {mold.machineId ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <i className="fas fa-microchip text-[10px] text-indigo-500"></i>
                        <span className="text-xs font-bold text-slate-800">{mold.machineId}</span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${
                        mold.status === MoldStatus.InUse ? 'text-green-600' :
                        mold.status === MoldStatus.Maintenance ? 'text-amber-600' :
                        mold.status === MoldStatus.Repair ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        <span className={`w-1 h-1 rounded-full animate-pulse ${
                          mold.status === MoldStatus.InUse ? 'bg-green-500' :
                          mold.status === MoldStatus.Maintenance ? 'bg-amber-500' :
                          mold.status === MoldStatus.Repair ? 'bg-red-500' : 'bg-slate-400'
                        }`}></span>
                        {STATUS_LABELS[mold.status]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">离线/库房</span>
                  )}
                </td>
                {!isAuditMode && (
                  <td className="px-4 py-4 text-center">
                    {mold.status === MoldStatus.Deactivated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <i className="fas fa-times-circle"></i> 已失效
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <i className="fas fa-check-circle"></i> 有效
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-4">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[mold.status]}`}>
                    {STATUS_LABELS[mold.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleViewBOM(mold)} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors" title="查看 BOM 详情">
                      <i className="fas fa-sitemap mr-1"></i> BOM
                    </button>
                    {mold.status !== MoldStatus.Deactivated && (
                      <button 
                        onClick={() => handleDeactivate(mold.id)} 
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="停用模具"
                      >
                        <i className="fas fa-ban mr-1"></i> 停用
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-left mr-1"></i> 上一页
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
            ))}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg">{modalMode === 'ADD' ? '新增模具档案' : '模具详细档案与内部组件 (BOM)'}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Mold Life Cycle & Spare Parts Structure</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 flex gap-8">
              {/* 左侧基本信息编辑 */}
              <div className="w-1/3 space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest border-b border-slate-200 pb-2">基本生产参数</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">模具编号 (MOLD ID)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={currentMold.id || ''} onChange={e => setCurrentMold({...currentMold, id: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">模具名称 (NAME)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={currentMold.name || ''} onChange={e => setCurrentMold({...currentMold, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">模具完整名称 (FULL NAME)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={currentMold.fullName || ''} onChange={e => setCurrentMold({...currentMold, fullName: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">存放位置 (LOCATION)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={currentMold.location || ''} onChange={e => setCurrentMold({...currentMold, location: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">模具简名 (SHORT NAME)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={currentMold.shortName || ''} onChange={e => setCurrentMold({...currentMold, shortName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">模具厚度 (THICKNESS)</label>
                        <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.thickness || ''} onChange={e => setCurrentMold({...currentMold, thickness: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">模具分类</label>
                        <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.moldCategory || ''} onChange={e => setCurrentMold({...currentMold, moldCategory: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">产品类型 (PROD TYPE)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.productType || ''} onChange={e => setCurrentMold({...currentMold, productType: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">封装规格 (PKG TYPE)</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.packageType || ''} onChange={e => setCurrentMold({...currentMold, packageType: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase">PIN CODE</label>
                      <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold" value={currentMold.pinCode || ''} onChange={e => setCurrentMold({...currentMold, pinCode: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">保养周期 (MAINT CYCLE)</label>
                        <input type="text" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.maintenanceCycle || ''} placeholder="如: 30天/50K" onChange={e => setCurrentMold({...currentMold, maintenanceCycle: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">开始保养时间 (START TIME)</label>
                        <input type="date" className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={currentMold.maintenanceStartTime || ''} onChange={e => setCurrentMold({...currentMold, maintenanceStartTime: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧 BOM 结构查看 */}
              <div className="flex-1 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-layer-group text-indigo-500"></i>
                   内部配件清单及寿命监控
                 </h4>
                 {currentMold.components && currentMold.components.length > 0 ? (
                   renderComponentTable(currentMold.components)
                 ) : (
                   <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                      <i className="fas fa-box-open text-4xl mb-4 block opacity-20"></i>
                      暂无配件结构数据，请从主数据表导入
                   </div>
                 )}
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">取消</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-100 active:scale-95 transition-all">保存变更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoldManagement;
