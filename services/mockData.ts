
import { Mold, MoldStatus, BuyoffStatus, SparePart, WorkOrder, MoldComponent, Role, Permission, RolePermission, User } from '../types';

// RBAC 模拟数据
export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: Role.Admin,
    description: '系统管理员，拥有所有操作权限',
    permissions: Object.values(Permission)
  },
  {
    role: Role.MoldEngineerBig,
    description: '负责大材料模具全生命周期管理、BOM 维护及分析',
    permissions: [
      Permission.DASHBOARD_VIEW, Permission.MONITOR_SCREEN_VIEW,
      Permission.MOLD_VIEW, Permission.MOLD_CREATE, Permission.MOLD_EDIT, Permission.MOLD_AUDIT,
      Permission.SPARE_VIEW, Permission.MAINTENANCE_MANAGE, Permission.MAINTENANCE_VIEW, Permission.REPAIR_MANAGE, Permission.REPAIR_VIEW,
      Permission.MAINTENANCE_OPTION_MANAGE, Permission.REPAIR_OPTION_MANAGE
    ]
  },
  {
    role: Role.MoldEngineerSmall,
    description: '负责小材料模具全生命周期管理、BOM 维护及分析',
    permissions: [
      Permission.DASHBOARD_VIEW, Permission.MONITOR_SCREEN_VIEW,
      Permission.MOLD_VIEW, Permission.MOLD_CREATE, Permission.MOLD_EDIT, Permission.MOLD_AUDIT,
      Permission.SPARE_VIEW, Permission.MAINTENANCE_MANAGE, Permission.MAINTENANCE_VIEW, Permission.REPAIR_MANAGE, Permission.REPAIR_VIEW,
      Permission.MAINTENANCE_OPTION_MANAGE, Permission.REPAIR_OPTION_MANAGE
    ]
  },
  {
    role: Role.ShiftLeader,
    description: '带班组长，负责现场协调与任务中心管理',
    permissions: [
      Permission.MONITOR_SCREEN_VIEW, Permission.MOLD_VIEW,
      Permission.MAINTENANCE_MANAGE, Permission.REPAIR_MANAGE, Permission.MAINTENANCE_VIEW, Permission.REPAIR_VIEW,
      Permission.SPARE_VIEW
    ]
  },
  {
    role: Role.Operator,
    description: '现场操作员，负责上线前检查及状态反馈',
    permissions: [
      Permission.MONITOR_SCREEN_VIEW, Permission.MOLD_VIEW
    ]
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'U-001',
    username: 'admin_damon',
    name: '张经理 (Damon)',
    role: Role.Admin,
    department: '数字化中心',
    email: 'zhx703@163.com',
    lastLogin: '2026-02-25 10:30',
    status: 'active'
  },
  {
    id: 'U-002',
    username: 'mold_eng_big_01',
    name: '李工 (大材料)',
    role: Role.MoldEngineerBig,
    department: '大材料事业部',
    lastLogin: '2026-02-25 09:15',
    status: 'active'
  },
  {
    id: 'U-003',
    username: 'mold_eng_small_01',
    name: '陈工 (小材料)',
    role: Role.MoldEngineerSmall,
    department: '小材料事业部',
    lastLogin: '2026-02-24 16:20',
    status: 'active'
  },
  {
    id: 'U-004',
    username: 'shift_leader_01',
    name: '王带班',
    role: Role.ShiftLeader,
    department: '生产现场',
    lastLogin: '2026-02-25 08:00',
    status: 'active'
  },
  {
    id: 'U-005',
    username: 'operator_01',
    name: '张操作',
    role: Role.Operator,
    department: '生产现场',
    lastLogin: '2026-02-24 20:00',
    status: 'active'
  }
];

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
    shortName: 'BGA-01', thickness: '250mm', moldCategory: '大材料模具', productType: 'BGA', department: '大材料',
    maintenanceCycle: '30天', maintenanceStartTime: '2026-01-01',
    components: generateComponents('#1/6-100597')
  },
  { 
    id: 'MD-2024-002', name: '标准 BGA 模具', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 120500, lifeLimit: 300000, status: MoldStatus.InUse, location: 'MT-12', 
    machineId: 'MT-12', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'A0155110401', orderNumber: 'ORD-8812', cabNo: 'A321235', 
    packageType: 'BGA', packageSize: 'BIG', packageThickness: '0.7', 
    substrateThickness: '0.3', pinCode: 'B',
    shortName: 'BGA-STD', thickness: '220mm', moldCategory: '小材料模具', productType: 'BGA', department: '小材料',
    maintenanceCycle: '10000冲次', maintenanceStartTime: '2026-02-15',
    components: generateComponents('A0155110401')
  },
  { 
    id: 'MD-2023-088', name: 'QFN 封装模组', type: '压铸模', vendor: 'TOWA', 
    shotTotal: 298000, lifeLimit: 300000, status: MoldStatus.Maintenance, location: 'CAB-B05', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'ATB-910-52192', orderNumber: 'ORD-7761', cabNo: 'A567894', 
    packageType: 'SOP', packageSize: 'STANDARD', packageThickness: '0.673', 
    substrateThickness: '5mil', pinCode: 'C',
    shortName: 'QFN-88', thickness: '180mm', moldCategory: '大材料模具', productType: 'QFN', department: '大材料',
    components: generateComponents('ATB-910-52192')
  },
  { 
    id: 'MD-2024-015', name: '大型 QFN 模具', type: '压铸模', vendor: 'TOWA', 
    shotTotal: 5000, lifeLimit: 400000, status: MoldStatus.Idle, location: 'MT-05', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'A0230290401', orderNumber: 'ORD-5541', cabNo: 'A765234', 
    packageType: 'QFP', packageSize: 'BIG', packageThickness: '0.673', 
    substrateThickness: '10mil', pinCode: 'D',
    shortName: 'QFN-BIG', thickness: '300mm', moldCategory: '小材料模具', productType: 'QFN', department: '小材料',
    components: generateComponents('A0230290401')
  },
  { 
    id: 'MD-2024-071', name: '高频 QFN 模具', type: '注塑模', vendor: 'I-PEX', 
    shotTotal: 485000, lifeLimit: 500000, status: MoldStatus.InUse, location: 'MT-08', 
    buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'BX-900-112', orderNumber: 'ORD-2231', cabNo: 'A8821', 
    packageType: 'QFN', packageSize: 'HD', packageThickness: '0.5', 
    substrateThickness: '0.2', pinCode: 'E',
    shortName: 'QFN-HF', thickness: '150mm', moldCategory: '大材料模具', productType: 'QFN', department: '大材料',
    components: generateComponents('BX-900-112')
  },
  { 
    id: 'QF16', name: 'APP 演示专用模具 (QF16)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 150000, lifeLimit: 300000, status: MoldStatus.Idle, location: 'CAB-A05', 
    buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-QF16-演示', orderNumber: 'ORD-DEMO-01', cabNo: 'C001', 
    packageType: 'QFN', packageSize: 'SMALL', packageThickness: '0.5', 
    substrateThickness: '0.2', pinCode: 'F',
    shortName: 'DEMO-QF16', thickness: '120mm', moldCategory: '小材料模具', productType: 'QFN', department: '小材料',
    components: generateComponents('SN-QF16-演示')
  },
  { 
    id: 'TY101', name: 'APP 演示专用模具 (TY101)', type: '压铸模', vendor: 'I-PEX', 
    shotTotal: 50000, lifeLimit: 200000, status: MoldStatus.InUse, location: 'MT-01', 
    machineId: 'MT-01', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-TY101-演示', orderNumber: 'ORD-DEMO-02', cabNo: 'C002', 
    packageType: 'BGA', packageSize: 'MEDIUM', packageThickness: '0.6', 
    substrateThickness: '0.3', pinCode: 'G',
    shortName: 'DEMO-TY101', thickness: '200mm', moldCategory: '大材料模具', productType: 'BGA', department: '大材料',
    components: generateComponents('SN-TY101-演示')
  },
  { 
    id: 'TY71', name: 'APP 演示专用模具 (TY71)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 80000, lifeLimit: 150000, status: MoldStatus.Maintenance, location: 'CAB-B01', 
    buyoffStatus: BuyoffStatus.NotInitiated,
    serialNumber: 'SN-TY71-演示', orderNumber: 'ORD-DEMO-03', cabNo: 'C003', 
    packageType: 'SOP', packageSize: 'STANDARD', packageThickness: '0.7', 
    substrateThickness: '0.4', pinCode: 'H',
    shortName: 'DEMO-TY71', thickness: '160mm', moldCategory: '小材料模具', productType: 'SOP', department: '小材料',
    components: generateComponents('SN-TY71-演示')
  },
  { 
    id: 'TY06', name: 'APP 演示专用模具 (TY06)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 60000, lifeLimit: 300000, status: MoldStatus.InUse, location: 'BMD-01', 
    machineId: 'BMD-01', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-TY06-演示', orderNumber: 'ORD-DEMO-04', cabNo: 'C004', 
    packageType: 'QFN', packageSize: 'SMALL', packageThickness: '0.5', 
    substrateThickness: '0.2', pinCode: 'F',
    shortName: 'DEMO-TY06', thickness: '120mm', moldCategory: '小材料模具', productType: 'QFN', department: '小材料',
    components: generateComponents('SN-TY06-演示')
  },
  { 
    id: 'TY12', name: 'APP 演示专用模具 (TY12)', type: '压铸模', vendor: 'I-PEX', 
    shotTotal: 85000, lifeLimit: 200000, status: MoldStatus.InUse, location: 'BMD-01', 
    machineId: 'BMD-01', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-TY12-演示', orderNumber: 'ORD-DEMO-05', cabNo: 'C005', 
    packageType: 'BGA', packageSize: 'MEDIUM', packageThickness: '0.6', 
    substrateThickness: '0.3', pinCode: 'G',
    shortName: 'DEMO-TY12', thickness: '200mm', moldCategory: '大材料模具', productType: 'BGA', department: '大材料',
    components: generateComponents('SN-TY12-演示')
  },
  { 
    id: 'TY02', name: 'APP 演示专用模具 (TY02)', type: '注塑模', vendor: 'TOWA', 
    shotTotal: 72000, lifeLimit: 250000, status: MoldStatus.InUse, location: 'BMD-01', 
    machineId: 'BMD-01', buyoffStatus: BuyoffStatus.Pass,
    serialNumber: 'SN-TY02-演示', orderNumber: 'ORD-DEMO-06', cabNo: 'C006', 
    packageType: 'SOP', packageSize: 'STANDARD', packageThickness: '0.7', 
    substrateThickness: '0.4', pinCode: 'H',
    shortName: 'DEMO-TY02', thickness: '160mm', moldCategory: '小材料模具', productType: 'SOP', department: '小材料',
    components: generateComponents('SN-TY02-演示')
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
    taskSource: 'SCHEDULED',
    maintenanceResult: 'OK',
    buyoffStatus: 'PASSED',
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
    taskSource: 'MANUAL',
    maintenanceResult: 'OK',
    buyoffStatus: 'PASSED',
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
    taskSource: 'SCHEDULED',
    maintenanceResult: 'OK',
    buyoffStatus: 'PASSED',
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
    faultDescription: '温控异常告警：3号区加热棒失效。',
    repairType: 'NORMAL',
    repairCategory: '小修',
    repairMethod: '内部维修',
    rootCause: '加热棒自然老化',
    buyoffBy: '李工',
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
    faultDescription: '顶出不畅：5号顶杆弯曲变形。',
    repairType: 'URGENT',
    repairCategory: '中修',
    repairMethod: '内部维修',
    rootCause: '顶出板润滑不足',
    buyoffBy: '陈工',
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
    faultDescription: '模面压伤：发现异物导致局部变形。',
    repairType: 'NORMAL',
    repairCategory: '大修',
    repairMethod: '外委维修',
    rootCause: '合模压力异常',
    buyoffBy: '张经理',
    actions: ['模面精修', '抛光处理', '合模线检查'],
    sparesUsed: [],
    machineStatusAfter: 'RECOVERED',
    destination: 'MACHINE',
    locationCode: 'MT-05'
  },
  // 待办保养工单 (PENDING MAINTENANCE)
  {
    id: 'WO-M-20240209-01',
    moldId: 'TY06',
    type: 'MAINTENANCE',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 09:00',
    description: '例行周保养 - TY06',
  },
  {
    id: 'WO-M-20240209-02',
    moldId: 'TY12',
    type: 'MAINTENANCE',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 10:30',
    description: '季度常规 PM - TY12',
  },
  {
    id: 'WO-M-20240209-03',
    moldId: 'TY02',
    type: 'MAINTENANCE',
    status: 'PENDING',
    operator: '-',
    createdAt: '2024-02-09 14:00',
    description: '月度保养 - TY02',
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
  { id: 'SP-001', name: '加热棒 220V', category: '电气件', stock: 15, minStock: 5, department: '大材料' },
  { id: 'SP-002', name: '顶杆 5mm', category: '机械件', stock: 8, minStock: 10, department: '小材料' },
  { id: 'SP-003', name: '精密 POT (15mm)', category: 'Transfer件', stock: 2, minStock: 5, department: '大材料' },
  { id: 'SP-SEAL-P', name: 'plunger 密封圈', category: '密封件', stock: 50, minStock: 20, department: '小材料' },
];

