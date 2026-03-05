# SmartMold Web 后台管理系统 - 接口汇总文档 (V2 - 详细版)

本文档详细汇总了 SmartMold Web 后台管理系统中所有页面、按钮及交互所需的接口细节。

## 1. 全局规范 (Global Standards)

* **方法**: 所有接口统一采用 **POST**。
* **格式**: 请求与返回均使用 **JSON**。
* **命名**: 字段使用小驼峰 (camelCase)。
* **标识**: 模具必须区分 `moldId` (UUID) 和 `moldCode` (编号)。

---

## 2. 身份认证与全局 (Auth & Global)

### 2.1 管理员登录

* **用途**: 管理员进入系统，获取访问令牌。
* **接口**: `POST /api/admin/auth/login`
* **请求体**:
  
  ```json
  {
    "username": "admin", // 登录用户名
    "password": "password123" // 登录密码
  }
  ```
* **返回数据**:
  
  ```json
  {
    "token": "JWT_TOKEN", // 访问令牌，后续请求需携带在 Header (Authorization: Bearer <token>) 中
    "userId": "ADM001",   // 用户唯一标识 (工号/UUID)
    "userName": "看板管理员" // 用户真实姓名
  }
  ```

### 2.2 获取管理员信息

* **用途**: 页面加载或刷新时，通过 Token 获取当前登录用户的详细信息及权限。
* **接口**: `POST /api/admin/auth/profile`
* **请求体**: `{}` // 鉴权信息通常在 Header 中，请求体可为空
* **返回数据**:
  
  ```json
  {
    "userId": "ADM001", // 用户唯一标识 (工号/UUID)
    "userName": "看板管理员", // 用户姓名
    "role": "SUPER_ADMIN", // 角色代码：SUPER_ADMIN(超级管理), MAINTAINER(维保员), OPERATOR(操作员)
    "permissions": [ // 拥有的功能权限点列表
      "DASHBOARD_VIEW",   // 查看看板权限
      "MACHINE_CONFIG",   // 机台配置权限
      "MOLD_MANAGEMENT",  // 模具管理权限
      "REPORT_EXPORT"     // 报表导出权限
    ]
  }
  ```

---

## 3. 生产看板 (Production Dashboard)

### 3.1 获取全厂设备实时概览

* **用途**: 首页展示全厂所有机台的实时状态、报警统计及关联模具。
* **接口**: `POST /api/admin/dashboard/machines/status`
* **请求体**: 
  
  ```json
  { 
    "onlyAlerts": false // 是否仅查看异常机台：true(仅异常), false(全部)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "summary": { // 全厂状态汇总
      "total": 24,    // 总机台数量
      "normal": 18,   // 正常运行数量
      "warning": 4,   // 预警数量 (如模具接近寿命)
      "critical": 2   // 紧急数量 (如停机、故障)
    },
    "machines": [ // 各机台简要信息列表
      {
        "machineId": "BMD-01", // 机台唯一标识符 (ID/编号)
        "status": "NORMAL",    // 实时状态：NORMAL, WARNING, CRITICAL
        "moldCount": 4,        // 当前已挂载的模具总数
        "molds": [             // 挂载模具详情
          { 
            "moldId": "M1", // 模具系统内唯一 ID
            "moldCode": "T100", // 模具业务编号
            "currentShots": 450000, // 当前累计生产冲次
            "maxShots": 500000      // 模具额定总寿命冲次
          }
        ],
        "pendingTasks": 2      // 该机台关联的待办维保任务数量
      }
    ]
  }
  ```

### 3.2 获取机台及模具槽位详细信息

* **用途**: 点击特定机台或槽位时，获取该槽位的详细生产进度及模具健康度。
* **接口**: `POST /api/admin/machine/detail`
* **请求体**: 
  
  ```json
  { 
    "machineId": "BMD-01", // 机台唯一 ID
    "slot": "P1"           // 槽位编号 (如 P1, P2)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "machineId": "BMD-01", // 机台唯一 ID
    "production": { 
      "planned": 24288,   // 计划生产总数 (订单总量)
      "completed": 8368   // 当前已完成数 (已生产总量)
    },
    "slots": [
      { 
        "slot": "P1", // 槽位编号
        "moldCode": "T100", // 挂载的模具编号
        "status": "NORMAL" // 槽位状态：NORMAL(正常), WARNING(预警), CRITICAL(紧急)
      }
    ],
    "currentMold": {
      "moldId": "M1", // 模具系统内唯一 ID
      "moldCode": "T100", // 模具业务编号
      "fullName": "精密 BGA 注塑模", // 模具全称
      "currentShots": 329769, // 该模具当前累计生产冲次
      "healthPercent": 46.28 // 健康度百分比：(1 - current/max) * 100
    }
  }
  ```

