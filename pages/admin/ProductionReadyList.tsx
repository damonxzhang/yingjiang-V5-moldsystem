
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_MOLDS } from '../../services/mockData';
import { MoldStatus, BuyoffStatus } from '../../types';

// 接口定义：层级化绑定
interface MoldSlot {
  id: string; // P1, P2, P3
  moldId: string;
  paramReady: boolean;
  moldReady: boolean;
  buyoffReady: boolean;
}

interface ProductConfiguration {
  sku: string;
  name: string;
  slots: MoldSlot[]; // 动态数量的工位，最多 4 个
}

interface MachineNode {
  id: string;
  name: string;
  availableProducts: ProductConfiguration[];
}

// 模拟多级数据 (包含 2, 3, 4 个工位的配置)
const MOCK_HIERARCHY: MachineNode[] = [
  {
    id: 'BMD-14',
    name: '1# 全自动封装线',
    availableProducts: [
      {
        sku: '5220',
        name: '高频通信模块',
        slots: [
          { id: 'P1', moldId: 'M-2024-001', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P2', moldId: 'M-2024-002', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P3', moldId: 'M-2024-003', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P4', moldId: 'M-2024-022', paramReady: true, moldReady: true, buyoffReady: true },
        ]
      },
      {
        sku: '00BN',
        name: '车规级控制器',
        slots: [
          { id: 'P1', moldId: 'M-2024-004', paramReady: true, moldReady: true, buyoffReady: false },
          { id: 'P2', moldId: 'M-2024-005', paramReady: false, moldReady: true, buyoffReady: false },
          { id: 'P3', moldId: 'M-2024-006', paramReady: true, moldReady: false, buyoffReady: false },
        ]
      },
      {
        sku: '00V0',
        name: '精密传感器',
        slots: [
          { id: 'P1', moldId: 'M-2024-007', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P2', moldId: 'M-2024-008', paramReady: true, moldReady: true, buyoffReady: true },
        ]
      },
      {
        sku: '5380',
        name: '功率管理单元',
        slots: [
          { id: 'P1', moldId: 'M-2024-010', paramReady: true, moldReady: true, buyoffReady: false },
          { id: 'P2', moldId: 'M-2024-011', paramReady: true, moldReady: true, buyoffReady: false },
          { id: 'P3', moldId: 'M-2024-012', paramReady: true, moldReady: true, buyoffReady: false },
          { id: 'P4', moldId: 'M-2024-023', paramReady: false, moldReady: true, buyoffReady: false },
        ]
      },
      {
        sku: '5365',
        name: '高速接口芯片',
        slots: [
          { id: 'P1', moldId: 'M-2024-013', paramReady: false, moldReady: false, buyoffReady: false },
          { id: 'P2', moldId: 'M-2024-014', paramReady: false, moldReady: false, buyoffReady: false },
          { id: 'P3', moldId: 'M-2024-015', paramReady: false, moldReady: false, buyoffReady: false },
        ]
      }
    ]
  },
  {
    id: 'BMD-15',
    name: '2# 高速冲压线',
    availableProducts: [
      {
        sku: '5220',
        name: '高频通信模块',
        slots: [
          { id: 'P1', moldId: 'M-2024-016', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P2', moldId: 'M-2024-017', paramReady: true, moldReady: true, buyoffReady: true },
          { id: 'P3', moldId: 'M-2024-018', paramReady: true, moldReady: true, buyoffReady: true },
        ]
      }
    ]
  },
  {
    id: 'BMD-16',
    name: '3# 备用线',
    availableProducts: [
      {
        sku: '00BN',
        name: '车规级控制器',
        slots: [
          { id: 'P1', moldId: 'M-2024-019', paramReady: false, moldReady: false, buyoffReady: false },
          { id: 'P2', moldId: 'M-2024-020', paramReady: false, moldReady: false, buyoffReady: false },
          { id: 'P3', moldId: 'M-2024-021', paramReady: false, moldReady: false, buyoffReady: false },
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

  // 计算当前显示的产品中最大的工位数量
  const maxSlotsCount = useMemo(() => {
    return Math.max(...currentMachine.availableProducts.map(p => p.slots.length), 0);
  }, [currentMachine]);

  const slotHeaders = useMemo(() => {
    const headers = [];
    for (let i = 1; i <= maxSlotsCount; i++) {
      headers.push(`P${i}`);
    }
    return headers;
  }, [maxSlotsCount]);

  // 切换参数就绪状态
  const toggleParam = (machineId: string, sku: string, slotId: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      return {
        ...m,
        availableProducts: m.availableProducts.map(p => {
          if (p.sku !== sku) return p;
          return {
            ...p,
            slots: p.slots.map(s => {
              if (s.id !== slotId) return s;
              return { ...s, paramReady: !s.paramReady };
            })
          };
        })
      };
    }));
  };

  // 切换模具状态
  const toggleMoldStatus = (machineId: string, sku: string, slotId: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      return {
        ...m,
        availableProducts: m.availableProducts.map(p => {
          if (p.sku !== sku) return p;
          return {
            ...p,
            slots: p.slots.map(s => {
              if (s.id !== slotId) return s;
              return { ...s, moldReady: !s.moldReady };
            })
          };
        })
      };
    }));
  };

  // 切换 Buyoff 状态
  const toggleBuyoffStatus = (machineId: string, sku: string, slotId: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      return {
        ...m,
        availableProducts: m.availableProducts.map(p => {
          if (p.sku !== sku) return p;
          return {
            ...p,
            slots: p.slots.map(s => {
              if (s.id !== slotId) return s;
              return { ...s, buyoffReady: !s.buyoffReady };
            })
          };
        })
      };
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

      {/* 新增：产品状态矩阵表格 */}
      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th colSpan={1 + (maxSlotsCount * 3)} className="py-4 text-base font-black text-white uppercase tracking-[0.2em]">
                  {currentMachine.id} (机号)
                </th>
              </tr>
              <tr className="bg-slate-100/50 border-b border-slate-200">
                <th className="py-2 px-4 border-r border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[120px]">产品</th>
                {slotHeaders.map((header, idx) => (
                  <th key={header} colSpan={3} className={`py-2 px-4 ${idx < slotHeaders.length - 1 ? 'border-r border-slate-200' : ''} text-[10px] font-black text-slate-500 uppercase tracking-widest`}>
                    {header} (模台号)
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-2 px-4 border-r border-slate-200"></th>
                {slotHeaders.map((p, idx) => (
                  <React.Fragment key={p}>
                    <th className="py-2 px-1 text-[9px] font-black text-slate-400 border-r border-slate-100">参数状态</th>
                    <th className="py-2 px-1 text-[9px] font-black text-slate-400 border-r border-slate-100">模具状态</th>
                    <th className={`py-2 px-1 text-[9px] font-black text-slate-400 ${idx < slotHeaders.length - 1 ? 'border-r border-slate-200' : ''}`}>BUYOFF</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMachine.availableProducts.map((product) => (
                <tr 
                  key={product.sku} 
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${activeSku === product.sku ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => setActiveSku(product.sku)}
                >
                  <td className="py-3 px-4 border-r border-slate-200 font-black text-slate-700 text-sm">
                    {product.sku}
                  </td>
                  {/* 根据 maxSlotsCount 渲染列，如果产品没有该 slot 则显示空 */}
                  {Array.from({ length: maxSlotsCount }).map((_, idx) => {
                    const slotId = `P${idx + 1}`;
                    const slot = product.slots.find(s => s.id === slotId);
                    
                    if (!slot) {
                      return (
                        <React.Fragment key={slotId}>
                          <td className="py-3 px-1 bg-slate-50/30 border-r border-slate-200"></td>
                          <td className="py-3 px-1 bg-slate-50/30 border-r border-slate-200"></td>
                          <td className={`py-3 px-1 bg-slate-50/30 ${idx < maxSlotsCount - 1 ? 'border-r border-slate-200' : ''}`}></td>
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={slotId}>
                        {/* 参数就绪状态 */}
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleParam(currentMachine.id, product.sku, slot.id);
                          }}
                          className={`py-3 px-1 text-center border-r border-slate-200 font-black text-sm transition-all cursor-pointer hover:opacity-80 ${slot.paramReady ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                          {slot.paramReady ? 'V' : 'X'}
                        </td>
                        {/* 模具就绪状态 */}
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMoldStatus(currentMachine.id, product.sku, slot.id);
                          }}
                          className={`py-3 px-1 text-center border-r border-slate-200 font-black text-sm transition-all cursor-pointer hover:opacity-80 ${slot.moldReady ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                          {slot.moldReady ? 'V' : 'X'}
                        </td>
                        {/* Buyoff 就绪状态 */}
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBuyoffStatus(currentMachine.id, product.sku, slot.id);
                          }}
                          className={`py-3 px-1 text-center font-black text-sm transition-all cursor-pointer hover:opacity-80 ${idx < maxSlotsCount - 1 ? 'border-r border-slate-200' : ''} ${slot.buyoffReady ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                          {slot.buyoffReady ? 'V' : 'X'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 详情卡片：模具槽位配置 */}
      <section className={`grid grid-cols-1 ${
        currentConfig.slots.length === 4 ? 'md:grid-cols-4' : 
        currentConfig.slots.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
      } gap-6`}>
        {currentConfig.slots.map(slot => (
          <div key={slot.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden group hover:border-indigo-200 transition-all">
            {/* 卡片内容保持不变 */}
            <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
              <i className="fas fa-microchip text-7xl"></i>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-200">
                    {slot.id}
                  </span>
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Station Slot</h5>
                    <p className="text-sm font-black text-slate-900">生产工位 {slot.id}</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-2">MOLD ID:</span>
                  <span className="text-[11px] font-black text-indigo-600">{slot.moldId}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => toggleParam(activeMachineId, activeSku, slot.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      slot.paramReady 
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                        : 'bg-red-50 border-red-200 text-red-700 shadow-sm opacity-60 hover:opacity-100'
                    } hover:scale-105 active:scale-95`}
                  >
                    <i className={`fas ${slot.paramReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">参数状态</span>
                  </button>

                  <button 
                    onClick={() => toggleMoldStatus(activeMachineId, activeSku, slot.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      slot.moldReady 
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                        : 'bg-red-50 border-red-200 text-red-700 shadow-sm opacity-60 hover:opacity-100'
                    } hover:scale-105 active:scale-95`}
                  >
                    <i className={`fas ${slot.moldReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">模具状态</span>
                  </button>

                  <button 
                    onClick={() => toggleBuyoffStatus(activeMachineId, activeSku, slot.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      slot.buyoffReady 
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                        : 'bg-red-50 border-red-200 text-red-700 shadow-sm opacity-60 hover:opacity-100'
                    } hover:scale-105 active:scale-95`}
                  >
                    <i className={`fas ${slot.buyoffReady ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Buyoff状态</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ProductionReadyList;
