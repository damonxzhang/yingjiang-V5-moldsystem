
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Mold, MoldComponent } from '../../types';

// 卡片现场操作类型：停用 / 入库 / 出库（入库、出库需两步扫码）；报废走详情页独立流程（扫码提交申请 → 领导审批 → 再次扫码填写报废信息）
type MoldOp = 'deactivate' | 'inbound' | 'outbound' | 'scrap';

const OP_META: Record<MoldOp, {
  title: string;
  subText: string;
  bannerLabel: string;
  bannerDesc: string;
  bannerBox: string;
  bannerLabelClass: string;
  bannerDescClass: string;
  qrBox: string;
  ring: string;
  confirmBtn: string;
  confirmText: string;
  doneTitle: string;
  doneDesc: (id: string) => string;
}> = {
  deactivate: {
    title: '模具停用确认',
    subText: 'text-red-600',
    bannerLabel: '停用前核对',
    bannerDesc: '请扫描模具上的二维码，系统会校验是否为待停用的这套模具，核对一致后方可执行停用。',
    bannerBox: 'bg-red-500/10 border border-red-500/30 rounded-2xl p-4',
    bannerLabelClass: 'text-red-600 text-[10px] font-black uppercase tracking-widest mb-1',
    bannerDescClass: 'text-slate-600 text-xs leading-relaxed',
    qrBox: 'bg-red-600 shadow-lg shadow-red-600/40',
    ring: 'focus:ring-red-500',
    confirmBtn: 'bg-red-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200',
    confirmText: '确认停用',
    doneTitle: '停用确认完成',
    doneDesc: (id) => `模具 ${id} 现场核对一致，已完成停用`,
  },
  scrap: {
    title: '模具报废流程',
    subText: 'text-red-600',
    bannerLabel: '报废前核对',
    bannerDesc: '请扫描模具上的二维码，核对一致后提交报废申请。申请提交后将向部门领导发送报废审批信件，审批通过后方可填写报废信息。',
    bannerBox: 'bg-red-500/10 border border-red-500/30 rounded-2xl p-4',
    bannerLabelClass: 'text-red-600 text-[10px] font-black uppercase tracking-widest mb-1',
    bannerDescClass: 'text-slate-600 text-xs leading-relaxed',
    qrBox: 'bg-red-600 shadow-lg shadow-red-600/40',
    ring: 'focus:ring-red-500',
    confirmBtn: 'bg-red-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200',
    confirmText: '提交报废申请',
    doneTitle: '报废提交成功',
    doneDesc: (id) => `模具 ${id} 的报废信息已提交`,
  },
  inbound: {
    title: '模具入库确认',
    subText: 'text-emerald-600',
    bannerLabel: '入库前核对',
    bannerDesc: '入库需完成两步扫描：先扫描模具二维码核对模具，再扫描要入库的模具柜位置码，两步完成后点击“提交确认”完成入库。',
    bannerBox: 'bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4',
    bannerLabelClass: 'text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1',
    bannerDescClass: 'text-slate-600 text-xs leading-relaxed',
    qrBox: 'bg-emerald-600 shadow-lg shadow-emerald-600/40',
    ring: 'focus:ring-emerald-500',
    confirmBtn: 'bg-emerald-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-200',
    confirmText: '确认入库',
    doneTitle: '入库完成',
    doneDesc: (id) => `模具 ${id} 现场核对一致，已完成入库`,
  },
  outbound: {
    title: '模具出库确认',
    subText: 'text-blue-600',
    bannerLabel: '出库前核对',
    bannerDesc: '出库需完成两步扫描：先扫描模具二维码核对模具，再扫描该模具当前存放的模具柜位置码，两步完成后点击“提交确认”完成出库。',
    bannerBox: 'bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4',
    bannerLabelClass: 'text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1',
    bannerDescClass: 'text-slate-600 text-xs leading-relaxed',
    qrBox: 'bg-blue-600 shadow-lg shadow-blue-600/40',
    ring: 'focus:ring-blue-500',
    confirmBtn: 'bg-blue-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-200',
    confirmText: '确认出库',
    doneTitle: '出库完成',
    doneDesc: (id) => `模具 ${id} 现场核对一致，已完成出库`,
  },
};

interface MoldInquiryProps {
  onBack: () => void;
}