### 3.3 创建保养任务

* **用途**: 在看板页面直接对机台或模具发起保养申请。
* **接口**: `POST /api/admin/tasks/maintenance/create`
* **请求体**:
  
  ```json
  {
    "machineId": "BMD-01",  // 机台唯一 ID
    "moldId": "M1",         // 模具唯一 ID
    "userId": "ADM001",     // 发起人 ID
    "startTime": "2026-03-05T03:19", // 计划开始时间
    "endTime": "2026-03-05T07:19",   // 计划结束时间
    "description": "例行季度保养"     // 任务描述
  }
  ```
* **返回数据**: `{ "success": true, "taskId": "MT-20260305-001" }`

### 3.4 创建报修任务

* **用途**: 在看板页面直接对机台或模具发起报修申请。
* **接口**: `POST /api/admin/tasks/repair/create`
* **请求体**:
  
  ```json
  {
    "machineId": "BMD-01",  // 机台唯一 ID
    "moldId": "M1",         // 模具唯一 ID
    "userId": "ADM001",     // 发起人 ID
    "description": "顶针复位异常"     // 故障现象描述
  }
  ```
* **返回数据**: `{ "success": true, "taskId": "RT-20260305-001" }`

### 3.5 模具安装/卸载

* **用途**: 在看板上执行模具的上机、下机操作。
* **接口**: `POST /api/admin/machine/mold-action`
* **请求体**: 
  
  ```json
  { 
    "action": "INSTALL", // 动作类型：INSTALL(安装), UNINSTALL(卸载)
    "machineId": "BMD-01", // 目标机台 ID
    "slot": "P1", // 目标槽位
    "moldId": "M1" // 模具唯一 ID
  }
  ```
* **返回数据**: `{ "success": true, "message": "操作执行成功" }`

### 3.6 模具停用

* **用途**: 在看板上执行模具的紧急停用操作。
* **接口**: `POST /api/admin/mold/disable`
* **请求体**: 
  
  ```json
  { 
    "moldId": "M1", // 模具唯一 ID
    "reason": "表面划痕严重", // 停用原因详细描述
    "userId": "ADM001" // 操作人 ID
  }
  ```
* **返回数据**: `{ "success": true, "message": "操作执行成功" }`

### 3.7 模具库查询 (安装选择用)

* **用途**: 模具上机操作时，弹出对话框查询可用的空闲模具。
* **接口**: `POST /api/admin/mold/library`
* **请求体**: 
  
  ```json
  { 
    "keyword": "BGA",   // 模糊搜索关键词
    "status": "IDLE",    // 筛选状态
    "page": 1, 
    "pageSize": 20 
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 45,
    "list": [
      {
        "moldId": "M1",
        "moldCode": "T100",
        "shortName": "BGA-01",
        "status": "IDLE"
      }
    ]
  }
  ```

---

## 4. 模具管理 (Mold Management)

### 4.1 获取模具台账列表

* **用途**: 用于“模具台账 (大材料/小材料)”及“Audit 清单”页面，支持多维度筛选。
* **接口**: `POST /api/admin/mold/list`
* **请求体**: 
  
  ```json
  { 
    "keyword": "", // 搜索词：支持模具编号或名称模糊查询
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "isAuditMode": false, // 是否为 Audit 模式：true(仅看需 Audit 的模具), false(普通台账)
    "status": "ALL", // 状态筛选：IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED, ALL
    "page": 1, // 当前页码
    "pageSize": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 100, // 符合条件的模具总数
    "list": [ // 模具台账简要信息列表
      { 
        "moldId": "TY71", // 模具系统内唯一 ID
        "moldCode": "T100", // 模具编号
        "shortName": "BGA-01", // 模具简称
        "packageType": "QFN", // 封装类型
        "shotTotal": 450000, // 当前累计总冲次
        "status": "IDLE", // 当前状态
        "department": "大材料", // 所属部门
        "nextAuditDate": "2026-04-01" // 下次 Audit 日期 (仅在 Audit 模式下返回有效值)
      }
    ]
  }
  ```

### 4.2 新增/编辑模具档案 (含基本参数与 BOM)