// 保养选项 (Maintenance Options)
export const MOCK_MAINTENANCE_OPTIONS = [
  { id: 'MO-001', name: '清洁模腔', category: '半年保养项目', description: '使用专用清洁剂清理模腔残留' },
  { id: 'MO-002', name: '润滑导柱', category: '半年保养项目', description: '对导柱和导套进行油脂润滑' },
  { id: 'MO-003', name: '检查加热棒', category: '电气保养', description: '测量加热棒阻值是否正常' },
  { id: 'MO-004', name: '紧固螺栓', category: '机械保养', description: '检查并紧固模具外部紧固螺栓' },
];

// 维修选项 (Repair Options)
export const MOCK_REPAIR_OPTIONS = [
  { id: 'RO-001', name: '更换加热棒', category: '电气故障', description: '拆卸并安装新的加热棒' },
  { id: 'RO-002', name: '修补模面', category: '模面损伤', description: '对压伤或划伤处进行烧焊或研磨' },
  { id: 'RO-003', name: '更换顶针', category: '顶出故障', description: '更换弯曲或断裂的顶针' },
  { id: 'RO-004', name: '清理异物', category: '合模异常', description: '清除模具内部卡住的废料或异物' },
];

// 机台模拟数据
export const MOCK_MACHINES = [
  { id: 'MACH-001', name: '注塑机 A-01', type: '注塑机', status: 'RUNNING', location: '车间A-01', department: '大材料' },
  { id: 'MACH-002', name: '注塑机 A-02', type: '注塑机', status: 'RUNNING', location: '车间A-02', department: '大材料' },
  { id: 'MACH-003', name: '注塑机 B-01', type: '注塑机', status: 'STOPPED', location: '车间B-01', department: '小材料' },
  { id: 'MACH-004', name: '注塑机 B-02', type: '注塑机', status: 'MAINTENANCE', location: '车间B-02', department: '小材料' },
  { id: 'MACH-005', name: '压铸机 C-01', type: '压铸机', status: 'RUNNING', location: '车间C-01', department: '大材料' },
  { id: 'MACH-006', name: '压铸机 C-02', type: '压铸机', status: 'RUNNING', location: '车间C-02', department: '小材料' },
];