const MoldInquiry: React.FC<MoldInquiryProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBOMId, setActiveBOMId] = useState<string | null>(null);
  // 现场扫码确认操作（停用 / 入库 / 出库）
  const [activeOp, setActiveOp] = useState<{ type: MoldOp; moldId: string } | null>(null);
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanVerified, setScanVerified] = useState(false);
  const [deactivatedIds, setDeactivatedIds] = useState<string[]>([]);
  const [completedId, setCompletedId] = useState<string | null>(null);
  // 入库/出库两步扫码：第1步扫模具 → 第2步扫柜位 → 提交确认
  const [opCabinet, setOpCabinet] = useState('');
  const [opSubmitted, setOpSubmitted] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);
  // 报废流程：扫码提交申请（发审批信件）→ 等待领导审批 → 审批通过后再次扫码填写报废信息
  const [scrapStage, setScrapStage] = useState<'scan' | 'waiting' | 'info'>('scan');
  const [scrapPendingIds, setScrapPendingIds] = useState<string[]>([]);   // 已提交申请、等待审批
  const [scrapApprovedIds, setScrapApprovedIds] = useState<string[]>([]); // 领导已审批，待提交报废信息
  const [scrapReason, setScrapReason] = useState('');
  const [scrapExpectedDate, setScrapExpectedDate] = useState('');
  const [scrapNote, setScrapNote] = useState('');
  
  const filteredMolds = MOCK_MOLDS.filter(m => 
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBOMMold = MOCK_MOLDS.find(m => m.id === activeBOMId);
  const activeOpMold = activeOp ? MOCK_MOLDS.find(m => m.id === activeOp.moldId) : undefined;
  const opMeta = activeOp ? OP_META[activeOp.type] : null;
  const isOutbound = activeOp?.type === 'outbound';

  // 是否为待停用模具（已完成停用的不再提示）
  const isPendingDeactivate = (mold: Mold) => !!mold.pendingDeactivate && !deactivatedIds.includes(mold.id);

  const openOp = (type: MoldOp, moldId: string) => {
    setActiveOp({ type, moldId });
    setScanValue('');
    setScanError('');
    setScanVerified(false);
    setCompletedId(null);
    setOpCabinet('');
    setOpSubmitted(false);
    setScrapReason('');
    setScrapExpectedDate('');
    setScrapNote('');
    // 报废：按当前审批状态决定进入哪个阶段（等待审批 / 直接填写报废信息）
    if (type === 'scrap') {
      setScrapStage(scrapApprovedIds.includes(moldId) ? 'info' : scrapPendingIds.includes(moldId) ? 'waiting' : 'scan');
    }
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  const closeOp = () => {
    setActiveOp(null);
    setScanValue('');
    setScanError('');
    setScanVerified(false);
    setCompletedId(null);
    setOpCabinet('');
    setOpSubmitted(false);
    setScrapStage('scan');
    setScrapReason('');
    setScrapExpectedDate('');
    setScrapNote('');
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  // 扫描模具号，校验是否为当前操作的那套模具
  const handleScanOp = (value: string) => {
    if (!activeOpMold) return;
    const code = value.trim().toUpperCase();
    if (!code) return;
    setScanValue(code);
    if (code !== activeOpMold.id.toUpperCase()) {
      setScanVerified(false);
      setScanError('扫描的模具编号与当前操作模具不一致，请核对后重新扫描');
      return;
    }
    setScanError('');
    setScanVerified(true);
  };

  const handleConfirmOp = () => {
    if (!activeOpMold || !activeOp || !scanVerified) return;
    if (activeOp.type === 'deactivate') {
      setDeactivatedIds(prev => [...prev, activeOpMold.id]);
    }
    setCompletedId(activeOpMold.id);
    setScanValue('');
    setScanVerified(false);
  };

  // 第 2 步扫描柜位码
  const handleScanCabinet = (value: string) => {
    const code = value.trim().toUpperCase();
    if (!code) return;
    setOpCabinet(code);
  };

  // 入库/出库：两步都完成后提交确认，提示成功并跳回 APP 首页
  const handleSubmitOp = () => {
    if (!activeOpMold || !scanVerified || !opCabinet) return;
    setOpSubmitted(true);
    redirectTimerRef.current = window.setTimeout(() => onBack(), 1800);
  };

  // 报废：扫码核对并填写报废描述、预计报废时间后提交申请（模拟发送审批邮件给领导）
  const handleScrapApply = () => {
    if (!activeOpMold || !scanVerified || !scrapReason.trim() || !scrapExpectedDate) return;
    setScrapPendingIds(prev => [...prev, activeOpMold.id]);
    setScrapStage('waiting');
  };

  // 报废：领导审批通过（演示入口），等待页自动跳转到报废信息确认
  const handleSimulateApprove = () => {
    if (!activeOpMold) return;
    setScrapPendingIds(prev => prev.filter(x => x !== activeOpMold.id));
    setScrapApprovedIds(prev => [...prev, activeOpMold.id]);
    setScanValue('');
    setScanError('');
    setScanVerified(false);
    setScrapStage('info');
  };

  // 报废：领导驳回（演示入口），回到扫码页重新提交
  const handleScrapReject = () => {
    if (!activeOpMold) return;
    setScrapPendingIds(prev => prev.filter(x => x !== activeOpMold.id));
    setScanValue('');
    setScanError('报废申请已被驳回，请核对信息后重新提交');
    setScanVerified(false);
    setScrapStage('scan');
  };

  // 报废：再次扫码后提交报废信息，成功后跳回 APP 首页
  const handleScrapInfoSubmit = () => {
    if (!activeOpMold || !scanVerified || !scrapReason.trim()) return;
    setCompletedId(activeOpMold.id);
    redirectTimerRef.current = window.setTimeout(() => onBack(), 1800);
  };

  // 组件卸载时清理跳转定时器
  useEffect(() => () => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
    }
  }, []);

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
                  onClick={() => openOp('deactivate', mold.id)}
                  className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-200"
                >
                  停用操作
                </button>
              )}
              <button 
                onClick={() => openOp('inbound', mold.id)}
                className="flex-1 bg-white border border-emerald-200 text-emerald-700 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
              >
                模具入库
              </button>
              <button 
                onClick={() => openOp('outbound', mold.id)}
                className="flex-1 bg-white border border-blue-200 text-blue-700 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
              >
                模具出库
              </button>
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

      {/* --- 现场扫码确认（停用 / 入库 / 出库 / 报废） --- */}
      {activeOp && activeOpMold && opMeta && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-white shadow-sm shrink-0">
            <button onClick={closeOp} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="text-center">
              <h3 className="text-slate-900 font-black text-lg tracking-tight uppercase">{opMeta.title}</h3>
              <p className={`${opMeta.subText} text-[10px] font-bold uppercase tracking-widest`}>{activeOpMold.id}</p>
            </div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {completedId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/40">
                  <i className="fas fa-check text-3xl text-white"></i>
                </div>
                <h3 className="text-slate-900 font-black text-lg tracking-tight mb-2">{opMeta.doneTitle}</h3>
                <p className="text-slate-500 text-xs mb-1">{opMeta.doneDesc(completedId)}</p>
                <button
                  onClick={activeOp.type === 'scrap' ? onBack : closeOp}
                  className="mt-8 bg-slate-800 text-white font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  {activeOp.type === 'scrap' ? '返回首页' : '返回列表'}
                </button>
              </div>
            ) : activeOp.type === 'scrap' ? (
              scrapStage === 'scan' ? (
                <>
                  <div className={opMeta.bannerBox}>
                    <p className={opMeta.bannerLabelClass}>{opMeta.bannerLabel}</p>
                    <p className={opMeta.bannerDescClass}>{opMeta.bannerDesc}</p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-center">
                    <div className={`w-16 h-16 ${opMeta.qrBox} rounded-full flex items-center justify-center mx-auto mb-5`}>
                      <i className="fas fa-qrcode text-2xl text-white"></i>
                    </div>
                    <h4 className="text-slate-900 font-black text-base tracking-tight mb-1">扫描模具二维码</h4>
                    <p className="text-slate-500 text-xs">请对准模具 {activeOpMold.id} 的标识码进行扫描</p>
                    <input
                      type="text"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScanOp((e.target as HTMLInputElement).value)}
                      placeholder={`请扫描模具 ${activeOpMold.id}`}
                      className={`mt-6 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 ${opMeta.ring} transition-all ${opMeta.subText}`}
                    />
                    {scanError && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                        <p className="text-red-600 text-xs font-bold">{scanError}</p>
                      </div>
                    )}
                  </div>

                  {scanVerified && (
                    <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <p className="text-sm font-black text-slate-800">模具编号核对一致</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">报废描述 *</label>
                        <textarea
                          rows={3}
                          value={scrapReason}
                          onChange={(e) => setScrapReason(e.target.value)}
                          placeholder="请填写模具报废的具体原因（如：寿命到期、型腔损伤、产品换代等）"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">预计报废时间 *</label>
                        <input
                          type="date"
                          value={scrapExpectedDate}
                          onChange={(e) => setScrapExpectedDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">备注（选填）</label>
                        <input
                          type="text"
                          value={scrapNote}
                          onChange={(e) => setScrapNote(e.target.value)}
                          placeholder="其他需要说明的信息"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                        />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">提交后将向部门领导推送报废审批邮件，审批通过后方可进行后续操作。</p>
                      <button
                        onClick={handleScrapApply}
                        disabled={!scrapReason.trim() || !scrapExpectedDate}
                        className={`w-full ${opMeta.confirmBtn} disabled:opacity-40 disabled:active:scale-100`}
                      >
                        {opMeta.confirmText}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleScanOp(activeOpMold.id)}
                    className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    模拟扫码 {activeOpMold.id}
                  </button>
                </>
              ) : scrapStage === 'waiting' ? (
                <div className="flex flex-col items-center text-center pt-10">
                  <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/40">
                    <i className="fas fa-envelope-open-text text-3xl text-white"></i>
                  </div>
                  <h3 className="text-slate-900 font-black text-lg tracking-tight mb-2">报废申请已提交</h3>
                  <p className="text-slate-500 text-xs mb-1">模具 {activeOpMold.id} 的报废审批信件已发送至部门领导</p>

                  <div className="mt-6 w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                    <div className="text-left">
                      <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest">当前状态</p>
                      <p className="text-slate-800 text-sm font-bold">等待领导审批</p>
                    </div>
                    <i className="fas fa-hourglass-half text-amber-500 ml-auto"></i>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-4">审批通过后再次进入本页面，将直接跳转至报废信息确认</p>

                  {/* 模拟邮件推送预览：包含报废描述、预计报废时间与审批链接 */}
                  <div className="mt-6 w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                      <i className="fas fa-envelope-open-text text-slate-400"></i>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">已推送审批邮件（模拟）</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500">收件人：王总（设备部经理）&lt;wangzong@company.com&gt;</p>
                        <p className="text-xs font-black text-slate-800">【报废审批】模具 {activeOpMold.id} 报废申请</p>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">您好，以下模具已提交报废申请，请及时审批：</p>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">模具编号：</span>{activeOpMold.id}</p>
                        <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">报废描述：</span>{scrapReason}</p>
                        <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">预计报废时间：</span>{scrapExpectedDate}</p>
                        {scrapNote && <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">备注：</span>{scrapNote}</p>}
                      </div>
                      <p className="text-xs text-slate-600">请点击以下链接处理本次申请：</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSimulateApprove}
                          className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-black py-3 rounded-xl active:scale-95 transition-all"
                        >
                          同意报废
                        </button>
                        <button
                          onClick={handleScrapReject}
                          className="flex-1 bg-red-50 border border-red-200 text-red-600 text-xs font-black py-3 rounded-xl active:scale-95 transition-all"
                        >
                          驳回请求
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 break-all">https://mold.company.com/scrap/approve?mold={activeOpMold.id} · https://mold.company.com/scrap/reject?mold={activeOpMold.id}</p>
                    </div>
                  </div>

                  <button
                    onClick={closeOp}
                    className="mt-6 bg-slate-800 text-white font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    返回列表
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-600"></i>
                    <div>
                      <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">领导已审批通过</p>
                      <p className="text-slate-600 text-xs">请再次扫描模具编码，并填写报废的具体信息</p>
                    </div>
                  </div>

                  {/* 第 1 步：再次扫描模具编码 */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">第 1 步</span>
                      <h4 className="text-slate-900 font-black text-sm tracking-tight">再次扫描模具编码</h4>
                      {scanVerified && (
                        <span className="ml-auto text-emerald-600 text-[10px] font-black flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>已核对
                        </span>
                      )}
                    </div>
                    {!scanVerified ? (
                      <>
                        <div className={`w-14 h-14 ${opMeta.qrBox} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <i className="fas fa-qrcode text-xl text-white"></i>
                        </div>
                        <p className="text-slate-500 text-xs text-center mb-4">请再次对准模具 {activeOpMold.id} 的标识码进行扫描</p>
                        <input
                          type="text"
                          value={scanValue}
                          onChange={(e) => setScanValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleScanOp((e.target as HTMLInputElement).value)}
                          placeholder={`请扫描模具 ${activeOpMold.id}`}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 ${opMeta.ring} transition-all ${opMeta.subText}`}
                        />
                        {scanError && (
                          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                            <p className="text-red-600 text-xs font-bold">{scanError}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleScanOp(activeOpMold.id)}
                          className="mt-3 w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                          模拟扫码 {activeOpMold.id}
                        </button>
                      </>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-600"></i>
                        <p className="text-emerald-600 text-xs font-bold">模具 {activeOpMold.id} 核对一致</p>
                      </div>
                    )}
                  </div>

                  {/* 第 2 步：确认报废信息 */}
                  {scanVerified && (
                    <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">第 2 步</span>
                        <p className="text-sm font-black text-slate-800">确认报废信息</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">报废描述：</span>{scrapReason}</p>
                        <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">预计报废时间：</span>{scrapExpectedDate}</p>
                        {scrapNote && <p className="text-xs text-slate-800"><span className="text-slate-400 font-black">备注：</span>{scrapNote}</p>}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">以上信息为提交申请时填写的内容，确认无误后提交即完成报废。</p>
                      <button
                        onClick={handleScrapInfoSubmit}
                        disabled={!scrapReason.trim()}
                        className={`w-full ${opMeta.confirmBtn} disabled:opacity-40 disabled:active:scale-100`}
                      >
                        提交报废信息
                      </button>
                    </div>
                  )}
                </>
              )
            ) : activeOp.type !== 'deactivate' ? (
              opSubmitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/40">
                    <i className="fas fa-check text-3xl text-white"></i>
                  </div>
                  <h3 className="text-slate-900 font-black text-lg tracking-tight mb-2">{isOutbound ? '出库成功' : '入库成功'}</h3>
                  <p className="text-slate-500 text-xs mb-1">{isOutbound ? `模具 ${activeOpMold.id} 已从柜位 ${opCabinet} 出库` : `模具 ${activeOpMold.id} 已入库至柜位 ${opCabinet}`}</p>
                  <button
                    onClick={onBack}
                    className="mt-8 bg-slate-800 text-white font-black py-4 px-8 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    返回首页
                  </button>
                </div>
              ) : (
                <>
                  <div className={opMeta.bannerBox}>
                    <p className={opMeta.bannerLabelClass}>{opMeta.bannerLabel}</p>
                    <p className={opMeta.bannerDescClass}>{opMeta.bannerDesc}</p>
                  </div>

                  {/* 第 1 步：扫描模具 */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">第 1 步</span>
                      <h4 className="text-slate-900 font-black text-sm tracking-tight">扫描模具二维码</h4>
                      {scanVerified && (
                        <span className="ml-auto text-emerald-600 text-[10px] font-black flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>已核对
                        </span>
                      )}
                    </div>
                    {!scanVerified ? (
                      <>
                        <div className={`w-14 h-14 ${opMeta.qrBox} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <i className="fas fa-qrcode text-xl text-white"></i>
                        </div>
                        <p className="text-slate-500 text-xs text-center mb-4">请对准模具 {activeOpMold.id} 的标识码进行扫描</p>
                        <input
                          type="text"
                          value={scanValue}
                          onChange={(e) => setScanValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleScanOp((e.target as HTMLInputElement).value)}
                          placeholder={`请扫描模具 ${activeOpMold.id}`}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 ${opMeta.ring} transition-all ${opMeta.subText}`}
                        />
                        {scanError && (
                          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                            <p className="text-red-600 text-xs font-bold">{scanError}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleScanOp(activeOpMold.id)}
                          className="mt-3 w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                          模拟扫码 {activeOpMold.id}
                        </button>
                      </>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-600"></i>
                        <p className="text-emerald-600 text-xs font-bold">模具 {activeOpMold.id} 核对一致</p>
                      </div>
                    )}
                  </div>

                  {/* 第 2 步：扫描入库/出库柜位 */}
                  {scanVerified && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">第 2 步</span>
                        <h4 className="text-slate-900 font-black text-sm tracking-tight">扫描{isOutbound ? '出库' : '入库'}柜位</h4>
                        {opCabinet && (
                          <span className="ml-auto text-blue-600 text-[10px] font-black flex items-center gap-1">
                            <i className="fas fa-check-circle"></i>已扫描
                          </span>
                        )}
                      </div>
                      {!opCabinet ? (
                        <>
                          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/40">
                            <i className="fas fa-warehouse text-xl text-white"></i>
                          </div>
                          <p className="text-slate-500 text-xs text-center mb-4">{isOutbound ? '请扫描该模具当前存放的模具柜位置码' : '请扫描要存放该模具的模具柜位置码'}</p>
                          <input
                            type="text"
                            value={opCabinet}
                            onChange={(e) => setOpCabinet(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScanCabinet((e.target as HTMLInputElement).value)}
                            placeholder="请扫描模具柜位置码"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all text-blue-600"
                          />
                          <button
                            onClick={() => handleScanCabinet('A1-02')}
                            className="mt-3 w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                          >
                            模拟扫码 A1-02
                          </button>
                        </>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-2">
                          <i className="fas fa-check-circle text-blue-600"></i>
                          <p className="text-blue-600 text-xs font-bold">已扫描柜位：{opCabinet}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 两步都完成：汇总并提交确认 */}
                  {scanVerified && opCabinet && (
                    <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2">
                        <i className={`fas fa-clipboard-check ${isOutbound ? 'text-blue-500' : 'text-emerald-500'}`}></i>
                        <p className="text-sm font-black text-slate-800">{isOutbound ? '出库' : '入库'}信息确认</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具编号</p>
                          <p className="text-sm font-black text-slate-800">{activeOpMold.id}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">{isOutbound ? '出库' : '入库'}柜位</p>
                          <p className="text-sm font-black text-slate-800">{opCabinet}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSubmitOp}
                        className={`w-full ${opMeta.confirmBtn}`}
                      >
                        提交确认
                      </button>
                    </div>
                  )}
                </>
              )
            ) : (
              <>
                <div className={opMeta.bannerBox}>
                  <p className={opMeta.bannerLabelClass}>{opMeta.bannerLabel}</p>
                  <p className={opMeta.bannerDescClass}>{opMeta.bannerDesc}</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-center">
                  <div className={`w-16 h-16 ${opMeta.qrBox} rounded-full flex items-center justify-center mx-auto mb-5`}>
                    <i className="fas fa-qrcode text-2xl text-white"></i>
                  </div>
                  <h4 className="text-slate-900 font-black text-base tracking-tight mb-1">扫描模具二维码</h4>
                  <p className="text-slate-500 text-xs">请对准模具 {activeOpMold.id} 的标识码进行扫描</p>
                  <input
                    type="text"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanOp((e.target as HTMLInputElement).value)}
                    placeholder={`请扫描模具 ${activeOpMold.id}`}
                    className={`mt-6 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono outline-none focus:ring-2 ${opMeta.ring} transition-all ${opMeta.subText}`}
                  />
                  {scanError && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-600 text-xs font-bold">{scanError}</p>
                    </div>
                  )}
                </div>

                {scanVerified && (
                  <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <p className="text-sm font-black text-slate-800">模具编号核对一致</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">模具编号</p>
                        <p className="text-sm font-black text-slate-800">{activeOpMold.id}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">存放位置</p>
                        <p className="text-sm font-black text-slate-800">{activeOpMold.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirmOp}
                      className={`w-full ${opMeta.confirmBtn}`}
                    >
                      {opMeta.confirmText}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleScanOp(activeOpMold.id)}
                  className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  模拟扫码 {activeOpMold.id}
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
            <button
              onClick={() => {
                setActiveBOMId(null);
                openOp('scrap', selectedBOMMold.id);
              }}
              className="h-10 px-3 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-black flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <i className="fas fa-trash-alt"></i>模具报废
            </button>
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