* **用途**: 统一处理模具档案的创建与更新。
* **接口**: `POST /api/admin/mold/save`
* **请求体**: 
  
  ```json
  {
    "moldId": "MD-2024-001", // 编辑时必填，新增时传空串或不传
    "moldCode": "T100", // 模具编号
    "shortName": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度参数
    "moldCategory": "大材料模具", // 模具类别名称
    "productType": "BGA", // 适用产品类型
    "packageType": "QFN", // 适用封装类型
    "pinCode": "A", // Pin Code 标识
    "department": "大材料", // 所属部门
    "lifeLimit": 500000, // 额定总寿命冲次
    "components": [ // 模具 BOM 结构/组成部件列表
      { 
        "category": "上模件", // 部件所属分类 (如：上模件、下模件、中模件)
        "name": "上模盒",     // 部件具体名称
        "sn": "#1/6-100597", // 部件序列号或唯一标识
        "isSpare": false,    // 是否为消耗性备件：true(是), false(否)
        "lifeLimit": "N/A"   // 该部件的寿命限制 (如有，无则传 "N/A")
      }
    ]
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "moldId": "MD-2024-001", // 保存成功的模具 ID
    "message": "模具档案保存成功" // 返回的提示消息
  }
  ```

### 4.3 获取模具完整详情 (含 BOM)

* **用途**: 在编辑模具或查看模具详情详情时调用。
* **接口**: `POST /api/admin/mold/detail`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MD-2024-001" // 模具唯一 ID
  }
  ```
* **返回数据**: 
  
  ```json
  {
    "moldId": "MD-2024-001", // 模具唯一 ID
    "moldCode": "T100", // 模具编号
    "shortName": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度
    "moldCategory": "大材料模具", // 模具类别
    "productType": "BGA", // 产品类型
    "packageType": "QFN", // 封装类型
    "pinCode": "A", // Pin Code
    "department": "大材料", // 所属部门
    "lifeLimit": 500000, // 额定寿命冲次
    "shotTotal": 456789, // 实时当前累计总冲次
    "status": "IDLE", // 当前状态
    "components": [ // BOM 组成部件列表
      { 
        "category": "上模件", // 部件分类
        "name": "上模盒", // 部件名称
        "sn": "#1/6-100597", // 序列号
        "isSpare": false, // 是否备件
        "lifeLimit": "N/A" // 寿命限制
      }
    ]
  }
  ```

### 4.4 停用模具

* **用途**: 在模具台账页面对模具进行报废或长期停用处理。
* **接口**: `POST /api/admin/mold/deactivate`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MD-2024-001", // 模具唯一 ID
    "reason": "寿命已满且无法修复", // 停用或报废的原因描述
    "userId": "ADM001" // 执行操作的管理员 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "模具已成功停用" // 返回的提示消息
  }
  ```

---

## 5. 维保与任务中心 (Maintenance & Tasks)

### 5.1 获取保养记录列表

* **用途**: 用于“任务中心”、“保养执行记录”页面。
* **接口**: `POST /api/admin/tasks/maintenance/list`
* **请求体**: 
  
  ```json
  { 
    "status": "PENDING",   // 任务状态：PENDING(待执行), COMPLETED(已完成), ALL(全部)
    "page": 1, 
    "pageSize": 10 
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 50,
    "list": [
      {
        "taskId": "MT-2026-001", 
        "orderNo": "PM-20260305001",
        "machineId": "BMD-01", 
        "moldCode": "T100", 
        "startTime": "2026-03-05 08:00", 
        "status": "PENDING", 
        "operator": "张工" 
      }
    ]
  }
  ```

### 5.2 获取维修记录列表

* **用途**: 用于“任务中心”、“维修执行记录”页面。
* **接口**: `POST /api/admin/tasks/repair/list`
* **请求体**: 
  
  ```json
  { 
    "status": "PENDING",   // 任务状态
    "page": 1, 
    "pageSize": 10 
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 20,
    "list": [
      {
        "taskId": "RT-2026-001", 
        "orderNo": "RE-20260305001",
        "machineId": "BMD-01", 
        "moldCode": "T100", 
        "faultDescription": "顶针复位不良",
        "status": "IN_PROGRESS", 
        "operator": "李工" 
      }
    ]
  }
  ```

### 5.3 任务审核与验收

* **用途**: 管理员对已完成的保养或维修任务进行审核确认。
* **接口**: `POST /api/admin/tasks/verify`
* **请求体**: 
  
  ```json
  { 
    "taskId": "MT-2026-001", // 任务单号
    "taskType": "MAINTENANCE", // 任务类型 (MAINTENANCE, REPAIR)
    "status": "APPROVED", // 审核结果：APPROVED(通过), REJECTED(驳回)
    "remark": "保养到位，可以投产" // 审核备注
  }
  ```
