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
| department_id | INT | PK, IDENTITY | 部门唯一标识 ID |
| department_name | NVARCHAR(50) | NOT NULL, UNIQUE | 部门名称 (如：大材料、小材料等) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.2 角色表 (Roles)
定义系统中的用户角色.

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| role_code | NVARCHAR(20) | PK | 角色代码 (唯一标识，如 SUPER_ADMIN) |
| description | NVARCHAR(100) | - | 角色中文描述 (如：超级管理员) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.3 权限点表 (Permissions)
系统功能权限的最小粒度定义。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| permission_code | NVARCHAR(50) | PK | 权限唯一代码 |
| description | NVARCHAR(100) | - | 权限功能描述 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.4 角色权限关联表 (RolePermissions)
角色与权限的多对多关联。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| role_code | NVARCHAR(20) | PK, FK (Roles) | 所属角色代码 |
| permission_code | NVARCHAR(50) | PK, FK (Permissions) | 拥有的权限代码 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.5 用户表 (Users)
存储系统用户信息及权限归属。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| user_id | INT | PK, IDENTITY | 用户唯一 ID |
| user_code | NVARCHAR(50) | NOT NULL, UNIQUE | 工号/登录账号 |
| user_name | NVARCHAR(50) | NOT NULL | 用户真实姓名 |
| password | NVARCHAR(100) | - | 登录密码 (加密存储) |
| card_no | NVARCHAR(50) | UNIQUE | 员工卡号 (用于扫码登录/验证) |
| role_code | NVARCHAR(20) | FK (Roles) | 角色代码 |
| department_id | INT | FK (Departments) | 所属部门 ID |
| status | NVARCHAR(20) | DEFAULT 'ACTIVE' | 账号状态 (ACTIVE/DISABLED) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.6 设备机台表 (Machines)
记录生产现场的机台设备信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| machine_id | INT | PK, IDENTITY | 机台唯一 ID |
| machine_code | NVARCHAR(50) | NOT NULL, UNIQUE | 机台编号 (物理标签编号) |
| status | NVARCHAR(20) | DEFAULT 'NORMAL' | 机台状态 (NORMAL/MAINTENANCE/FAULT) |
| location | NVARCHAR(100) | - | 物理位置 (如：A栋1F) |
| department_id | INT | FK (Departments) | 归属部门 ID |
| total_slots | INT | DEFAULT 4 | 总槽位数 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.7 模具主表 (Molds)
系统的核心表，存储模具全生命周期信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| mold_id | INT | PK, IDENTITY | 模具唯一内部 ID |
| mold_code | NVARCHAR(50) | NOT NULL, UNIQUE | 模具编号 (业务主键) |
| name | NVARCHAR(100) | - | 模具名称 |
| full_name | NVARCHAR(200) | - | 模具完整名称 |
| short_name | NVARCHAR(50) | - | 模具缩写 |
| thickness | NVARCHAR(50) | - | 模具厚度规格 |
| mold_category | NVARCHAR(50) | - | 模具类别 |
| product_type | NVARCHAR(50) | - | 产品类型 |
| package_type | NVARCHAR(50) | - | 封装类型 |
| package_size | NVARCHAR(50) | - | 封装尺寸 (HD/SD 等) |
| pin_code | NVARCHAR(50) | - | Pin码 |
| department_id | INT | FK (Departments) | 所属部门 ID |
| life_limit | INT | DEFAULT 0 | 额定寿命 (次数) |
| current_shots | INT | DEFAULT 0 | 当前已使用次数 (啤数) |
| status | NVARCHAR(20) | DEFAULT 'IDLE' | 状态 (IDLE/IN_USE/MAINTENANCE/SCRAP) |
| health_score | DECIMAL(5,2) | DEFAULT 100.00 | 健康评分 (0-100) |
| next_audit_date | DATE | - | 下次点检日期 |
| vendor | NVARCHAR(100) | - | 供应商 |
| cabinet_code | NVARCHAR(50) | - | 存放库柜编号 |
| location | NVARCHAR(100) | - | 具体存放位置 |
| maintenance_cycle | NVARCHAR(50) | - | 模具保养周期 (如：30天/50K) |
| start_time | DATE | - | 开始保养时间 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.8 机台槽位关联表 (MachineSlots)
记录模具在机台上的实时位置。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| machine_id | INT | PK, FK (Machines) | 机台 ID |
| slot | NVARCHAR(10) | PK | 槽位编号 (如：1, 2, 3, 4) |
| mold_id | INT | FK (Molds) | 当前加载的模具 ID |
| status | NVARCHAR(20) | DEFAULT 'NORMAL' | 槽位状态 |
| param_ready | BIT | DEFAULT 0 | 参数设定是否就绪 |
| mold_ready | BIT | DEFAULT 0 | 模具安装是否就绪 |
| buyoff_ready | BIT | DEFAULT 0 | 首件点检是否就绪 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.9 模具 BOM 组件表 (MoldComponents)
模具的物料清单，记录模具内部的核心组件。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| component_id | INT | PK, IDENTITY | 组件唯一 ID |
| mold_id | INT | FK (Molds) | 所属模具 ID |
| name | NVARCHAR(100) | NOT NULL | 组件名称 |
| sn | NVARCHAR(100) | - | 序列号/批次号 |
| category | NVARCHAR(50) | - | 组件类别 |
| is_spare | BIT | DEFAULT 0 | 是否为易损备件 (1:是, 0:否) |
| life_limit | INT | - | 组件额定寿命 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.10 备件库存表 (SpareParts)
存储易损件的通用库存信息。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| spare_id | INT | PK, IDENTITY | 备件唯一 ID |
| spare_code | NVARCHAR(50) | NOT NULL, UNIQUE | 备件编号 (物料号) |
| name | NVARCHAR(100) | NOT NULL | 备件名称 |
| category | NVARCHAR(50) | - | 备件分类 (电气件, Transfer件等) |
| spec | NVARCHAR(100) | - | 规格型号 |
| current_stock | INT | DEFAULT 0 | 当前库存量 |
| min_stock | INT | DEFAULT 0 | 安全库存阈值 |
| unit | NVARCHAR(20) | - | 单位 (如：个, 件) |
| is_track_shots | BIT | DEFAULT 0 | 是否单独计算 shot count (1:是, 0:否) |
| department_id | INT | FK (Departments) | 管理部门 ID |
| status | NVARCHAR(20) | DEFAULT 'NORMAL' | 备件状态 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.11 模具备件绑定表 (MoldSpareBindings)
定义模具与通用备件的适用关系及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| mold_id | INT | PK, FK (Molds) | 模具 ID |
| spare_id | INT | PK, FK (SpareParts) | 备件 ID |
| quantity | INT | DEFAULT 1 | 额定安装/备用数量 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.12 保养检查项配置 (MaintenanceItems)
针对模具保养业务预定义的标准检查项。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| item_id | INT | PK, IDENTITY | 检查项 ID |
| label | NVARCHAR(200) | NOT NULL | 检查项内容描述 (如：型腔清洁) |
| department_id | INT | FK (Departments) | 所属部门 (用于区分大材料/小材料配置) |
| is_required | BIT | DEFAULT 1 | 是否必填 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.13 维修故障项配置 (RepairItems)
针对模具维修业务预定义的常见故障及检查项。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| item_id | INT | PK, IDENTITY | 检查项 ID |
| label | NVARCHAR(200) | NOT NULL | 故障/检查项内容描述 (如：顶针断裂) |
| department_id | INT | FK (Departments) | 所属部门 (用于区分大材料/小材料配置) |
| is_required | BIT | DEFAULT 1 | 是否必填 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.14 保养工单表 (MaintenanceOrders)
记录模具的定期保养、预防性维护任务。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, IDENTITY | 工单 ID |
| order_no | NVARCHAR(50) | NOT NULL, UNIQUE | 保养单号 (如 PM-20260305001) |
| status | NVARCHAR(20) | DEFAULT 'PENDING' | 状态 (PENDING/IN_PROGRESS/COMPLETED/AUDITED) |
| task_source | NVARCHAR(20) | DEFAULT 'MANUAL' | 任务来源 (SCHEDULED: 定时任务, MANUAL: 手工添加) |
| maintenance_result | NVARCHAR(50) | - | 保养结果 (OK/NG/WAIT) |
| buyoff_status | NVARCHAR(20) | DEFAULT 'NONE' | 验收状态 (NONE/PASSED/FAILED) |
| mold_id | INT | FK (Molds) | 关联模具 ID |
| creator_id | INT | FK (Users) | 创建人 ID |
| executor_id | INT | FK (Users) | 执行人 ID |
| start_time | DATETIME | - | 保养开始时间 |
| end_time | DATETIME | - | 保养结束时间 |
| remark | NVARCHAR(MAX) | - | 执行备注 |
| audit_user_id | INT | FK (Users) | 审核人 ID |
| acceptor_id | INT | FK (Users) | 验收人 ID |
| audit_time | DATETIME | - | 审核时间 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.15 维修工单表 (RepairOrders)
记录模具的报修、紧急维修及故障处理任务。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, IDENTITY | 工单 ID |
| order_no | NVARCHAR(50) | NOT NULL, UNIQUE | 维修单号 (如 RE-20260305001) |
| status | NVARCHAR(20) | DEFAULT 'PENDING' | 状态 (PENDING/IN_PROGRESS/COMPLETED/AUDITED) |
| repair_category | NVARCHAR(50) | - | 维修类别 (小修/中修/大修/紧急) |
| repair_method | NVARCHAR(50) | - | 维修方式 (内部维修/外委维修/更换备件) |
| downtime_impact | NVARCHAR(100) | - | 停机影响 (机台已恢复, 借机停机等) |
| final_location | NVARCHAR(100) | - | 最终归位 (存放库位或机台) |
| root_cause | NVARCHAR(MAX) | - | 故障根本原因 |
| machine_id | INT | FK (Machines) | 报修时的机台 ID |
| mold_id | INT | FK (Molds) | 关联模具 ID |
| fault_description | NVARCHAR(MAX) | - | 故障现象描述 |
| creator_id | INT | FK (Users) | 报修人 ID |
| executor_id | INT | FK (Users) | 维修人 ID |
| start_time | DATETIME | - | 维修开始时间 |
| end_time | DATETIME | - | 维修结束时间 |
| remark | NVARCHAR(MAX) | - | 维修执行备注 |
| audit_user_id | INT | FK (Users) | 审核人 ID |
| audit_time | DATETIME | - | 审核时间 |
| buyoff_by | INT | FK (Users) | 验收人 (QA或工程师) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.16 保养工单详情表 (MaintenanceOrderDetails)
保养工单中各检查项的执行结果。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, FK (MaintenanceOrders) | 工单 ID |
| item_id | INT | PK, FK (MaintenanceItems) | 检查项 ID |
| is_selected | BIT | DEFAULT 0 | 是否已执行/勾选 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.17 维修工单详情表 (RepairOrderDetails)
维修工单中各检查项的执行结果。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, FK (RepairOrders) | 工单 ID |
| item_id | INT | PK, FK (RepairItems) | 检查项 ID |
| is_selected | BIT | DEFAULT 0 | 是否已执行/勾选 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.18 保养工单备件消耗 (MaintenanceOrderSpares)
保养过程中消耗的备件及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, FK (MaintenanceOrders) | 工单 ID |
| spare_id | INT | PK, FK (SpareParts) | 备件 ID |
| quantity | INT | DEFAULT 1 | 消耗数量 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.19 维修工单备件消耗 (RepairOrderSpares)
维修过程中消耗的备件及数量。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| order_id | INT | PK, FK (RepairOrders) | 工单 ID |
| spare_id | INT | PK, FK (SpareParts) | 备件 ID |
| quantity | INT | DEFAULT 1 | 消耗数量 |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.20 备件出入库记录 (StockRecords)
备件库存变动的历史流水。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| record_id | INT | PK, IDENTITY | 记录 ID |
| spare_id | INT | FK (SpareParts) | 备件 ID |
| type | NVARCHAR(20) | - | 类型 (IN:入库, OUT:出库) |
| amount | INT | - | 变动数量 (正数) |
| remark | NVARCHAR(200) | - | 变动原因 (如：采购入库、工单消耗) |
| user_id | INT | FK (Users) | 操作人 ID |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.21 模具履历记录 (MoldHistory)
记录模具的全生命周期关键事件。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| history_id | INT | PK, IDENTITY | 记录 ID |
| mold_id | INT | FK (Molds) | 关联模具 ID |
| type | NVARCHAR(50) | - | 事件类型 (MAINTENANCE/REPAIR/TRANSFER/SCRAP) |
| description | NVARCHAR(MAX) | - | 事件详细描述 |
| operator_id | INT | FK (Users) | 操作人 ID |
| machine_id | INT | FK (Machines) | 关联机台 (可选) |
| slot | NVARCHAR(10) | - | 关联槽位 (可选) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.22 附件上传记录 (Uploads)
系统内所有图片、文档附件的存储记录。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| upload_id | INT | PK, IDENTITY | 附件 ID |
| url | NVARCHAR(500) | NOT NULL | 文件访问地址 |
| file_name | NVARCHAR(200) | - | 原始文件名 |
| user_id | INT | FK (Users) | 上传人 ID |
| source_module | NVARCHAR(50) | - | 来源模块 (MOLD/MAINTENANCE/REPAIR) |
| source_id | INT | - | 来源业务 ID (如工单ID) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |

---

### 2.23 模具冲次原始数据 (MoldShotLogs)
记录模具冲次的原始采集数据。

| 字段名 | 数据类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| log_id | INT | PK, IDENTITY | 记录唯一 ID |
| mold_id | INT | FK (Molds) | 关联模具内部 ID |
| mold_code | NVARCHAR(50) | NOT NULL | 模具编号 (DIE ID) |
| current_shots | INT | - | 当前累计冲次 (CURRENT SHOTS) |
| life_limit | INT | - | 额定寿命限制 (LIMIT) |
| machine_code | NVARCHAR(50) | - | 机台编号 (MACHINE) |
| location | NVARCHAR(100) | - | 位置 (LOCATION) |
| created_at | DATETIME | DEFAULT GETDATE() | 创建时间 |
| updated_at | DATETIME | DEFAULT GETDATE() | 修改时间 |
