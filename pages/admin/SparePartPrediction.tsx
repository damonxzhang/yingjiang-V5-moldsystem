import React, { useState } from 'react';

interface PredictedSpare {
  id: string;
  name: string;
  type: string;
  currentStock: number;
  safetyStock: number;
  predictedUsage: number;
  recommendPurchase: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const MOCK_PREDICTIONS: PredictedSpare[] = [
  {
    id: 'SP-001',
    name: '顶针 (Φ2.0)',
    type: '通用耗材',
    currentStock: 12,
    safetyStock: 50,
    predictedUsage: 85,
    recommendPurchase: 150,
    priority: 'high',
    reason: '下月 QFN 封装排产增加 40%，当前库存严重不足'
  },
  {
    id: 'SP-015',
    name: '热流道嘴',
    type: '关键组件',
    currentStock: 2,
    safetyStock: 3,
    predictedUsage: 4,
    recommendPurchase: 5,
    priority: 'medium',
    reason: '根据模具 Shot 数统计，3 套模具即将进入大修期'
  },
  {
    id: 'SP-022',
    name: '密封圈 (Set)',
    type: '易损件',
    currentStock: 45,
    safetyStock: 30,
    predictedUsage: 20,
    recommendPurchase: 0,
    priority: 'low',
    reason: '库存充足，满足未来 3 个月排产需求'
  }
];

const SparePartPrediction: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      // 模拟文件处理和 AI 分析过程
      setTimeout(() => {
        setIsUploading(false);
        setShowResults(true);
      }, 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white p-6 overflow-hidden">
      {/* 头部标题 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">备件购买预测 <span className="text-blue-500 text-sm font-bold ml-2">AI DRIVEN</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">根据排产计划自动分析备件需求</p>
        </div>
        
        <div className="flex gap-4">
          <label className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <i className="fas fa-file-excel"></i>
            {isUploading ? '正在分析数据...' : '上传 Excel 排产计划'}
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {!showResults ? (
        <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-900 rounded-3xl p-12 text-center">
          <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center text-4xl ${isUploading ? 'bg-blue-500/20 text-blue-500 animate-pulse' : 'bg-slate-900 text-slate-700'}`}>
            <i className={`fas ${isUploading ? 'fa-microchip animate-spin' : 'fa-cloud-upload-alt'}`}></i>
          </div>
          <h2 className="text-xl font-black mb-4 uppercase tracking-widest">
            {isUploading ? 'AI 正在分析排产数据与库存匹配度' : '暂无分析数据'}
          </h2>
          <p className="max-w-md text-slate-500 text-sm font-bold leading-relaxed">
            请上传包含【产品型号】、【计划产量】、【排产日期】的 Excel 文件，系统将自动结合当前模具健康状态及备件库存，为您生成最优采购建议。
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* 数据概览卡片 */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-slate-900/50 border-4 border-slate-900 p-6 rounded-3xl">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">建议采购种类</p>
              <p className="text-4xl font-black text-blue-500">12 <span className="text-sm">项</span></p>
            </div>
            <div className="bg-slate-900/50 border-4 border-slate-900 p-6 rounded-3xl">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">预估总金额</p>
              <p className="text-4xl font-black text-emerald-500">¥45.2k</p>
            </div>
            <div className="bg-slate-900/50 border-4 border-slate-900 p-6 rounded-3xl">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">库存预警风险</p>
              <p className="text-4xl font-black text-rose-500">HIGH</p>
            </div>
            <div className="bg-slate-900/50 border-4 border-slate-900 p-6 rounded-3xl">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">预测准确度</p>
              <p className="text-4xl font-black text-indigo-500">94%</p>
            </div>
          </div>

          {/* 建议列表 */}
          <div className="flex-1 bg-slate-900/30 border-4 border-slate-900 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b-4 border-slate-900 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-list-ul text-blue-500"></i>
                智能采购清单建议
              </h3>
              <button className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg uppercase tracking-tighter transition-all">
                导出采购申请表
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="pb-4">备件信息</th>
                    <th className="pb-4">当前/安全库存</th>
                    <th className="pb-4">预测消耗量</th>
                    <th className="pb-4">建议采买</th>
                    <th className="pb-4">分析结论 (Reasoning)</th>
                    <th className="pb-4">优先级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {MOCK_PREDICTIONS.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-900/40 transition-all">
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase">{item.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-1">{item.id} | {item.type}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${item.currentStock < item.safetyStock ? 'text-rose-500' : 'text-slate-300'}`}>
                            {item.currentStock}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.currentStock < item.safetyStock ? 'bg-rose-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(100, (item.currentStock / item.safetyStock) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{item.safetyStock}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="text-xs font-black text-amber-500">-{item.predictedUsage}</span>
                      </td>
                      <td className="py-6">
                        <span className={`text-lg font-black ${item.recommendPurchase > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                          {item.recommendPurchase > 0 ? `+${item.recommendPurchase}` : '--'}
                        </span>
                      </td>
                      <td className="py-6">
                        <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed italic">
                          "{item.reason}"
                        </p>
                      </td>
                      <td className="py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border-2 ${
                          item.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                          item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/30'
                        }`}>
                          {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Normal' : 'Safe'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SparePartPrediction;