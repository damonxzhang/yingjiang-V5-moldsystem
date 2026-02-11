
export enum Role {
  Admin = 'ADMIN',
  MoldEngineer = 'MOLD_ENGINEER',
  MaintenanceEngineer = 'MAINTENANCE_ENGINEER',
  Operator = 'OPERATOR',
  ProductionSupervisor = 'PROD_SUPERVISOR',
  WarehouseAdmin = 'WH_ADMIN'
}

export enum MoldStatus {
  Idle = 'IDLE',
  InUse = 'IN_USE',
  Maintenance = 'MAINTENANCE',
  Repair = 'REPAIR',
  PendingBuyoff = 'PENDING_BUYOFF',
  Scrapped = 'SCRAPPED'
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
}
