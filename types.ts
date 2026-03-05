
export enum Role {
  Admin = 'ADMIN',
  MoldEngineerBig = 'MOLD_ENGINEER_BIG',
  MoldEngineerSmall = 'MOLD_ENGINEER_SMALL',
  ShiftLeader = 'SHIFT_LEADER',
  Operator = 'OPERATOR'
}

// RBAC 权限定义
export enum Permission {
  // 看板与仪表盘
  DASHBOARD_VIEW = 'dashboard:view',
  MONITOR_SCREEN_VIEW = 'monitor:view',
  
  // 模具管理
  MOLD_VIEW = 'mold:view',
  MOLD_CREATE = 'mold:create',
  MOLD_EDIT = 'mold:edit',
  MOLD_DELETE = 'mold:delete',
  MOLD_AUDIT = 'mold:audit',
  
  // 备件管理
  SPARE_VIEW = 'spare:view',
  SPARE_MANAGE = 'spare:manage',
  SPARE_PREDICTION = 'spare:prediction',
  
  // 维保管理
  MAINTENANCE_MANAGE = 'maintenance:manage',
  MAINTENANCE_VIEW = 'maintenance:view',
  REPAIR_VIEW = 'repair:view',
  
  // 系统管理 (RBAC)
  USER_MANAGE = 'user:manage',
  ROLE_MANAGE = 'role:manage',
  PERMISSION_MANAGE = 'permission:manage',
  
  // 维保选项管理 (CRUD)
  MAINTENANCE_OPTION_MANAGE = 'maintenance_option:manage',
  REPAIR_OPTION_MANAGE = 'repair_option:manage'
}

export interface RolePermission {
  role: Role;
  permissions: Permission[];
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department?: string;
  avatar?: string;
  email?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

export enum MoldStatus {
  Idle = 'IDLE',
  InUse = 'IN_USE',
  Maintenance = 'MAINTENANCE',
  Repair = 'REPAIR',
  PendingBuyoff = 'PENDING_BUYOFF',
  Scrapped = 'SCRAPPED',
  Deactivated = 'DEACTIVATED'
}

export enum MaintenanceStatus {
  PendingApplication = 'PENDING_APP',
  PendingConfirmation = 'PENDING_CONFIRM',
  Confirmed = 'CONFIRMED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED'
}

export enum BuyoffStatus {
  NotInitiated = 'NOT_INITIATED',
  Processing = 'PROCESSING',
  Pass = 'PASS',
  Fail = 'FAIL',
  Exception = 'EXCEPTION'
}

export interface MoldComponent {
  category: '上模件' | '下模件' | 'Transfer件';
  name: string;
  isSpare: boolean;
  sn: string;
  lifeLimit: string; // 如 "1000K" 或 "40K/半年"
}

export interface Mold {
  id: string; // 模具编号
  name: string;
  type: string;
  vendor: string;
  shotTotal: number;
  lifeLimit: number;
  status: MoldStatus;
  location: string; // 位置
  machineId?: string;
  buyoffStatus: BuyoffStatus;
  
  // 扩展图片中的专业字段
  serialNumber: string; // 模具序列号
  orderNumber: string; // 订单号
  cabNo: string; // CAB 号
  packageType: string; // PACKAGE TYPE
  packageSize: string; // PACKAGE SIZE
  packageThickness: string; // PACKAGE THICKNESS
  substrateThickness: string; // SUBSTRATE THICKNESS
  pinCode: string; // PIN CODE

  // 2026-02-12 新增字段
  shortName?: string; // 模具简名
  thickness?: string; // 模具厚度
  moldCategory?: string; // 模具分类
  productType?: string; // 产品类型
  department?: '大材料' | '小材料'; // 所属部门

  // 扩展模具组件结构 (BOM)
  components: MoldComponent[];
}

export interface WorkOrderSpare {
  id: string;
  name: string;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  moldId: string;
  type: 'MAINTENANCE' | 'REPAIR' | 'INSTALL';
  status: string;
  operator: string;
  createdAt: string;
  confirmedAt?: string;
  description?: string;
  
  // 扩展 APP 执行过程数据
  actions?: string[]; // 执行的维修/保养动作项
  sparesUsed?: WorkOrderSpare[]; // 耗用备件
  machineStatusAfter?: 'RECOVERED' | 'DOWN'; // 设备后续判定：已还机/已停机
  destination?: 'CABINET' | 'MACHINE'; // 模具去向
  locationCode?: string; // 最终位置码（柜位号或机台号）
  photos?: string[]; // 现场照片 URL（模拟）
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  trackShots?: boolean; // 是否追踪冲次
  currentShots?: number; // 当前冲次
  maxShots?: number; // 冲次上限
  department?: '大材料' | '小材料'; // 所属部门
}
