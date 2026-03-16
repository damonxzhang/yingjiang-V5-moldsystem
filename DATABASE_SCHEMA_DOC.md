# SmartMold 模具管理系统 - 数据库设计说明书

本文档详细描述了 SmartMold 系统的数据库结构，包括表结构、字段定义、约束关系及业务含义。

## 1. 数据库概览
- **数据库类型**: SQL Server
- **数据库名称**: `moldsys`
- **字符集**: `NVARCHAR` (支持多语言/中文)
- **数据库表字段**: 全部以小写为了方便和接口返回数据能对应
---

## 2. 数据表详细说明

### 2.1 部门表 (Departments)
用于存储组织架构中的部门信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| DepartmentID | INT | PK, IDENTITY | 部门唯一标识 ID |
| DepartmentName | NVARCHAR(50) | NOT NULL, UNIQUE | 部门名称 (如：大材料、小材料等) |

---

### 2.2 角色表 (Roles)
定义系统中的用户角色。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| RoleCode | NVARCHAR(20) | PK | 角色代码 (唯一标识，如 SUPER_ADMIN) |
| Description | NVARCHAR(100) | - | 角色中文描述 (如：超级管理员) |

---

### 2.3 权限点表 (Permissions)
系统功能权限的最小粒度定义。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| PermissionCode | NVARCHAR(50) | PK | 权限唯一代码 |
| Description | NVARCHAR(100) | - | 权限功能描述 |

---

### 2.4 角色权限关联表 (RolePermissions)
角色与权限的多对多关联。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| RoleCode | NVARCHAR(20) | PK, FK (Roles) | 所属角色代码 |
| PermissionCode | NVARCHAR(50) | PK, FK (Permissions) | 拥有的权限代码 |

---

### 2.5 用户表 (Users)
存储系统用户信息及权限归属。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| UserID | INT | PK, IDENTITY | 用户唯一 ID |
| UserCode | NVARCHAR(50) | NOT NULL, UNIQUE | 工号/登录账号 |
| UserName | NVARCHAR(50) | NOT NULL | 用户真实姓名 |
| Password | NVARCHAR(100) | - | 登录密码 (加密存储) |
| CardNo | NVARCHAR(50) | UNIQUE | 员工卡号 (用于扫码登录/验证) |
| RoleCode | NVARCHAR(20) | FK (Roles) | 角色代码 |
| DepartmentID | INT | FK (Departments) | 所属部门 ID |
| Status | NVARCHAR(20) | DEFAULT 'ACTIVE' | 账号状态 (ACTIVE/DISABLED) |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 创建时间 |
| UpdatedAt | DATETIME | DEFAULT GETDATE() | 更新时间 |

---

### 2.6 设备机台表 (Machines)
记录生产现场的机台设备信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| MachineID | INT | PK, IDENTITY | 机台唯一 ID |
| MachineCode | NVARCHAR(50) | NOT NULL, UNIQUE | 机台编号 (物理标签编号) |
| Status | NVARCHAR(20) | DEFAULT 'NORMAL' | 机台状态 (NORMAL/MAINTENANCE/FAULT) |
| Location | NVARCHAR(100) | - | 物理位置 (如：A栋1F) |
| DepartmentID | INT | FK (Departments) | 归属部门 ID |
| TotalSlots | INT | DEFAULT 4 | 总槽位数 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 登记时间 |

---

### 2.7 模具主表 (Molds)
系统的核心表，存储模具全生命周期信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| MoldID | INT | PK, IDENTITY | 模具唯一内部 ID |
| MoldCode | NVARCHAR(50) | NOT NULL, UNIQUE | 模具编号 (业务主键) |
| Name | NVARCHAR(100) | - | 模具简称/名称 |
| FullName | NVARCHAR(200) | - | 模具完整名称 |
| ShortName | NVARCHAR(50) | - | 模具缩写 |
| Thickness | NVARCHAR(50) | - | 模具厚度规格 |
| MoldCategory | NVARCHAR(50) | - | 模具类别 |
| ProductType | NVARCHAR(50) | - | 产品类型 |
| PackageType | NVARCHAR(50) | - | 封装类型 |
| PinCode | NVARCHAR(50) | - | Pin码 |
| DepartmentID | INT | FK (Departments) | 所属部门 ID |
| LifeLimit | INT | DEFAULT 0 | 额定寿命 (次数) |
| CurrentShots | INT | DEFAULT 0 | 当前已使用次数 (啤数) |
| Status | NVARCHAR(20) | DEFAULT 'IDLE' | 状态 (IDLE/IN_USE/MAINTENANCE/SCRAP) |
| HealthScore | DECIMAL(5,2) | DEFAULT 100.00 | 健康评分 (0-100) |
| NextAuditDate | DATE | - | 下次点检日期 |
| Vendor | NVARCHAR(100) | - | 供应商 |
| CabinetCode | NVARCHAR(50) | - | 存放库柜编号 |
| Location | NVARCHAR(100) | - | 具体存放位置 |
| MaintenanceCycle | NVARCHAR(50) | - | 模具保养周期 (如：30天/50K) |
| MaintenanceStartTime | DATE | - | 开始保养时间 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 入库日期 |
| UpdatedAt | DATETIME | DEFAULT GETDATE() | 最后更新日期 |

