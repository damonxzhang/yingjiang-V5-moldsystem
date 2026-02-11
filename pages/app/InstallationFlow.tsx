
import React, { useState } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { Mold, BuyoffStatus, MoldStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS, BUYOFF_COLORS, BUYOFF_LABELS } from '../../constants';

interface InstallationFlowProps {
  onBack: () => void;
}

const InstallationFlow: React.FC<InstallationFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [moldId, setMoldId] = useState('');
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null);
  const [machineId, setMachineId] = useState('');
  const [isBuyoffLoading, setIsBuyoffLoading] = useState(false);

  const handleScan = () => {
    const mold = MOCK_MOLDS.find(m => m.id === moldId);
    if (mold) {
      setSelectedMold(mold);
      setStep(2);
    } else {
      alert("未找到该模具，请检查编号！");
    }
  };

  const startBuyoff = async () => {
    setIsBuyoffLoading(true);
    // 模拟调用外部 BUYOFF 接口
    setTimeout(() => {
      if (selectedMold) {
        setSelectedMold({ ...selectedMold, buyoffStatus: BuyoffStatus.Pass });
      }
      setIsBuyoffLoading(false);
      setStep(3);
    }, 2000);
  };

  const completeInstallation = () => {
    alert("安装成功！模具状态已更新为：使用中。");
    onBack();
  };

  const isScrapped = selectedMold?.status === MoldStatus.Scrapped;
  const isLifeLimitReached = selectedMold && selectedMold.shotTotal >= selectedMold.lifeLimit;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <i className="fas fa-chevron-left text-slate-600"></i>
        </button>
        <h2 className="text-xl font-bold">模具安装流程</h2>
      </div>

      {/* 进度条 */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-8 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center">
            <i className="fas fa-qrcode text-4xl text-blue-500 mb-4"></i>
            <p className="text-blue-700 font-semibold mb-2">扫描模具二维码</p>
            <input 
              type="text" 
              placeholder="或手动输入模具编号 (例如: MOLD-001)" 
              value={moldId}
              onChange={(e) => setMoldId(e.target.value)}
              className="mt-4 w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            disabled={!moldId}
            onClick={handleScan}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            识别模具
          </button>
        </div>
      )}

      {step === 2 && selectedMold && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2">{selectedMold.name}</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded border ${STATUS_COLORS[selectedMold.status]}`}>
                {STATUS_LABELS[selectedMold.status]}
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {selectedMold.type}
              </span>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">当前总 Shot 数</p>
                <p className="font-bold">{selectedMold.shotTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">寿命上限</p>
                <p className="font-bold">{selectedMold.lifeLimit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {(isScrapped || isLifeLimitReached) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-start gap-3">
              <i className="fas fa-ban mt-1 text-lg"></i>
              <div className="text-xs">
                <p className="font-bold">系统强制锁定：禁止安装</p>
                <p>{isScrapped ? "此模具已在系统内标记为报废。" : "此模具已达到或超过设计寿命上限。"}</p>
              </div>
            </div>
          )}

          {!isScrapped && !isLifeLimitReached && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">目标安装机台</label>
                <input 
                  type="text" 
                  placeholder="扫描或输入机台编号 (例如: MC-101 或 机台01)" 
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-amber-800">外部 BUYOFF 验证</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${BUYOFF_COLORS[selectedMold.buyoffStatus]}`}>
                    {BUYOFF_LABELS[selectedMold.buyoffStatus]}
                  </span>
                </div>
                <p className="text-[10px] text-amber-700 italic">规则：必须通过 BUYOFF 接口验证才可继续安装。</p>
              </div>

              <button 
                onClick={startBuyoff}
                disabled={!machineId || isBuyoffLoading}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBuyoffLoading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    正在连接 BUYOFF 接口...
                  </>
                ) : (
                  <>
                    <i className="fas fa-satellite-dish"></i>
                    发起 BUYOFF 确认
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {step === 3 && selectedMold && (
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-200 p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl mb-4">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-xl font-bold text-green-800">BUYOFF 已通过</h3>
            <p className="text-sm text-green-700 mt-2">外部系统已确认模具 <b>{selectedMold.id}</b> 品质合格，可以进行安装。</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">安装检查清单</h4>
            <div className="space-y-3">
              {[
                "主螺栓已按标准扭矩紧固",
                "冷却水路已连接并测试无泄漏",
                "限位开关已验证正常",
                "模具外观及型腔清洁完毕"
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={completeInstallation}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fas fa-flag-checkered"></i>
            完成安装并更新状态
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallationFlow;
