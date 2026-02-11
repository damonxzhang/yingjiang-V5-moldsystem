
import React, { useState, useMemo } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';

const ShotCountMonitor: React.FC = () => {
  const [showRawData, setShowRawData] = useState(false);
  const [filterProcess, setFilterProcess] = useState('');
  const [filterPackage, setFilterPackage] = useState('');

  // 提取所有可用的选项
  const processOptions = useMemo(() => Array.from(new Set(MOCK_MOLDS.map(m => m.process))), []);
  const packageOptions = useMemo(() => Array.from(new Set(MOCK_MOLDS.map(m => m.packageType))), []);

  // 过滤并排序模具数据
  const filteredMolds = useMemo(() => {
    return MOCK_MOLDS.filter(m => {
      const matchProcess = !filterProcess || m.process === filterProcess;
      const matchPackage = !filterPackage || m.packageType === filterPackage;
      return matchProcess && matchPackage;
    }).sort((a, b) => b.shotTotal - a.shotTotal);
  }, [filterProcess, filterPackage]);

  // 模拟从 API 获取的数据排序或过滤
  const sortedMolds = filteredMolds;

  // 模拟原始 API 数据 JSON
  const rawApiData = {
    status: "success",
    timestamp: new Date().toISOString(),
    source: "MES_PLC_ADAPTER_v2.4",
    count: sortedMolds.length,
    data: sortedMolds.map(m => ({
      die_id: m.id,
      current_shots: m.shotTotal,
      limit_shots: m.lifeLimit,
      machine_id: m.machineId || 'N/A',
      location: m.location,
      last_update: "2024-05-20 14:30:05"
    }))
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">实时 Shot 数监控看板</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Real-time API Data Stream: Mold Shot Counts & Wear-out Analytics
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRawData(true)}
            className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <i className="fas fa-code"></i>
            查看 API 原始数据
          </button>
          <div className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            API 数据链路正常 (200 OK)
          </div>
        </div>
      </div>

      {/* 筛选条 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">工序</label>
          <select 
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">全部工序</option>
            {processOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">产品类型</label>
          <select 
            value={filterPackage}
            onChange={(e) => setFilterPackage(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">全部类型</option>
            {packageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {(filterProcess || filterPackage) && (
          <button 
            onClick={() => { setFilterProcess(''); setFilterPackage(''); }}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            重置筛选
          </button>
        )}

        <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">
          当前显示: <span className="text-indigo-600">{sortedMolds.length}</span> / {MOCK_MOLDS.length}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#f8fafc] text-[#94a3b8] text-[10px] uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 font-black">Die No.</th>
              <th className="px-6 py-5 font-black">M/C Model</th>
              <th className="px-6 py-5 font-black">M/C No.</th>
              <th className="px-6 py-5 font-black">Package</th>
              <th className="px-6 py-5 font-black text-right">MaxLimit</th>
              <th className="px-6 py-5 font-black text-right">Total Count</th>
              <th className="px-10 py-5 font-black">Wornout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedMolds.map(mold => {
              const wornoutRate = Math.min(100, Math.round((mold.shotTotal / mold.lifeLimit) * 100));
              
              // 进度条颜色逻辑
              let barColor = 'bg-indigo-500';
              if (wornoutRate >= 95) barColor = 'bg-red-500';
              else if (wornoutRate >= 80) barColor = 'bg-amber-500';

              return (
                <tr key={mold.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800 tracking-tighter text-sm uppercase">
                      {mold.id.startsWith('MD-') ? mold.id : `MD-${new Date().getFullYear()}-${mold.id.slice(-3)}`}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-slate-600 font-bold text-xs uppercase">
                      Y-Series {mold.packageType} {mold.vendor}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-slate-500 font-mono text-xs uppercase">
                      {mold.location.includes('-') ? mold.location.split('-')[0] : (mold.machineId || 'CAB-A01')}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-slate-600 font-bold text-xs">{mold.packageType}</span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="font-mono text-slate-700 text-xs font-medium">
                      {mold.lifeLimit.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="font-mono text-slate-900 text-xs font-black tracking-tight">
                      {mold.shotTotal.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-10 py-6 min-w-[180px]">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                          style={{ width: `${wornoutRate}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 w-8 text-right">
                        {wornoutRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shrink-0 shadow-lg shadow-indigo-200">
          <i className="fas fa-robot"></i>
        </div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm">智能冲次分析建议</h4>
          <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
            API 检测到模具 <span className="font-black underline">MD-2024-071</span> 的冲次增长斜率异常，可能存在设备空打情况，建议核实产线 PLC 计数信号。
          </p>
        </div>
      </div>

      {/* API 原始数据弹窗 */}
      {showRawData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">API 原始数据流</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Source: MES_PLC_ADAPTER_v2.4 (Real-time)</p>
              </div>
              <button 
                onClick={() => setShowRawData(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Die ID</th>
                    <th className="px-6 py-4">Current Shots</th>
                    <th className="px-6 py-4">Limit</th>
                    <th className="px-6 py-4">Machine</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawApiData.data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-indigo-600 font-bold">{item.die_id}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-700">{item.current_shots.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{item.limit_shots.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                          {item.machine_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-[11px] font-medium">{item.location}</td>
                      <td className="px-6 py-4 text-slate-400 text-[10px] italic">{item.last_update}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowRawData(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
              >
                关闭视图
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShotCountMonitor;
