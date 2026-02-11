
import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';

// 模拟数据
const utilizationTrend = [
  { month: '1月', rate: 72 },
  { month: '2月', rate: 68 },
  { month: '3月', rate: 85 },
  { month: '4月', rate: 91 },
  { month: '5月', rate: 78 },
  { month: '6月', rate: 82 },
];

const failureCauses = [
  { name: '顶针故障', value: 45, color: '#6366f1' },
  { name: '温控异常', value: 25, color: '#f59e0b' },
  { name: '型腔磨损', value: 15, color: '#ef4444' },
  { name: '异物压伤', value: 10, color: '#10b981' },
  { name: '其他', value: 5, color: '#94a3b8' },
];

const spareConsumption = [
  { name: '加热棒 220V', count: 120 },
  { name: '顶杆 5mm', count: 85 },
  { name: '密封圈 A1', count: 65 },
  { name: '精密螺栓', count: 42 },
  { name: '弹簧(特强)', count: 30 },
];

const ReportAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('HALF_YEAR');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">全厂模具数据挖掘与效能分析</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">数据更新至: {new Date().toLocaleDateString()} 08:00:00</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setTimeRange('MONTH')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === 'MONTH' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            本月
          </button>
          <button 
            onClick={() => setTimeRange('HALF_YEAR')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === 'HALF_YEAR' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            半年
          </button>
        </div>
      </div>

      {/* 核心指标仪表盘 */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '累计总产出 (Shots)', value: '2.4M', icon: 'fa-microchip', color: 'indigo', sub: '↑ 12% 环比增长' },
          { label: '平均故障间隔 (MTBF)', value: '342h', icon: 'fa-history', color: 'blue', sub: '较上季度提高 15h' },
          { label: '平均维修时长 (MTTR)', value: '1.8h', icon: 'fa-stopwatch', color: 'green', sub: '响应速度优化 5.2%' },
          { label: '月备件消耗金额', value: '¥42.8k', icon: 'fa-hand-holding-usd', color: 'amber', sub: '预算执行率 92%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-indigo-500 transition-all">
            <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg flex items-center justify-center mb-4 text-lg`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 稼动率趋势图 */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-chart-area text-indigo-500"></i>
              全厂模具综合稼动率趋势 (%)
            </h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black tracking-widest uppercase">稳步增长中</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 故障原因分布 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">故障原因帕累托分布</h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureCauses}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {failureCauses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {failureCauses.map(c => (
              <div key={c.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 font-bold text-slate-500">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></div>
                  {c.name}
                </div>
                <span className="font-black text-slate-800">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 备件排行 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-boxes text-blue-500"></i>
            高频消耗备件 Top 5
          </h3>
          <div className="flex-1 space-y-4">
            {spareConsumption.map((item, idx) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="text-indigo-600">{item.count} 件</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(item.count / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 高频维修预警列表 */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">高频异常模具 (维修预警)</h3>
            <button className="text-xs text-indigo-600 font-bold hover:underline">导出分析报告</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-4 py-3">模具编号</th>
                <th className="px-4 py-3 text-center">近30天维修次数</th>
                <th className="px-4 py-3">核心故障件</th>
                <th className="px-4 py-3">建议对策</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: 'TY71', count: 8, component: '型腔密封件', action: '建议深度保养/大修' },
                { id: 'QF60', count: 5, component: '加热插头', action: '更换耐高温接头' },
                { id: 'MOLD-109', count: 4, component: '顶针', action: '排查Alignment误差' },
              ].map(row => (
                <tr key={row.id} className="text-[11px] group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-black text-slate-800">{row.id}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-black">
                      {row.count} 次
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-bold">{row.component}</td>
                  <td className="px-4 py-4 text-indigo-600 font-bold italic">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportAnalysis;
