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
  const [showResults, setShowResults] = useState(true);
  const [predictions, setPredictions] = useState<PredictedSpare[]>(MOCK_PREDICTIONS);
  const [selectedItem, setSelectedItem] = useState<PredictedSpare | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [showToast, setShowToast] = useState<{show: boolean, message: string, type: 'success' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });

  const handleFileUpload = () => {
    setIsUploading(true);
    // 模拟快速分析刷新过程
    setShowResults(false);
    setTimeout(() => {
      setIsUploading(false);
      setShowResults(true);
      setPredictions(MOCK_PREDICTIONS);
    }, 800);
  };

  const handleIgnore = (id: string) => {
    setPredictions(prev => prev.filter(item => item.id !== id));
    setShowToast({
      show: true,
      message: '已忽略该项建议',
      type: 'info'
    });
    setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 2000);
  };

  const openConfirmModal = (item: PredictedSpare) => {
    setSelectedItem(item);
    setPurchaseQty(item.recommendPurchase);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = () => {
    if (!selectedItem) return;
    
    setPredictions(prev => prev.filter(item => item.id !== selectedItem.id));
    setShowConfirmModal(false);
    setShowToast({
      show: true,
      message: `已提交 [${selectedItem.name}] x ${purchaseQty} 的采购申请`,
      type: 'success'
    });
    setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 2000);
    setSelectedItem(null);
  };

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 p-6 overflow-hidden relative">
      {/* 确认采购弹窗 */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">确认采购申请</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">请核对备件信息及建议采购数量</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">备件名称</p>
                  <p className="text-sm font-black text-slate-800">{selectedItem.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedItem.id} | {selectedItem.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">当前库存</p>
                    <p className="text-lg font-black text-slate-800">{selectedItem.currentStock}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">建议采购</p>
                    <p className="text-lg font-black text-blue-600">+{selectedItem.recommendPurchase}</p>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-100">
                  <p className="text-xs font-black text-blue-900 uppercase mb-3 flex justify-between items-center">
                    确认采购数量
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded italic">系统推荐值</span>
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => setPurchaseQty(Math.max(1, purchaseQty - 1))}
                      className="w-10 h-10 bg-white border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <input 
                      type="number" 
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-center text-2xl font-black text-blue-600 outline-none"
                    />
                    <button 
                      onClick={() => setPurchaseQty(purchaseQty + 1)}
                      className="w-10 h-10 bg-white border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="py-4 rounded-2xl font-black text-sm text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="py-4 rounded-2xl font-black text-sm bg-blue-600 text-white uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-200 transition-all"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl transition-all animate-bounce flex items-center gap-3 border ${
          showToast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-white border-slate-700'
        }`}>
          <i className={`fas ${showToast.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
          <span className="text-sm font-black uppercase tracking-widest">{showToast.message}</span>
        </div>
      )}

      {/* 头部标题 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">备件购买预测</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">根据排产计划自动分析备件需求</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleFileUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <i className="fas fa-file-excel"></i>
            {isUploading ? '正在分析数据...' : '上传 Excel 排产计划'}
          </button>
        </div>
      </div>

      {!showResults ? (
        <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-3xl p-12 text-center">
          <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center text-4xl ${isUploading ? 'bg-blue-50 text-blue-500 animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
            <i className={`fas ${isUploading ? 'fa-spinner animate-spin' : 'fa-cloud-upload-alt'}`}></i>
          </div>
          <h2 className="text-xl font-black mb-4 uppercase tracking-widest text-slate-800">
            {isUploading ? '正在分析排产数据与库存匹配度' : '暂无分析数据'}
          </h2>
          <p className="max-w-md text-slate-400 text-sm font-bold leading-relaxed">
            请上传包含【产品型号】、【计划产量】、【排产日期】的 Excel 文件，系统将自动结合当前模具健康状态及备件库存，为您生成最优采购建议。
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* 建议列表 */}
          <div className="flex-1 bg-white border-4 border-slate-100 rounded-3xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b-4 border-slate-50 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                <i className="fas fa-list-ul text-blue-500"></i>
                智能采购清单建议
              </h3>
              <button className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg uppercase tracking-tighter transition-all">
                导出采购申请表
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                    <th className="pb-4">备件信息</th>
                    <th className="pb-4">当前/安全库存</th>
                    <th className="pb-4">预测消耗量</th>
                    <th className="pb-4">建议采买</th>
                    <th className="pb-4">分析结论 (Reasoning)</th>
                    <th className="pb-4">优先级</th>
                    <th className="pb-4">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {predictions.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 uppercase">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">{item.id} | {item.type}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${item.currentStock < item.safetyStock ? 'text-rose-500' : 'text-slate-600'}`}>
                            {item.currentStock}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.currentStock < item.safetyStock ? 'bg-rose-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(100, (item.currentStock / item.safetyStock) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{item.safetyStock}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="text-xs font-black text-amber-600">-{item.predictedUsage}</span>
                      </td>
                      <td className="py-6">
                        <span className={`text-lg font-black ${item.recommendPurchase > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                          {item.recommendPurchase > 0 ? `+${item.recommendPurchase}` : '--'}
                        </span>
                      </td>
                      <td className="py-6">
                        <p className="text-[10px] text-slate-500 font-bold max-w-xs leading-relaxed italic">
                          "{item.reason}"
                        </p>
                      </td>
                      <td className="py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border-2 ${
                          item.priority === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                          item.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Normal' : 'Safe'}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleIgnore(item.id)}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-tighter transition-all px-2 py-1 border border-transparent hover:border-slate-200 rounded"
                          >
                            忽略
                          </button>
                          <button 
                            onClick={() => openConfirmModal(item)}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter transition-all px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            提交采购
                          </button>
                        </div>
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