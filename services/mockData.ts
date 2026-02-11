
import { Mold, MoldStatus, BuyoffStatus, SparePart, WorkOrder, MoldComponent } from '../types';

const generateComponents = (snPrefix: string): MoldComponent[] => [
  { category: '上模件', name: '上模盒', isSpare: false, sn: snPrefix, lifeLimit: 'N/A' },
  { category: '上模件', name: '上模cavity bar', isSpare: true, sn: snPrefix, lifeLimit: '1000K' },
  { category: '上模件', name: 'cull bar', isSpare: true, sn: snPrefix, lifeLimit: 'N/A' },
  { category: '下模件', name: '下模盒', isSpare: false, sn: snPrefix, lifeLimit: 'N/A' },
  { category: '下模件', name: '下模cavity bar', isSpare: true, sn: snPrefix, lifeLimit: '1000K' },
  { category: '下模件', name: 'pot', isSpare: true, sn: '直径15', lifeLimit: '40K/半年' },
  { category: 'Transfer件', name: 'plunger', isSpare: true, sn: '直径15', lifeLimit: '40K/半年' },
  { category: 'Transfer件', name: 'spring', isSpare: true, sn: snPrefix, lifeLimit: 'N/A' },
];

export const MOCK_MOLDS: Mold[] = [
  { 
    id: 'MD-2024-001', name: '精密 BGA 注塑模', type: '注塑模', vendor: 'I-PEX', 
    shotTotal: 45200, lifeLimit: 500000, status: MoldStatus.Idle, location: 'CAB-A01', 
    buyoffStatus: BuyoffStatus.Pass,
    serialNumber: '#1/6-100597', orderNumber: 'ORD-9921', cabNo: 'A123456', 
    packageType: 'QFN', packageSize: 'HD', packageThickness: '0.8', 
    substrateThickness: '0.3', pinCode: 'A',
    components: generateComponents('#1/6-100597')
  },
  { 
    id: 'MD-2024-002', name: '标准 BGA 模具', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 120500, lifeLimit: 300000, status: MoldStatus.InUse, location: 'MT-12', 
    machineId: 'MT-12', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'A0155110401', orderNumber: 'ORD-8812', cabNo: 'A321235', 
    packageType: 'BGA', packageSize: 'BIG', packageThickness: '0.7', 
    substrateThickness: '0.3', pinCode: 'B',
    components: generateComponents('A0155110401')
  },
  { 
    id: 'MD-2023-088', name: 'QFN 封装模组', type: '压铸模', vendor: 'TOWA', 
    shotTotal: 298000, lifeLimit: 300000, status: MoldStatus.Maintenance, location: 'CAB-B05', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'ATB-910-52192', orderNumber: 'ORD-7761', cabNo: 'A567894', 
    packageType: 'SOP', packageSize: 'STANDARD', packageThickness: '0.673', 
    substrateThickness: '5mil', pinCode: 'C',
    components: generateComponents('ATB-910-52192')
  },
  { 
    id: 'MD-2024-015', name: '大型 QFN 模具', type: '压铸模', vendor: 'TOWA', 
    shotTotal: 5000, lifeLimit: 400000, status: MoldStatus.Idle, location: 'MT-05', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'A0230290401', orderNumber: 'ORD-5541', cabNo: 'A765234', 
    packageType: 'QFP', packageSize: 'BIG', packageThickness: '0.673', 
    substrateThickness: '10mil', pinCode: 'D',
    components: generateComponents('A0230290401')
  },
  { 
    id: 'MD-2024-071', name: '高频 QFN 模具', type: '注塑模', vendor: 'I-PEX', 
    shotTotal: 485000, lifeLimit: 500000, status: MoldStatus.InUse, location: 'MT-08', 
    buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'BX-900-112', orderNumber: 'ORD-2231', cabNo: 'A8821', 
    packageType: 'QFN', packageSize: 'HD', packageThickness: '0.5', 
    substrateThickness: '0.2', pinCode: 'E',
    components: generateComponents('BX-900-112')
  },
  { 
    id: 'QF16', name: 'APP 演示专用模具 (QF16)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 150000, lifeLimit: 300000, status: MoldStatus.Idle, location: 'CAB-A05', 
    buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-QF16-演示', orderNumber: 'ORD-DEMO-01', cabNo: 'C001', 
    packageType: 'QFN', packageSize: 'SMALL', packageThickness: '0.5', 
    substrateThickness: '0.2', pinCode: 'F',
    components: generateComponents('SN-QF16-演示')
  },
  { 
    id: 'TY101', name: 'APP 演示专用模具 (TY101)', type: '压铸模', vendor: 'I-PEX', 
    shotTotal: 50000, lifeLimit: 200000, status: MoldStatus.InUse, location: 'MT-01', 
    machineId: 'MT-01', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-TY101-演示', orderNumber: 'ORD-DEMO-02', cabNo: 'C002', 
    packageType: 'BGA', packageSize: 'MEDIUM', packageThickness: '0.6', 
    substrateThickness: '0.3', pinCode: 'G',
    components: generateComponents('SN-TY101-演示')
  },
  { 
    id: 'TY71', name: 'APP 演示专用模具 (TY71)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 80000, lifeLimit: 150000, status: MoldStatus.Maintenance, location: 'CAB-B01', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'SN-TY71-演示', orderNumber: 'ORD-DEMO-03', cabNo: 'C003', 
    packageType: 'SOP', packageSize: 'STANDARD', packageThickness: '0.7', 
    substrateThickness: '0.4', pinCode: 'H',
    components: generateComponents('SN-TY71-演示')
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  // 保养记录 (MAINTENANCE) - 完整执行数据模拟
  { 
    id: 'WO-M-240501-01', 
    moldId: 'MD-2024-001', 
    type: 'MAINTENANCE', 
    status: 'COMPLETED', 
    operator: '张三', 
    createdAt: '2024-05-01 08:30', 
    confirmedAt: '2024-05-01 10:15', 
    description: '季度常规PM：型腔清洁与核心配合检查。',
    actions: ['模具化学清洁', '模具物理清洁'],
    sparesUsed: [],
    machineStatusAfter: 'RECOVERED',
    destination: 'CABINET',
    locationCode: 'CAB-B2-01'
  },
  { 
    id: 'WO-M-240505-02', 
    moldId: 'MD-2023-088', 
    type: 'MAINTENANCE', 
    status: 'COMPLETED', 
    operator: '李工', 
    createdAt: '2024-05-05 13:00', 
    confirmedAt: '2024-05-05 14:45', 
    description: '高频消耗部件预防性更换。',
    actions: ['模具深度清洁', '更换plunger密封圈', '更换pot&plunger'],
    sparesUsed: [
      { id: 'SP-SEAL-P', name: 'plunger 密封圈', quantity: 2 },
      { id: 'SP-POT-15', name: '精密 POT (15mm)', quantity: 1 }
    ],
    machineStatusAfter: 'DOWN',
    destination: 'MACHINE',
    locationCode: 'MC-201'
  },
  {
    id: 'WO-M-240520-03',
    moldId: 'MD-2024-001',
    type: 'MAINTENANCE',
    status: 'COMPLETED',
    operator: '孙工',
    createdAt: '2024-05-20 08:00',
    confirmedAt: '2024-05-20 09:30',
    description: '例行周保养。',
    actions: ['模具化学清洁', '涂防锈油'],
    sparesUsed: [],
    machineStatusAfter: 'RECOVERED',
    destination: 'CABINET',
    locationCode: 'CAB-B2-01'
  },
  // 维修记录 (REPAIR) - 模拟 APP 端的全链执行数据
  {
    id: 'WO-R-240510-01',
    moldId: 'MD-2024-071',
    type: 'REPAIR',
    status: 'COMPLETED',
    operator: '王技师',
    createdAt: '2024-05-10 09:00',
    confirmedAt: '2024-05-10 11:30',
    description: '温控异常告警：3号区加热棒失效。',
    actions: ['更换加热棒', '温控系统校准', '清理接线端子'],
    sparesUsed: [
      { id: 'SP-001', name: '加热棒 220V', quantity: 1 }
    ],
    machineStatusAfter: 'RECOVERED',
    destination: 'MACHINE',
    locationCode: 'MT-08'
  },
  {
    id: 'WO-R-240512-02',
    moldId: 'MD-2024-002',
    type: 'REPAIR',
    status: 'COMPLETED',
    operator: '赵工',
    createdAt: '2024-05-12 15:20',
    confirmedAt: '2024-05-12 17:45',
    description: '顶出不畅：5号顶杆弯曲变形。',
    actions: ['拆卸顶出板', '更换弯曲顶杆', '导柱润滑'],
    sparesUsed: [
      { id: 'SP-002', name: '顶杆 5mm', quantity: 1 }
    ],
    machineStatusAfter: 'DOWN',
    destination: 'CABINET',
    locationCode: 'CAB-A05'
  },
  {
    id: 'WO-R-240515-03',
    moldId: 'MD-2024-015',
    type: 'REPAIR',
    status: 'COMPLETED',
    operator: '陈工',
    createdAt: '2024-05-15 10:10',
    confirmedAt: '2024-05-15 12:00',
    description: '模面压伤：发现异物导致局部变形。',
    actions: ['模面精修', '抛光处理', '合模线检查'],
    sparesUsed: [],
    machineStatusAfter: 'RECOVERED',
    destination: 'MACHINE',
    locationCode: 'MT-05'
  },
  // 待办保养工单 (PENDING MAINTENANCE)
  {
    id: 'WO-M-20240209-01',
    moldId: 'QF16',
    type: 'MAINTENANCE',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 09:00',
    description: '例行周保养 - QF16',
  },
  {
    id: 'WO-M-20240209-02',
    moldId: 'MD-2024-001',
    type: 'MAINTENANCE',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 10:30',
    description: '季度常规 PM - MD-2024-001',
  },
  // 待办维修工单 (PENDING REPAIR)
  {
    id: 'WO-R-20240209-01',
    moldId: 'TY101',
    type: 'REPAIR',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 11:00',
    description: '顶针断裂修复 - TY101',
  },
  {
    id: 'WO-R-20240209-02',
    moldId: 'MD-2024-002',
    type: 'REPAIR',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 14:15',
    description: '加热棒故障 - MD-2024-002',
  }
];

export const MOCK_SPARES: SparePart[] = [
  { id: 'SP-001', name: '加热棒 220V', category: '电器件', stock: 15, minStock: 5 },
  { id: 'SP-002', name: '顶杆 5mm', category: '机械件', stock: 2, minStock: 10 },
];