---

### 2.8 机台槽位关联表 (MachineSlots)
记录模具在机台上的实时位置。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| MachineID | INT | PK, FK (Machines) | 机台 ID |
| Slot | NVARCHAR(10) | PK | 槽位编号 (如：1, 2, 3, 4) |
| MoldID | INT | FK (Molds) | 当前加载的模具 ID |
| Status | NVARCHAR(20) | DEFAULT 'NORMAL' | 槽位状态 |
| ParamReady | BIT | DEFAULT 0 | 参数设定是否就绪 |
| MoldReady | BIT | DEFAULT 0 | 模具安装是否就绪 |
| BuyoffReady | BIT | DEFAULT 0 | 首件点检是否就绪 |
| UpdatedAt | DATETIME | DEFAULT GETDATE() | 状态更新时间 |

---

### 2.9 模具 BOM 组件表 (MoldComponents)
模具的物料清单，记录模具内部的核心组件。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| ComponentID | INT | PK, IDENTITY | 组件唯一 ID |
| MoldID | INT | FK (Molds) | 所属模具 ID |
| Name | NVARCHAR(100) | NOT NULL | 组件名称 |
| SN | NVARCHAR(100) | - | 序列号/批次号 |
| Category | NVARCHAR(50) | - | 组件类别 |
| IsSpare | BIT | DEFAULT 0 | 是否为易损备件 (1:是, 0:否) |
| LifeLimit | INT | - | 组件额定寿命 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 登记时间 |

---

### 2.10 备件库存表 (SpareParts)
存储易损件的通用库存信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| SpareID | INT | PK, IDENTITY | 备件唯一 ID |
| SpareCode | NVARCHAR(50) | NOT NULL, UNIQUE | 备件编号 (物料号) |
| Name | NVARCHAR(100) | NOT NULL | 备件名称 |
| Spec | NVARCHAR(100) | - | 规格型号 |
| CurrentStock | INT | DEFAULT 0 | 当前库存量 |
| MinStock | INT | DEFAULT 0 | 安全库存阈值 |
| Unit | NVARCHAR(20) | - | 单位 (如：个, 件) |
| DepartmentID | INT | FK (Departments) | 管理部门 ID |
| Status | NVARCHAR(20) | DEFAULT 'NORMAL' | 备件状态 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 登记时间 |
| UpdatedAt | DATETIME | DEFAULT GETDATE() | 最后更新时间 |

---

### 2.11 模具备件绑定表 (MoldSpareBindings)
定义模具与通用备件的适用关系及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| MoldID | INT | PK, FK (Molds) | 模具 ID |
| SpareID | INT | PK, FK (SpareParts) | 备件 ID |
| Quantity | INT | DEFAULT 1 | 额定安装/备用数量 |

---

### 2.12 保养检查项配置 (MaintenanceItems)
针对模具保养业务预定义的标准检查项。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| ItemID | INT | PK, IDENTITY | 检查项 ID |
| Label | NVARCHAR(200) | NOT NULL | 检查项内容描述 (如：型腔清洁) |
| IsRequired | BIT | DEFAULT 1 | 是否必填 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 创建时间 |

---

### 2.13 维修故障项配置 (RepairItems)
针对模具维修业务预定义的常见故障及检查项。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| ItemID | INT | PK, IDENTITY | 检查项 ID |
| Label | NVARCHAR(200) | NOT NULL | 故障/检查项内容描述 (如：顶针断裂) |
| IsRequired | BIT | DEFAULT 1 | 是否必填 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 创建时间 |

---

### 2.14 保养工单表 (MaintenanceOrders)
记录模具的定期保养、预防性维护任务。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, IDENTITY | 工单 ID |
| OrderNo | NVARCHAR(50) | NOT NULL, UNIQUE | 保养单号 (如 PM-20260305001) |
| Priority | NVARCHAR(20) | DEFAULT 'MEDIUM' | 优先级 (LOW/MEDIUM/HIGH) |
| Status | NVARCHAR(20) | DEFAULT 'PENDING' | 状态 (PENDING/IN_PROGRESS/COMPLETED/AUDITED) |
| TaskSource | NVARCHAR(20) | DEFAULT 'MANUAL' | 任务来源 (SCHEDULED: 定时任务, MANUAL: 手工添加) |
| MaintenanceResult | NVARCHAR(50) | - | 保养结果 (OK/NG/WAIT) |
| BuyoffStatus | NVARCHAR(20) | DEFAULT 'NONE' | 验收状态 (NONE/PASSED/FAILED) |
| MoldID | INT | FK (Molds) | 关联模具 ID |
| CreatorID | INT | FK (Users) | 创建人 ID |
| ExecutorID | INT | FK (Users) | 执行人 ID |
| StartTime | DATETIME | - | 保养开始时间 |
| EndTime | DATETIME | - | 保养结束时间 |
| Remark | NVARCHAR(MAX) | - | 执行备注 |
| AuditUserID | INT | FK (Users) | 审核人 ID |
| AuditTime | DATETIME | - | 审核时间 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 创建时间 |

