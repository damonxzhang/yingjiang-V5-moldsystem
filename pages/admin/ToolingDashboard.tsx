import React, { useState, useEffect } from 'react';

interface ToolingDashboardProps {
  onSwitchView?: (view: 'tooling' | 'machine') => void;
  onBackToAdmin?: () => void;
}

const ToolingDashboard: React.FC<ToolingDashboardProps> = ({ onSwitchView, onBackToAdmin }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  const molds = [
    { id: 'T101', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T102', status: '调试中', usage1: '900000 90%', usage2: '20000 60%', border: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' },
    { id: 'T103', status: '异常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
    { id: 'T104', status: '正常', usage1: '700000 70%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T105', status: '调试中', usage1: '900000 90%', usage2: '20000 60%', border: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' },
    { id: 'T106', status: '异常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
    { id: 'T107', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T108', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T109', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T110', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T111', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { id: 'T112', status: '正常', usage1: '900000 90%', usage2: '20000 60%', border: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  ];

  return (
    <div className="min-h-screen bg-[#050a30] text-white p-4 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex gap-2">
          {onBackToAdmin && (
            <button 
              onClick={onBackToAdmin}
              className="px-6 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-sm font-bold transition-all flex items-center gap-2 group mr-2"
              title="返回后台"
            >
              <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform text-blue-400"></i>
              返回后台
            </button>
          )}
          <button 
            onClick={() => onSwitchView?.('machine')}
            className="px-6 py-1 bg-blue-900/50 border border-blue-500/50 rounded text-sm font-bold text-blue-400 hover:bg-blue-800 transition-colors"
          >
            设备
          </button>
          <button className="px-6 py-1 bg-blue-700 border border-blue-400 rounded text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            模具
          </button>
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-blue-100">
          Mold Tooling Management System - Mold Board Display (by tooling)
        </h1>
        <div className="bg-blue-900/50 px-4 py-1 rounded border border-blue-800 text-blue-300 font-mono text-sm">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 px-4 pb-4">
        {/* Left Column: Idle Area */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex flex-col h-full">
            <h2 className="text-center text-blue-300 font-bold mb-4 flex items-center justify-center gap-2">
              <i className="fas fa-chevron-left text-blue-500/50"></i>
              <i className="fas fa-chevron-left text-blue-500/70"></i>
              设备闲置区
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-blue-950 border border-blue-800 p-1 text-[8px] text-center rounded">
                  <p className="font-bold text-blue-300">T113</p>
                  <p className="text-green-400">900000 90%</p>
                  <p className="text-blue-400">20000 60%</p>
                  <p className="bg-blue-900/50 mt-0.5 py-0.5">HTMAP</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="border border-blue-500/20 border-dashed rounded flex items-center justify-center text-[10px] text-blue-500/50 h-16">
                  闲置区
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Mold Grid */}
        <div className="col-span-6 grid grid-cols-3 gap-4">
          {molds.map(mold => (
            <div key={mold.id} className={`bg-blue-900/20 border-2 ${mold.border} rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden group hover:scale-105 transition-transform`}>
              <div className="bg-blue-800/80 text-center py-1 rounded text-sm font-bold shadow-inner">{mold.id}</div>
              <div className="space-y-1">
                <div className="relative h-6 bg-slate-800 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-green-600 w-[90%] flex items-center justify-center text-[10px] font-bold">
                    {mold.usage1}
                  </div>
                </div>
                <div className="relative h-6 bg-slate-800 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 w-[60%] flex items-center justify-center text-[10px] font-bold">
                    {mold.usage2}
                  </div>
                </div>
              </div>
              <div className="bg-blue-800/50 text-center py-1 rounded text-[10px] font-bold tracking-widest text-blue-200">
                HTMAP
              </div>
              {/* Status Indicator overlay for abnormal/debugging */}
              {mold.status !== '正常' && (
                <div className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold rounded-bl ${
                  mold.status === '调试中' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                }`}>
                  {mold.status}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Real-time Monitor */}
        <div className="col-span-3 flex flex-col">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex flex-col h-full">
            <h2 className="text-center text-blue-300 font-bold mb-4 flex items-center justify-center gap-2">
              设备状态实时监控
              <i className="fas fa-chevron-right text-blue-500/70"></i>
              <i className="fas fa-chevron-right text-blue-500/50"></i>
            </h2>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-blue-400 border-b border-blue-800">
                  <tr>
                    <th className="py-2 font-bold text-left">模具号</th>
                    <th className="py-2 font-bold text-right">模具状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30">
                  {[
                    { id: 'TY101', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY102', status: '调试中', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
                    { id: 'TY103', status: '异常', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
                    { id: 'TY104', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY105', status: '调试中', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
                    { id: 'TY106', status: '异常', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
                    { id: 'TY107', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY108', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY109', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY110', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY111', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY112', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY113', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                    { id: 'TY114', status: '正常', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-800/20 transition-colors">
                      <td className="py-2 text-blue-200 font-mono">{row.id}</td>
                      <td className="py-2 text-right">
                        <span className={`px-3 py-0.5 rounded text-xs font-bold border ${row.color}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolingDashboard;
