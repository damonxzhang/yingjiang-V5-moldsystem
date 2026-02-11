
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { MoldStatus, BuyoffStatus } from '../../types';

// 接口定义：层级化绑定
interface MoldSlot {
  id: string; // P1, P2, P3
  moldId: string;
  paramReady: boolean;
}

interface ProductConfiguration {
  sku: string;
  name: string;
  slots: [MoldSlot, MoldSlot, MoldSlot]; // 固定 3 个工位
}

interface MachineNode {
  id: string;
  name: string;
  availableProducts: ProductConfiguration[];
}

// 模拟多级数据 (增加数据量以展示筛选效果)
const MOCK_HIERARCHY: MachineNode[] = [
  {
    id: 'BMD-14',
    name: '1# 全自动封装线',
    availableProducts: [
      {
        sku: '5220-X',
        name: '高频通信模块',
        slots: [
          { id: 'P1', moldId: 'MD-2024-001', paramReady: true },
          { id: 'P2', moldId: 'MD-2024-015', paramReady: true },
          { id: 'P3', moldId: 'MD-2023-088', paramReady: false },
        ]
      },
      {
        sku: '00BN-Pro',
        name: '车规级控制器',
        slots: [
          { id: 'P1', moldId: 'MD-2024-071', paramReady: true },
          { id: 'P2', moldId: 'MD-2024-001', paramReady: false },
          { id: 'P3', moldId: 'MD-2024-002', paramReady: true },
        ]
      }
    ]
  },
  {
    id: 'BMD-15',
    name: '2# 高速冲压线',
    availableProducts: [
      {
        sku: 'SKU-882',
        name: '精密支架',
        slots: [
          { id: 'P1', moldId: 'MD-2024-001', paramReady: true },
          { id: 'P2', moldId: 'MD-2024-002', paramReady: true },
          { id: 'P3', moldId: 'MD-2024-071', paramReady: true },
        ]
      },
      {
        sku: 'V-PRO-90',
        name: '视觉处理器外壳',
        slots: [
          { id: 'P1', moldId: 'MD-2024-015', paramReady: false },
          { id: 'P2', moldId: 'MD-2023-088', paramReady: true },
          { id: 'P3', moldId: 'MD-2024-001', paramReady: true },
        ]
      }
    ]
  }
];

