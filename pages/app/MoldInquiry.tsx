
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Mold, MoldComponent } from '../../types';

interface MoldInquiryProps {
  onBack: () => void;
}

const MoldInquiry: React.FC<MoldInquiryProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBOMId, setActiveBOMId] = useState<string | null>(null);
  // 待停用模具现场扫码确认
  const [activeDeactivateId, setActiveDeactivateId] = useState<string | null>(null);
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanVerified, setScanVerified] = useState(false);
  const [deactivatedIds, setDeactivatedIds] = useState<string[]>([]);
  const [completedId, setCompletedId] = useState<string | null>(null);
  
  const filteredMolds = MOCK_MOLDS.filter(m => 
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBOMMold = MOCK_MOLDS.find(m => m.id === activeBOMId);
  const activeDeactivateMold = MOCK_MOLDS.find(m => m.id === activeDeactivateId);

  // 是否为待停用模具（已完成停用的不再提示）
  const isPendingDeactivate = (mold: Mold) => !!mold.pendingDeactivate && !deactivatedIds.includes(mold.id);

  const openDeactivate = (moldId: string) => {
    setActiveDeactivateId(moldId);
    setScanValue('');
    setScanError('');
    setScanVerified(false);
    setCompletedId(null);
  };

  const closeDeactivate = () => {
    setActiveDeactivateId(null);
    setScanValue('');
    setScanError('');
    setScanVerified(false);
    setCompletedId(null);
  };

  // 扫描模具号，校验是否为待停用的那套模具
  const handleScanDeactivate = (value: string) => {
    if (!activeDeactivateMold) return;
    const code = value.trim().toUpperCase();
    if (!code) return;
    setScanValue(code);
    if (code !== activeDeactivateMold.id.toUpperCase()) {
      setScanVerified(false);
      setScanError('扫描的模具编号与待停用模具不一致，请核对后重新扫描');
      return;
    }
    setScanError('');
    setScanVerified(true);
  };

  const handleConfirmDeactivate = () => {
    if (!activeDeactivateMold || !scanVerified) return;
    setDeactivatedIds(prev => [...prev, activeDeactivateMold.id]);
    setCompletedId(activeDeactivateMold.id);
    setScanValue('');
    setScanVerified(false);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-full relative">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <i className="fas fa-chevron-left text-slate-600"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight italic">模具基本信息查询</h2>
      </div>

      <div className="relative mb-6">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text"
          placeholder="搜索模具 ID (如 TY101)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="space-y-6 pb-24">
        {filteredMolds.map(mold => (
          <div key={mold.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter">{mold.id}</h3>
                  <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">{mold.vendor}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-blue-500"></i>
                  {mold.location} · {mold.serialNumber}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${
                  deactivatedIds.includes(mold.id) ? STATUS_COLORS.DEACTIVATED : STATUS_COLORS[mold.status]
                }`}>
                  {deactivatedIds.includes(mold.id) ? STATUS_LABELS.DEACTIVATED : STATUS_LABELS[mold.status]}
                </span>
                {isPendingDeactivate(mold) && (
                  <span className="text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                    待停用
                  </span>
                )}
              </div>
            </div>
            
            {/* 核心技术参数 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Package Type / Pin</p>
                <div className="flex items-end gap-2">
                  <p className="text-sm font-black text-slate-800">{mold.packageType}</p>
                  <p className="text-lg font-black text-blue-600 leading-none">{mold.pinCode}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">实时 SHOT / 寿命</p>
                <div className="flex items-end gap-1">
                  <p className="text-lg font-black text-red-600 leading-none">{(mold.shotTotal / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">/ {mold.lifeLimit / 1000}K</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isPendingDeactivate(mold) && (
                <button 
                  onClick={() => openDeactivate(mold.id)}
                  className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200"
                >
                  停用操作
                </button>
              )}
              <button 
                onClick={() => setActiveBOMId(mold.id)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
              >
                模具详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- 待停用：现场扫码确认 --- */}
      {activeDeactivateMold && (
        <div className="absolute inset-0 z-[60] bg-slate-900 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shrink-0">
            <button onClick={closeDeactivate} className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="text-center">
              <h3 className="text-white font-black text-lg tracking-tight uppercase">模具停用确认</h3>
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{activeDeactivateMold.id}</p>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
            {completedId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/40">
                  <i className="fas fa-check text-3xl text-white"></i>
                </div>
                <h3 className="text-white font-black text-lg tracking-tight mb-2">停用确认完成</h3>
                <p className="text-slate-400 text-xs mb-1">模具 {completedId} 现场核对一致，已完成停用</p>
                <button
                  onClick={closeDeactivate}
                  className="mt-8 bg-slate-800 text-white font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  返回列表
                </button>
              </div>
            ) : (
              <>
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">停用前核对</p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    请扫描模具上的二维码，系统会校验是否为待停用的这套模具，核对一致后方可执行停用。
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-600/40">
                    <i className="fas fa-qrcode text-2xl text-white"></i>
                  </div>
                  <h4 className="text-white font-black text-base tracking-tight mb-1">扫描模具二维码</h4>
                  <p className="text-slate-400 text-xs">请对准模具 {activeDeactivateMold.id} 的标识码进行扫描</p>
                  <input
                    type="text"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanDeactivate((e.target as HTMLInputElement).value)}
                    placeholder={`请扫描模具 ${activeDeactivateMold.id}`}
                    className="mt-6 w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 focus:ring-red-500 transition-all text-red-400"
                  />
                  {scanError && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-xs font-bold">{scanError}</p>
                    </div>
                  )}
                </div>

                {scanVerified && (
                  <div className="bg-white rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <p className="text-sm font-black text-slate-800">模具编号核对一致</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具编号</p>
                        <p className="text-sm font-black text-slate-800">{activeDeactivateMold.id}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">存放位置</p>
                        <p className="text-sm font-black text-slate-800">{activeDeactivateMold.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirmDeactivate}
                      className="w-full bg-red-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200"
                    >
                      确认停用
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleScanDeactivate(activeDeactivateMold.id)}
                  className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  模拟扫码 {activeDeactivateMold.id}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- 全量 BOM 全屏详情 --- */}
      {activeBOMId && selectedBOMMold && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-white shrink-0 shadow-sm">
             <button onClick={() => setActiveBOMId(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-down"></i>
            </button>
            <div className="text-center">
              <h3 className="text-slate-900 font-black text-lg tracking-tight uppercase">模具详情信息</h3>
              <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">{selectedBOMMold.id} · {selectedBOMMold.name}</p>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 pb-32">
            {/* 模具详细信息卡片 */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                基本生产参数
              </h4>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具名称 (NAME)</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具完整名称 (FULL NAME)</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.fullName || selectedBOMMold.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">具体存放位置 (LOCATION)</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.location}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">供应商 (VENDOR)</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.vendor}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Package Type</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.packageType}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Pin Code</p>
                    <p className="text-sm font-black text-slate-800">{selectedBOMMold.pinCode}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">序列号 (S/N)</p>
                    <p className="text-sm font-black text-slate-800 font-mono">{selectedBOMMold.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">当前状态 (STATUS)</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${STATUS_COLORS[selectedBOMMold.status]}`}>
                      {STATUS_LABELS[selectedBOMMold.status]}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">当前 SHOT 总数</p>
                    <p className="text-lg font-black text-red-600">{(selectedBOMMold.shotTotal / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具寿命上限</p>
                    <p className="text-lg font-black text-slate-800">{(selectedBOMMold.lifeLimit / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">
                内部配件清单 (BOM)
              </h4>
              <div className="space-y-8">
                {['上模件', '下模件', 'Transfer件'].map(category => {
              const comps = selectedBOMMold.components.filter(c => c.category === category);
              if (comps.length === 0) return null;
              return (
                <div key={category} className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    {category} ({comps.length})
                  </h5>
                  <div className="space-y-3">
                    {comps.map((comp, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            comp.isSpare ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <i className={`fas ${comp.isSpare ? 'fa-puzzle-piece' : 'fa-box-open'}`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{comp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">SN: {comp.sn}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-xs font-black text-indigo-600 tracking-tighter">{comp.lifeLimit}</p>
                          {comp.isSpare && (
                            <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                              SPARE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 text-white shadow-2xl rounded-t-[2.5rem] border-t border-slate-800">
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic underline underline-offset-4 decoration-indigo-500">BOM 健康综合判定</span>
               <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Valid Integrity</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 w-[92%]"></div>
               </div>
               <span className="text-xs font-black tracking-tighter">92%</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoldInquiry;