* **返回数据**: `{ "success": true, "message": "任务审核已完成" }`

---

## 6. 备件管理 (Spare Parts)

### 6.1 获取备件列表及预警

* **用途**: 获取备件库存状态，高亮显示低于安全库存的备件。
* **接口**: `POST /api/admin/spare-parts/list`
* **请求体**: 
  
  ```json
  { 
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "filterAlerts": false, // 是否仅查看预警项：true(仅看库存不足), false(全部)
    "keyword": "" // 备件名称/规格模糊搜索关键词
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 30, // 符合条件的备件总数
    "list": [ // 备件信息列表
      {
        "spareId": "SP-001", // 备件唯一 ID
        "name": "上模顶针", // 备件名称
        "spec": "2.0mm * 150mm", // 规格型号描述
        "currentStock": 5, // 当前库存数量
        "minStock": 10, // 安全库存阈值 (低于此值将触发预警)
        "unit": "PCS", // 计量单位
        "status": "LOW_STOCK" // 状态：NORMAL(正常), LOW_STOCK(库存不足)
      }
    ]
  }
  ```

### 6.2 备件入库/出库

* **用途**: 手动调整备件库存。
* **接口**: `POST /api/admin/spare-parts/move`
* **请求体**: 
  
  ```json
  { 
    "spareId": "SP-001", // 备件唯一 ID
    "type": "STOCK_IN", // 动作类型：STOCK_IN(入库), STOCK_OUT(出库)
    "amount": 10,       // 操作数量 (正整数)
    "remark": "季度采购入库" // 操作原因/备注
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "newStock": 15, // 操作完成后的最新库存总量
    "message": "库存更新成功" // 返回的提示消息
  }
  ```

### 6.3 备件购买预测

* **用途**: 根据模具生产计划及当前配件消耗率，预测未来备件需求。
* **接口**: `POST /api/admin/spare-parts/prediction/list`
* **请求体**: 
  
  ```json
  { 
    "planId": "PLAN-2026-Q2", // 关联的生产计划 ID
    "timeHorizon": "30d"      // 预测时间跨度：7d(一周), 30d(一月), 90d(一季)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "predictionId": "PR-001", // 预测结果记录 ID
    "items": [ // 备件需求明细列表
      {
        "spareId": "SP-001", // 备件 ID
        "name": "上模顶针", // 备件名称
        "predictedUsage": 12, // 预计消耗量
        "currentStock": 5, // 当前库存量
        "gap": 7, // 缺口量 (预计消耗 - 当前库存)
        "recommendation": "建议本周下单采购 10 PCS" // 系统给出的采购建议
      }
    ]
  }
  ```

---

## 7. 生产配置与监控 (Production Config & Monitor)

### 7.1 可生产产品 LIST

* **用途**: 获取各产线机台及其绑定的产品 SKU 和模具准备状态。
* **接口**: `POST /api/admin/production/hierarchy`
* **请求体**: 
  
  ```json
  {
    "department": "大材料" // 部门过滤：大材料, 小材料, ALL
  }
  ```
* **返回数据**:
  
  ```json
  [
    {
      "machineId": "BMD-14", // 机台唯一 ID
      "availableProducts": [ // 该机台支持生产的产品列表
        {
          "sku": "5220", // 产品 SKU 编号
          "slots": [ // 该产品涉及的生产槽位状态
            { 
              "id": "P1", // 槽位 ID (如 P1, P2)
              "moldId": "M1", // 预定使用的模具 ID
              "paramReady": true, // 生产参数设定是否就绪 (Checklist 项)
              "moldReady": true,  // 模具物理安装是否就绪 (Checklist 项)
              "buyoffReady": true // 质量验收/首检是否就绪 (Checklist 项)
            }
          ]
        }
      ]
    }
  ]
  ```

### 7.2 切换生产就绪状态

* **用途**: 在生产监控页面点击勾选/取消各项就绪状态。
* **接口**: `POST /api/admin/production/toggle-ready`
* **请求体**: 
  
  ```json
  { 
    "machineId": "BMD-14", // 机台 ID
    "sku": "5220", // 产品 SKU
    "slotId": "P1", // 槽位 ID
    "type": "PARAM", // 状态类型：PARAM(参数), MOLD(模具), BUYOFF(验收)
    "ready": true    // 目标状态：true(已就绪), false(未就绪)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "状态切换成功" // 返回的提示消息
  }
  ```

### 7.3 实时 Shot 数监控

