
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// --- 模拟数据 (整合自原 ReportAnalysis) ---
const shotData = [
  { name: '模具 A', shots: 4000 },
  { name: '模具 B', shots: 3000 },
  { name: '模具 C', shots: 2000 },
  { name: '模具 D', shots: 2780 },
  { name: '模具 E', shots: 1890 },
  { name: '模具 F', shots: 2390 },
  { name: '模具 G', shots: 3490 },
];

const utilizationTrend = [
  { month: '1月', rate: 72 },
  { month: '2月', rate: 68 },
  { month: '3月', rate: 85 },
  { month: '4月', rate: 91 },
  { month: '5月', rate: 78 },
  { month: '6月', rate: 82 },
];

const statusData = [
  { name: '使用中', value: 12, color: '#10b981' },
  { name: '闲置', value: 5, color: '#3b82f6' },
  { name: '维修中', value: 2, color: '#ef4444' },
  { name: '保养中', value: 3, color: '#f59e0b' },
];

const failureCauses = [
  { name: '顶针故障', value: 45, color: '#6366f1' },
  { name: '温控异常', value: 25, color: '#f59e0b' },
  { name: '型腔磨损', value: 15, color: '#ef4444' },
  { name: '其他', value: 15, color: '#94a3b8' },
];

const spareConsumption = [
  { name: '加热棒 220V', count: 120 },
  { name: '顶杆 5mm', count: 85 },
  { name: '密封圈 A1', count: 65 },
  { name: '精密螺栓', count: 42 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. 核心 KPI 看板 */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '累计总产出 (Shots)', value: '2.4M', icon: 'fa-microchip', color: 'indigo', sub: '↑ 12% 环比增长' },
          { label: '平均故障间隔 (MTBF)', value: '342h', icon: 'fa-history', color: 'blue', sub: '较上季度提高 15h' },
          { label: '平均维修时长 (MTTR)', value: '1.8h', icon: 'fa-stopwatch', color: 'green', sub: '响应优化 5.2%' },
          { label: '月备件消耗', value: '¥42.8k', icon: 'fa-coins', color: 'amber', sub: '预算执行率 92%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group hover:border-indigo-500 transition-all">
            <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-3 text-lg`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{stat.value}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 2. 稼动率趋势图 */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fas fa-chart-area text-indigo-500"></i>
              全厂模具稼动率趋势 (%)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black tracking-widest uppercase">LATEST 6 MONTHS</span>
          </div>
          <div className="h-64">
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

        {/* 3. 模具状态分布 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-sm mb-4">模具状态实时分布</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 font-bold text-slate-500">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                  {s.name}
                </div>
                <span className="font-black text-slate-800">{s.value} 套</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 4. 故障原因帕累托图 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-sm mb-6">故障原因帕累托分析</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={failureCauses} innerRadius={0} outerRadius={70} dataKey="value">
                  {failureCauses.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {failureCauses.map(c => (
              <div key={c.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }}></div>
                {c.name} ({c.value}%)
              </div>
            ))}
          </div>
        </div>

        {/* 5. Shot 数监控 (Top 7) */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
             <i className="fas fa-microchip text-indigo-500"></i>
             模具累计 Shot 数监控 (TOP 7)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shotData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="shots" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 6. 高频消耗备件 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
            <i className="fas fa-boxes text-amber-500"></i>
            高频消耗备件 Top 4
          </h3>
          <div className="space-y-4">
            {spareConsumption.map((item, idx) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-slate-500">{item.name}</span>
                  <span className="text-indigo-600">{item.count} 件</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.count / 120) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 bg-slate-50 text-[10px] font-black text-slate-500 rounded uppercase tracking-widest hover:bg-slate-100 transition-colors">
            查看完整库存看板
          </button>
        </div>

        {/* 7. 智能风险预警列表 */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
              智能风险预警中心
            </h3>
            <span className="text-[10px] font-bold text-red-600 animate-pulse">2 个极高风险任务</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-3">编号</th>
                  <th className="px-6 py-3">风险类型</th>
                  <th className="px-6 py-3">状态/指标</th>
                  <th className="px-6 py-3">风险等级</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: 'MOLD-109', type: '寿命预警', metric: '95,000 / 100K', risk: '极高', color: 'red' },
                  { id: 'TY71', type: '高频异常', metric: '近30天维修 8 次', risk: '极高', color: 'red' },
                  { id: 'MOLD-042', type: '寿命预警', metric: '82,000 / 100K', risk: '中等', color: 'amber' },
                  { id: 'QF60', type: '异常维修', metric: '近30天维修 5 次', risk: '较低', color: 'blue' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors text-[11px]">
                    <td className="px-6 py-4 font-black text-slate-800">{row.id}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold">{row.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.metric}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black bg-${row.color}-100 text-${row.color}-700`}>
                        {row.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 font-black hover:underline uppercase text-[9px]">处理</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