const ProductionReadyList: React.FC = () => {
  const [machines, setMachines] = useState<MachineNode[]>(MOCK_HIERARCHY);
  const [activeMachineId, setActiveMachineId] = useState(MOCK_HIERARCHY[0].id);
  const [activeSku, setActiveSku] = useState(MOCK_HIERARCHY[0].availableProducts[0].sku);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // 1. 计算筛选后的机台
  const filteredMachines = useMemo(() => {
    if (!searchQuery) return machines;
    const q = searchQuery.toLowerCase();
    return machines.filter(m => 
      m.id.toLowerCase().includes(q) || 
      m.availableProducts.some(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    );
  }, [machines, searchQuery]);

  // 2. 获取当前选中机台
  const currentMachine = useMemo(() => 
    machines.find(m => m.id === activeMachineId) || machines[0], 
  [machines, activeMachineId]);

  // 3. 计算当前机台下符合搜索的产品
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return currentMachine.availableProducts;
    const q = searchQuery.toLowerCase();
    // 注意：如果搜索命中了机台 ID，我们依然展示该机台所有产品；
    // 只有当搜索针对的是 SKU/名称时，才进行产品内部过滤。
    if (currentMachine.id.toLowerCase().includes(q)) return currentMachine.availableProducts;
    
    return currentMachine.availableProducts.filter(p => 
      p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [currentMachine, searchQuery]);

  // 逻辑：如果当前选中的 SKU 不在筛选后的产品列表中，自动重选第一个
  useEffect(() => {
    if (filteredProducts.length > 0 && !filteredProducts.find(p => p.sku === activeSku)) {
      setActiveSku(filteredProducts[0].sku);
    }
  }, [filteredProducts, activeSku]);

  const currentConfig = useMemo(() => 
    currentMachine.availableProducts.find(p => p.sku === activeSku) || currentMachine.availableProducts[0],
  [currentMachine, activeSku]);

  const toggleParam = (slotId: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === activeMachineId) {
        return {
          ...m,
          availableProducts: m.availableProducts.map(p => {
            if (p.sku === activeSku) {
              return {
                ...p,
                slots: p.slots.map(s => s.id === slotId ? { ...s, paramReady: !s.paramReady } : s) as any
              };
            }
            return p;
          })
        };
      }
      return m;
    }));
  };

  const handleMachineChange = (id: string) => {
    setActiveMachineId(id);
    const m = machines.find(mach => mach.id === id);
    if (m) {
      // 切换机台时，逻辑上优先选择符合当前搜索的产品
      const q = searchQuery.toLowerCase();
      const firstMatched = m.availableProducts.find(p => 
        p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
      setActiveSku(firstMatched ? firstMatched.sku : m.availableProducts[0].sku);
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 1500);
  };

  const getMoldStatus = (moldId: string) => {
    const mold = MOCK_MOLDS.find(m => m.id === moldId);
    return mold ? (mold.status === MoldStatus.InUse || mold.status === MoldStatus.Idle) : false;
  };

  const getBuyoffStatus = (moldId: string) => {
    const mold = MOCK_MOLDS.find(m => m.id === moldId);
    return mold ? mold.buyoffStatus === BuyoffStatus.Pass : false;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 级联通知系统 */}
      {showNotification && (
        <div className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl border border-indigo-500/30 flex items-center gap-4 animate-in slide-in-from-right duration-500">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <i className="fas fa-satellite-dish text-white"></i>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Sync Complete</p>
            <p className="text-sm font-bold">配置已同步至边缘机台: {activeMachineId}</p>
          </div>
        </div>
      )}

      {/* 顶层筛选 Hub */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex-1 w-full relative group">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
          <input 
            type="text"
            placeholder="快速检索机台、产品 SKU 或名称 (如: BMD-14 或 5220)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {filteredMachines.length} 机台命中
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            {filteredProducts.length} 产品可用
          </div>
        </div>
      </section>

      {/* 第一级：机台切换 */}
      <section className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-2 max-w-fit overflow-x-auto no-scrollbar">
        {filteredMachines.length > 0 ? (
          filteredMachines.map(m => (
            <button
              key={m.id}
              onClick={() => handleMachineChange(m.id)}
              className={`px-8 py-4 rounded-2xl text-xs font-black transition-all flex items-center gap-3 whitespace-nowrap ${
                activeMachineId === m.id 
                  ? 'bg-slate-900 text-white shadow-xl scale-105' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`fas fa-microchip ${activeMachineId === m.id ? 'text-indigo-400' : 'text-slate-300'}`}></i>
              {m.id}
            </button>
          ))
        ) : (
          <div className="px-6 py-3 text-xs text-slate-400 font-bold italic">未找到匹配机台</div>
        )}
      </section>

      {/* 第二级：产品 SKU 选择 */}
      <section className="relative">
        <div className="absolute left-10 -top-6 w-[2px] h-6 bg-slate-200"></div>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative min-h-[160px]">
          <div className="absolute right-0 top-0 p-10 opacity-10 pointer-events-none">
             <i className="fas fa-barcode text-9xl"></i>
          </div>
          
          <div className="relative z-10">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <i className="fas fa-layer-group"></i>
              Available Product Configurations ({currentMachine.id})
            </h4>
            
            {filteredProducts.length > 0 ? (
              <div className="flex flex-wrap gap-4 animate-in fade-in zoom-in-95 duration-300">
                {filteredProducts.map(p => (
                  <button
                    key={p.sku}
                    onClick={() => setActiveSku(p.sku)}
                    className={`group relative px-8 py-5 rounded-3xl border-2 transition-all text-left min-w-[220px] ${
                      activeSku === p.sku 
                        ? 'bg-white border-white shadow-lg shadow-indigo-500/10' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activeSku === p.sku ? 'text-indigo-500' : 'text-slate-500'}`}>
                      {activeSku === p.sku ? 'Selected Configuration' : 'Stored Profile'}
                    </p>
                    <p className={`text-xl font-black tracking-tight ${activeSku === p.sku ? 'text-slate-900' : 'text-slate-300'}`}>
                      {p.sku}
                    </p>
                    <p className="text-[11px] font-medium opacity-60 truncate">{p.name}</p>
                    
                    {activeSku === p.sku && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[2px] h-10 bg-white"></div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 space-y-2">
                <i className="fas fa-search-minus text-3xl opacity-20"></i>
                <p className="text-sm font-bold opacity-40 italic">当前机台下未找到匹配产品</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 第三级：三工位模具矩阵 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        {currentConfig.slots.map((slot) => {
          const isMoldReady = getMoldStatus(slot.moldId);
          const isBuyoffReady = getBuyoffStatus(slot.moldId);
          const isReady = slot.paramReady && isMoldReady && isBuyoffReady;

          return (
            <div 
              key={slot.id}
              className={`relative bg-white border-2 rounded-[3rem] p-10 transition-all duration-500 ${
                isReady ? 'border-green-100 shadow-xl shadow-green-50' : 'border-slate-100 shadow-sm'
              } ${isPublishing ? 'opacity-40 grayscale pointer-events-none' : ''}`}
            >
              {/* 背景标号 */}
              <div className="absolute -right-4 -top-8 text-slate-50 text-[10rem] font-black select-none leading-none opacity-50">
                {slot.id}
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h5 className="text-4xl font-black text-slate-900 tracking-tighter">{slot.id}</h5>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Station Controller</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    isReady ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isReady ? 'Ready' : 'Waiting'}
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                   <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Bound Mold ID</p>
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                         <i className="fas fa-microchip"></i>
                       </div>
                       <p className="text-xl font-black text-slate-800 tracking-tight">{slot.moldId}</p>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => toggleParam(slot.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      slot.paramReady 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    } hover:scale-105 active:scale-95 shadow-sm`}
                  >
                    <i className={`fas ${slot.paramReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">工艺参数</span>
                  </button>

                  <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    isMoldReady 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  } shadow-sm`}>
                    <i className={`fas ${isMoldReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">模具物理状态</span>
                  </div>

                  <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    isBuyoffReady 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  } shadow-sm`}>
                    <i className={`fas ${isBuyoffReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Buyoff状态</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 底部：控制中心反馈 */}
      <footer className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 opacity-10">
          <i className="fas fa-cogs text-[15rem]"></i>
        </div>
        
        <div className="relative z-10 space-y-2">
          <h4 className="text-2xl font-black italic tracking-tight">配置部署中心</h4>
          <p className="text-xs text-indigo-100/70 max-w-md leading-relaxed">
            当前正在为机台 <span className="font-black underline">{activeMachineId}</span> 部署产品 <span className="font-black underline">{activeSku}</span>。
            系统将自动下发 3 个工位的模具绑定参数。
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
           <button className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/20 transition-all">
             导出配置清单
           </button>
           <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95 ${
              isPublishing 
                ? 'bg-indigo-900 text-indigo-300 cursor-not-allowed' 
                : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-white/10'
            }`}
           >
             {isPublishing ? (
               <>
                 <i className="fas fa-spinner animate-spin"></i>
                 正在同步边缘数据...
               </>
             ) : (
               <>
                 <i className="fas fa-bolt"></i>
                 立即发布全线配置
               </>
             )}
           </button>
        </div>
      </footer>
    </div>
  );
};

export default ProductionReadyList;