* **用途**: 实时查看各模具的消耗比例及预警状态。
* **接口**: `POST /api/admin/monitor/shot-counts`
* **请求体**: 
  
  ```json
  { 
    "process": "注塑", // 工序过滤
    "packageType": "BGA" // 封装类型过滤
  }
  ```
* **返回数据**:
  
  ```json
  {
    "count": 12, // 返回的记录条数
    "data": [ // 实时冲次数据列表
      { 
        "moldId": "M1", // 模具 ID
        "moldCode": "T100", // 模具编号
        "currentShots": 450000, // 当前累计冲次
        "limitShots": 500000, // 额定总寿命冲次
        "wornout": 90 // 磨损/消耗百分比 (0-100)
      }
    ]
  }
  ```

---

## 8. 模具配件绑定 (Mold-Spare Binding)

* **业务逻辑**: 用于建立模具与常用备件之间的关联关系。在维保领料或备件预警时，系统将根据此绑定关系及“建议装配量”自动计算缺口。

### 8.1 获取模具绑定配件列表

* **用途**: 在绑定管理页面，查看特定模具已绑定的所有备件及其实时库存。
* **接口**: `POST /api/admin/mold/spare-bindings/list`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MOLD-001" // 模具唯一 ID
  }
  ```
* **返回数据**:
  
  ```json
  [
    {
      "spareId": "SP-001", // 备件唯一 ID
      "spareName": "上模顶针", // 备件名称
      "quantity": 2, // 建议装配量 (该模具标准配置需要的数量)
      "currentStock": 15, // 备件当前的仓库总库存
      "minStock": 5 // 备件的安全库存报警阈值
    }
  ]
  ```

### 8.2 保存/更新绑定关系

* **用途**: 新增绑定或修改已有绑定的装配数量。
* **接口**: `POST /api/admin/mold/spare-bindings/save`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MOLD-001", // 模具唯一 ID
    "spareId": "SP-001", // 备件唯一 ID
    "quantity": 2 // 设定的建议装配数量 (正整数)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "绑定关系已保存" // 返回的提示消息
  }
  ```

### 8.3 解除绑定

* **用途**: 删除模具与备件之间的关联。
* **接口**: `POST /api/admin/mold/spare-bindings/remove`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MOLD-001", // 模具唯一 ID
    "spareId": "SP-001" // 备件唯一 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "绑定关系已解除" // 返回的提示消息
  }
  ```

### 8.4 获取可绑定的备件候选项

* **用途**: 点击“添加绑定”时，获取尚未与当前模具关联的备件列表。
* **接口**: `POST /api/admin/mold/spare-bindings/available-spares`
* **请求体**: 
  
  ```json
  { 
    "moldId": "MOLD-001", // 当前操作的模具 ID
    "keyword": "" // 按名称/规格搜索备件
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 15, // 可选备件总数
    "list": [ // 备件简要信息列表
      {
        "spareId": "SP-005", // 备件 ID
        "name": "下模推板", // 备件名称
        "spec": "Type-C" // 规格
      }
    ]
  }
  ```

---

## 9. 系统管理与配置 (System Admin & Config)

### 9.1 保养项目配置管理

* **用途**: 管理员自定义保养的任务选项。
* **获取列表**: `POST /api/admin/system/maintenance-items/list`
* **新增/编辑**: `POST /api/admin/system/maintenance-items/save`
* **删除**: `POST /api/admin/system/maintenance-items/delete`

### 9.2 维修故障项配置管理

* **用途**: 管理员自定义维修的任务选项。
* **获取列表**: `POST /api/admin/system/repair-items/list`
* **新增/编辑**: `POST /api/admin/system/repair-items/save`
* **删除**: `POST /api/admin/system/repair-items/delete`

### 9.3 字典数据管理 (通用)

* **用途**: 管理机台列表、槽位定义、部门、模具类别等基础数据。
* **接口**: `POST /api/admin/system/dict/list`
* **请求体**: `{ "type": "MACHINE_LIST" }`
* **返回数据**: 
  
  ```json
  [
    { "label": "BMD-01", "value": "BMD-01" },
    { "label": "BMD-02", "value": "BMD-02" }
  ]
  ```

---

## 10. 异常与说明 (Exceptions & Notes)

1. **Token 过期**: 返回 HTTP 401，前端需自动跳转至登录页。
2. **操作冲突**: 如模具已被他人占用，返回 HTTP 409 及具体错误消息。
3. **数据校验**: 所有请求体字段均需进行后端校验，失败返回 HTTP 400。
4. **实时性**: 看板接口数据由缓存/实时数据库支撑，更新频率为秒级。
