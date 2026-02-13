
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Mold, MoldStatus, BuyoffStatus, MoldComponent } from '../../types';

interface MoldManagementProps {
  department?: '大材料' | '小材料';
  isAuditMode?: boolean;
}

const MoldManagement: React.FC<MoldManagementProps> = ({ department, isAuditMode }) => {
  const [molds, setMolds] = useState<Mold[]>(
    department 
      ? MOCK_MOLDS.filter(m => m.department === department)
      : MOCK_MOLDS
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | 'VIEW'>('ADD');
  const [currentMold, setCurrentMold] = useState<Partial<Mold>>({});

  const handleSave = () => {
    if (modalMode === 'ADD') {
      const newMold: Mold = {
        id: currentMold.id || `TY${Date.now().toString().slice(-3)}`,
        name: currentMold.name || '新模具',
        type: currentMold.type || '注塑模',
        vendor: currentMold.vendor || 'TOWA',
        shotTotal: Number(currentMold.shotTotal) || 0,
        lifeLimit: Number(currentMold.lifeLimit) || 100000,
        status: MoldStatus.Idle,
        location: currentMold.location || '待定',
        buyoffStatus: BuyoffStatus.NotInitiated,
        serialNumber: currentMold.serialNumber || '-',
        orderNumber: currentMold.orderNumber || '-',
        cabNo: currentMold.cabNo || '-',
        packageType: currentMold.packageType || 'BGA',
        packageSize: currentMold.packageSize || 'STANDARD',
        packageThickness: currentMold.packageThickness || '0',
        substrateThickness: currentMold.substrateThickness || '0',
        pinCode: currentMold.pinCode || 'A',
        components: currentMold.components || [],
        shortName: currentMold.shortName || '',
        thickness: currentMold.thickness || '',
        moldCategory: currentMold.moldCategory || '',
        productType: currentMold.productType || '',
        department: department || currentMold.department || '大材料',
      };
      setMolds([...molds, newMold]);
    } else if (modalMode === 'EDIT') {
      setMolds(molds.map(m => m.id === currentMold.id ? { ...m, ...currentMold } as Mold : m));
    }
    setIsModalOpen(false);
    setCurrentMold({});
  };

  const handleDeactivate = (id: string) => {
    if (confirm('确定要停用该模具吗？停用后将无法在生产看板中查看。')) {
      setMolds(molds.map(m => m.id === id ? { ...m, status: MoldStatus.Deactivated } : m));
    }
  };

  const renderComponentTable = (components: MoldComponent[]) => {
    const groups = {
      '上模件': components.filter(c => c.category === '上模件'),
      '下模件': components.filter(c => c.category === '下模件'),
      'Transfer件': components.filter(c => c.category === 'Transfer件'),
    };

    return (
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{groupName}</h4>
            </div>
            <table className="w-full text-left text-[11px]">
              <thead className="text-slate-400 bg-white border-b border-slate-50">
                <tr>
                  <th className="px-3 py-2 font-bold">组件名称</th>
                  <th className="px-3 py-2 font-bold">S/N</th>
                  <th className="px-3 py-2 font-bold text-center">备件</th>
                  <th className="px-3 py-2 font-bold">寿命上限</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-700">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{item.sn}</td>
                    <td className="px-3 py-2 text-center text-slate-400">
                      {item.isSpare ? <i className="fas fa-check text-green-500"></i> : '-'}
                    </td>
                    <td className="px-3 py-2 font-bold text-indigo-600">{item.lifeLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

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
              <th className="px-4 py-4 font-bold">所在设备</th>
              {!isAuditMode && <th className="px-4 py-4 font-bold text-center">状态是否有效</th>}
              <th className="px-4 py-4 font-bold">状态</th>
              <th className="px-4 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {molds.map(mold => (
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
                    <button onClick={() => { setModalMode('EDIT'); setCurrentMold(mold); setIsModalOpen(true); }} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors" title="查看 BOM 详情">
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
