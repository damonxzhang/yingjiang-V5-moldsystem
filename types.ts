
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
  REPAIR_MANAGE = 'repair:manage',
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

  // 2026-03-05 新增字段
  maintenanceCycle?: string; // 模具保养周期
  maintenanceStartTime?: string; // 开始保养时间

  // 扩展模具组件结构 (BOM)
  components: MoldComponent[];
}

export interface WorkOrderSpare {
  id: string;
  name: string;
  quantity: number;
}

export interface BaseWorkOrder {
  id: string;
  moldId: string;
  status: string;
  operator: string;
  createdAt: string;
  confirmedAt?: string;
  description?: string;
  
  // 扩展 APP 执行过程数据
  actions?: string[]; 
  sparesUsed?: WorkOrderSpare[]; 
  machineStatusAfter?: 'RECOVERED' | 'DOWN'; 
  destination?: 'CABINET' | 'MACHINE'; 
  locationCode?: string; 
  photos?: string[]; 
}

export interface MaintenanceWorkOrder extends BaseWorkOrder {
  type: 'MAINTENANCE';
  taskSource?: 'SCHEDULED' | 'MANUAL'; // 任务来源：定时任务 或 手工添加
  maintenanceResult?: 'OK' | 'NG' | 'WAIT'; // 保养结果
  buyoffStatus?: 'NONE' | 'PASSED' | 'FAILED'; // 验收状态
}

export interface RepairWorkOrder extends BaseWorkOrder {
  type: 'REPAIR';
  faultDescription?: string;
  repairType?: 'NORMAL' | 'URGENT' | 'EXTERNAL';
  repairCategory?: string; // 维修类别 (小修/中修/大修/紧急)
  repairMethod?: string; // 维修方式 (内部维修/外委维修/更换备件)
  rootCause?: string; // 故障原因
  buyoffBy?: string; // 验收人
}

export interface InstallWorkOrder extends BaseWorkOrder {
  type: 'INSTALL';
}

export type WorkOrder = MaintenanceWorkOrder | RepairWorkOrder | InstallWorkOrder;

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

// 认证相关类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userid: string;
    username: string;
    role: Role;
    department?: string;
  };
}

export interface AuthData {
  token: string;
  userid: string;
  username: string;
  role: Role;
  department?: string;
  loginTime: string;
}