---

### 2.15 维修工单表 (RepairOrders)
记录模具的报修、紧急维修及故障处理任务。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, IDENTITY | 工单 ID |
| OrderNo | NVARCHAR(50) | NOT NULL, UNIQUE | 维修单号 (如 RE-20260305001) |
| Priority | NVARCHAR(20) | DEFAULT 'HIGH' | 优先级 (LOW/MEDIUM/HIGH/URGENT) |
| Status | NVARCHAR(20) | DEFAULT 'PENDING' | 状态 (PENDING/IN_PROGRESS/COMPLETED/AUDITED) |
| RepairCategory | NVARCHAR(50) | - | 维修类别 (小修/中修/大修/紧急) |
| RepairMethod | NVARCHAR(50) | - | 维修方式 (内部维修/外委维修/更换备件) |
| RootCause | NVARCHAR(MAX) | - | 故障根本原因 |
| MachineID | INT | FK (Machines) | 报修时的机台 ID |
| MoldID | INT | FK (Molds) | 关联模具 ID |
| FaultDescription | NVARCHAR(MAX) | - | 故障现象描述 |
| CreatorID | INT | FK (Users) | 报修人 ID |
| ExecutorID | INT | FK (Users) | 维修人 ID |
| StartTime | DATETIME | - | 维修开始时间 |
| EndTime | DATETIME | - | 维修结束时间 |
| Remark | NVARCHAR(MAX) | - | 维修执行备注 |
| AuditUserID | INT | FK (Users) | 审核人 ID |
| AuditTime | DATETIME | - | 审核时间 |
| BuyoffBy | INT | FK (Users) | 验收人 (QA或工程师) |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 创建时间 |

---

### 2.16 保养执行明细 (MaintenanceOrderDetails)
保养工单与保养项的勾选关联。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, FK (MaintenanceOrders) | 保养工单 ID |
| ItemID | INT | PK, FK (MaintenanceItems) | 保养项 ID |
| IsSelected | BIT | DEFAULT 0 | 是否已完成 |

---

### 2.17 维修执行明细 (RepairOrderDetails)
维修工单与故障/检查项的勾选关联。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, FK (RepairOrders) | 维修工单 ID |
| ItemID | INT | PK, FK (RepairItems) | 故障/检查项 ID |
| IsSelected | BIT | DEFAULT 0 | 是否已处理 |

---

### 2.18 保养备件消耗记录 (MaintenanceOrderSpares)
记录保养过程中消耗的备件及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, FK (MaintenanceOrders) | 保养工单 ID |
| SpareID | INT | PK, FK (SpareParts) | 备件 ID |
| Quantity | INT | DEFAULT 1 | 消耗数量 |

---

### 2.19 维修备件消耗记录 (RepairOrderSpares)
记录维修过程中消耗的备件及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| OrderID | INT | PK, FK (RepairOrders) | 维修工单 ID |
| SpareID | INT | PK, FK (SpareParts) | 备件 ID |
| Quantity | INT | DEFAULT 1 | 消耗数量 |

---

### 2.20 出入库记录 (StockRecords)
备件库存变更的流水日志。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| RecordID | INT | PK, IDENTITY | 记录 ID |
| SpareID | INT | FK (SpareParts) | 备件 ID |
| Type | NVARCHAR(20) | NOT NULL | 类型 (IN:入库 / OUT:出库 / ADJUST:调整) |
| Amount | INT | NOT NULL | 记录数量 |
| Remark | NVARCHAR(MAX) | - | 变更原因/备注 |
| UserID | INT | FK (Users) | 操作人 ID |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 操作时间 |

---

### 2.21 模具流转/生命周期日志 (MoldHistory)
记录模具在整个生命周期中的关键节点（上下机、状态变更等）。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| HistoryID | INT | PK, IDENTITY | 日志 ID |
| MoldID | INT | FK (Molds) | 模具 ID |
| Type | NVARCHAR(20) | NOT NULL | 记录类型 (MOUNT:上机 / UNMOUNT:下机 / STATUS_CHANGE:状态变更) |
| Description | NVARCHAR(MAX) | - | 事件详细描述 |
| OperatorID | INT | FK (Users) | 操作人 ID |
| MachineID | INT | - | 关联机台 ID |
| Slot | NVARCHAR(10) | - | 关联槽位 |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 发生时间 |

---

### 2.22 文件/图片上传记录 (Uploads)
系统内附件、模具照片、维修凭证等的统一管理。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| UploadID | INT | PK, IDENTITY | 上传记录 ID |
| URL | NVARCHAR(MAX) | NOT NULL | 文件存储路径或云端 URL |
| FileName | NVARCHAR(255) | - | 原始文件名 |
| UserID | INT | FK (Users) | 上传人 ID |
| SourceModule | NVARCHAR(50) | - | 来源模块 (如: WORK_ORDER, MOLD) |
| SourceID | NVARCHAR(50) | - | 来源业务 ID (如: 工单号, 模具号) |
| CreatedAt | DATETIME | DEFAULT GETDATE() | 上传时间 |
