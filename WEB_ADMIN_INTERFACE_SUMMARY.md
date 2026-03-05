# SmartMold Web 后台管理系统 - 接口汇总文档 (V2 - 详细版)

本文档详细汇总了 SmartMold Web 后台管理系统中所有页面、按钮及交互所需的接口细节。

## 1. 全局规范 (Global Standards)
*   **方法**: 所有接口统一采用 **POST**。
*   **格式**: 请求与返回均使用 **JSON**。
*   **命名**: 字段使用小驼峰 (camelCase)。
*   **标识**: 模具必须区分 `moldId` (UUID) 和 `moldCode` (编号)。

---

## 2. 身份认证与全局 (Auth & Global)

### 2.1 管理员登录
*   **用途**: 管理员进入系统，获取访问令牌。
*   **接口**: `POST /api/admin/auth/login`
*   **请求体**:
    ```json
    {
      "username": "admin", // 用户名
      "password": "password123" // 密码
    }
    ```
*   **返回数据**:
    ```json
    {
      "token": "JWT_TOKEN", // 访问令牌，后续请求需携带在 Header 中
      "userId": "ADM001",   // 用户唯一标识
      "userName": "看板管理员" // 用户姓名
    }
    ```

### 2.2 获取管理员信息
*   **用途**: 页面加载或刷新时，通过 Token 获取当前登录用户的详细信息及权限。
*   **接口**: `POST /api/admin/auth/profile`
*   **请求体**: `{}` // 鉴权信息通常在 Header 中，请求体可为空
*   **返回数据**:
    ```json
    {
      "userId": "ADM001",
      "userName": "看板管理员",
      "role": "SUPER_ADMIN", // 角色代码：SUPER_ADMIN(超级管理), MAINTAINER(维保员), OPERATOR(操作员)
      "permissions": [
        "DASHBOARD_VIEW",   // 查看看板
        "MACHINE_CONFIG",   // 机台配置
        "MOLD_MANAGEMENT",  // 模具管理
        "REPORT_EXPORT"     // 报表导出
      ]
    }
    ```

---

## 3. 生产看板 (Production Dashboard)

### 3.1 获取全厂设备实时概览
*   **用途**: 首页展示全厂所有机台的实时状态、报警统计及关联模具。
*   **接口**: `POST /api/admin/dashboard/machines/status`
*   **请求体**: 
    ```json
    { 
      "onlyAlerts": false // 是否仅查看异常机台：true(仅异常), false(全部)
    }
    ```
*   **返回数据**:
    ```json
    {
      "summary": { 
        "total": 24,    // 总机台数
        "normal": 18,   // 正常运行数
        "warning": 4,   // 预警数 (如冲次接近寿命)
        "critical": 2   // 紧急数 (如已停用或严重故障)
      },
      "machines": [
        {
          "machineId": "BMD-01", // 机台唯一标识
          "status": "NORMAL",    // 状态：NORMAL, WARNING, CRITICAL
          "moldCount": 4,        // 当前挂载模具数量
          "molds": [             // 挂载模具列表
            { 
              "moldId": "M1", 
              "moldCode": "T100", 
              "currentShots": 450000, // 当前已生产冲次
              "maxShots": 500000      // 额定寿命冲次
            }
          ],
          "pendingTasks": 2      // 该机台关联的待办维保任务数
        }
      ]
    }
    ```

### 3.2 获取机台及模具槽位详细信息
*   **用途**: 点击特定机台或槽位时，获取该槽位的详细生产进度及模具健康度。
*   **接口**: `POST /api/admin/machine/detail`
*   **请求体**: 
    ```json
    { 
      "machineId": "BMD-01", // 机台 ID
      "slot": "P1"           // 槽位编号：P1, P2...
    }
    ```
*   **返回数据**:
    ```json
    {
      "machineId": "BMD-01",
      "production": { 
        "planned": 24288,   // 计划生产总数
        "completed": 8368   // 当前已完成数
      },
      "slots": [
        { 
          "slot": "P1", 
          "moldCode": "T100", 
          "status": "NORMAL" // 槽位状态
        }
      ],
      "currentMold": { 
        "moldId": "M1", 
        "moldCode": "T100", 
        "fullName": "精密 BGA 注塑模", 
        "currentShots": 329769, 
        "healthPercent": 46.28 // 健康度百分比：(1 - current/max) * 100
      }
    }
    ```

### 3.3 创建保养/报修任务
*   **用途**: 在看板页面直接对机台或模具发起保养或报修申请。
*   **接口**: 
    *   保养: `POST /api/admin/tasks/maintenance/create`
    *   报修: `POST /api/admin/tasks/repair/create`
*   **请求体**:
    ```json
    {
      "machineId": "BMD-01",  // 机台 ID
      "moldId": "M1",         // 模具 ID
      "userId": "ADM001",     // 发起人 ID
      "startTime": "2026-03-05T03:19", // 计划开始时间
      "endTime": "2026-03-05T07:19",   // 计划结束时间
      "description": "例行季度保养"     // 任务描述
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "taskId": "MT-20260305-001", // 生成的任务单号
      "message": "任务创建成功"
    }
    ```

### 3.4 模具安装/卸载/停用
*   **用途**: 在看板上执行模具的上机、下机或紧急停用操作。
*   **接口 (安装/卸载)**: `POST /api/admin/machine/mold-action`
*   **请求体**: 
    ```json
    { 
      "action": "INSTALL", // 动作类型：INSTALL(安装), UNINSTALL(卸载)
      "machineId": "BMD-01", 
      "slot": "P1", 
      "moldId": "M1" 
    }
    ```
*   **接口 (停用)**: `POST /api/admin/mold/disable`
*   **请求体**: 
    ```json
    { 
      "moldId": "M1", 
      "reason": "表面划痕严重", // 停用原因
      "userId": "ADM001" 
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "操作执行成功"
    }
    ```

### 3.5 模具库查询 (安装选择用)
*   **用途**: 模具上机操作时，弹出对话框查询可用的空闲模具。
*   **接口**: `POST /api/admin/mold/library`
*   **请求体**: 
    ```json
    { 
      "keyword": "BGA",   // 模糊搜索关键词 (编号或名称)
      "status": "IDLE",    // 筛选状态：IDLE(空闲), ALL(全部)
      "page": 1, 
      "pageSize": 20 
    }
    ```
*   **返回数据**:
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
*   **用途**: 用于“模具台账 (大材料/小材料)”及“Audit 清单”页面，支持多维度筛选。
*   **接口**: `POST /api/admin/mold/list`
*   **请求体**: 
    ```json
    { 
      "keyword": "", // 搜索词：模具编号或名称
      "department": "大材料", // 部门筛选：大材料, 小材料, ALL
      "isAuditMode": false, // 是否为 Audit 模式 (仅看需 Audit 的模具)
      "status": "ALL", // 状态筛选：IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED, ALL
      "page": 1,
      "pageSize": 20
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 100,
      "list": [
        { 
          "moldId": "TY71", 
          "moldCode": "T100", // 模具编号
          "shortName": "BGA-01", 
          "packageType": "QFN", 
          "shotTotal": 450000, // 当前总冲次
          "status": "IDLE", 
          "department": "大材料",
          "nextAuditDate": "2026-04-01" // 下次 Audit 日期 (Audit 模式下必填)
        }
      ]
    }
    ```

### 4.2 新增/编辑模具档案 (含基本参数与 BOM)
*   **用途**: 统一处理模具档案的创建与更新。
*   **接口**: `POST /api/admin/mold/save`
*   **请求体**: 
    ```json
    {
      "moldId": "MD-2024-001", // 编辑时必填，新增时传空串或不传
      "moldCode": "T100", // 模具编号
      "shortName": "BGA-01",
      "thickness": "250mm", // 厚度
      "moldCategory": "大材料模具", // 模具类别
      "productType": "BGA", // 产品类型
      "packageType": "QFN", // 封装类型
      "pinCode": "A", // Pin Code
      "department": "大材料",
      "lifeLimit": 500000, // 额定寿命冲次
      "components": [ // BOM 结构
        { 
          "category": "上模件", // 部件分类
          "name": "上模盒",     // 部件名称
          "sn": "#1/6-100597", // 序列号
          "isSpare": false,    // 是否为消耗性备件
          "lifeLimit": "N/A"   // 部件寿命限制 (如有)
        }
      ]
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "moldId": "MD-2024-001",
      "message": "模具档案保存成功"
    }
    ```

### 4.3 获取模具完整详情 (含 BOM)
*   **用途**: 在编辑模具或查看模具详情详情时调用。
*   **接口**: `POST /api/admin/mold/detail`
*   **请求体**: 
    ```json
    { 
      "moldId": "MD-2024-001" 
    }
    ```
*   **返回数据**: 
    ```json
    {
      "moldId": "MD-2024-001", 
      "moldCode": "T100",
      "shortName": "BGA-01",
      "thickness": "250mm",
      "moldCategory": "大材料模具",
      "productType": "BGA",
      "packageType": "QFN",
      "pinCode": "A",
      "department": "大材料",
      "lifeLimit": 500000,
      "shotTotal": 456789, // 实时当前总冲次
      "status": "IDLE",
      "components": [
        { 
          "category": "上模件", 
          "name": "上模盒", 
          "sn": "#1/6-100597", 
          "isSpare": false, 
          "lifeLimit": "N/A" 
        }
      ]
    }
    ```

### 4.4 停用模具
*   **用途**: 在模具台账页面对模具进行报废或长期停用处理。
*   **接口**: `POST /api/admin/mold/deactivate`
*   **请求体**: 
    ```json
    { 
      "moldId": "MD-2024-001", 
      "reason": "寿命已满且无法修复", // 停用原因
      "userId": "ADM001" // 操作人 ID
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "模具已成功停用"
    }
    ```

---

## 5. 维保与任务中心 (Maintenance & Tasks)

### 5.1 获取维保任务/记录列表
*   **用途**: 用于“任务中心”、“保养执行记录”、“维修执行记录”，支持分类分页。
*   **接口**: `POST /api/admin/tasks/list`
*   **请求体**: 
    ```json
    { 
      "type": "MAINTENANCE", // 任务类型：MAINTENANCE(保养), REPAIR(维修), ALL(全部)
      "status": "PENDING",   // 任务状态：PENDING(待执行), COMPLETED(已完成), ALL(全部)
      "page": 1,
      "pageSize": 10
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 50,
      "list": [
        {
          "taskId": "MT-2026-001",
          "type": "MAINTENANCE",
          "machineId": "BMD-01",
          "moldCode": "T100",
          "startTime": "2026-03-05 08:00",
          "status": "PENDING",
          "operator": "张工" // 执行人/负责人
        }
      ]
    }
    ```

### 5.2 任务审核与验收
*   **用途**: 管理员对已完成的维保任务进行审核确认。
*   **接口**: `POST /api/admin/tasks/verify`
*   **请求体**: 
    ```json
    { 
      "taskId": "MT-2026-001", 
      "status": "APPROVED", // 审核结果：APPROVED(通过), REJECTED(驳回)
      "remark": "保养到位，可以投产" // 审核备注
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "任务审核已完成"
    }
    ```

---

## 6. 备件管理 (Spare Parts)

### 6.1 获取备件列表及预警
*   **用途**: 获取备件库存状态，高亮显示低于安全库存的备件。
*   **接口**: `POST /api/admin/spare-parts/list`
*   **请求体**: 
    ```json
    { 
      "department": "大材料", // 部门：大材料, 小材料, ALL
      "filterAlerts": false, // 是否仅看预警：true(仅库存不足), false(全部)
      "keyword": "" // 备件名称搜索
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 30,
      "list": [
        {
          "spareId": "SP-001",
          "name": "上模顶针",
          "spec": "2.0mm * 150mm", // 规格
          "currentStock": 5, // 当前库存
          "minStock": 10, // 安全库存 (阈值)
          "unit": "PCS", // 单位
          "status": "LOW_STOCK" // 状态：NORMAL, LOW_STOCK
        }
      ]
    }
    ```

### 6.2 备件入库/出库
*   **用途**: 手动调整备件库存。
*   **接口**: `POST /api/admin/spare-parts/move`
*   **请求体**: 
    ```json
    { 
      "spareId": "SP-001", 
      "type": "STOCK_IN", // 动作类型：STOCK_IN(入库), STOCK_OUT(出库)
      "amount": 10,       // 数量
      "remark": "季度采购入库" // 备注
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "newStock": 15, // 操作后的最新库存
      "message": "库存更新成功"
    }
    ```

### 6.3 备件购买预测
*   **用途**: 根据模具生产计划及当前配件消耗率，预测未来备件需求。
*   **接口**: `POST /api/admin/spare-parts/prediction/list`
*   **请求体**: 
    ```json
    { 
      "planId": "PLAN-2026-Q2", // 生产计划 ID
      "timeHorizon": "30d"      // 预测时间跨度：7d, 30d, 90d
    }
    ```
*   **返回数据**:
    ```json
    {
      "predictionId": "PR-001",
      "items": [
        {
          "spareId": "SP-001",
          "name": "上模顶针",
          "predictedUsage": 12, // 预计消耗量
          "currentStock": 5,
          "gap": 7, // 缺口量 (需采购量)
          "recommendation": "建议本周下单采购 10 PCS" // 采购建议
        }
      ]
    }
    ```

---

## 7. 生产配置与监控 (Production Config & Monitor)

### 7.1 可生产产品 LIST
*   **用途**: 获取各产线机台及其绑定的产品 SKU 和模具准备状态。
*   **接口**: `POST /api/admin/production/hierarchy`
*   **请求体**: 
    ```json
    {
      "department": "大材料" // 部门过滤
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "machineId": "BMD-14",
        "availableProducts": [
          {
            "sku": "5220",
            "slots": [
              { 
                "id": "P1", 
                "moldId": "M1", 
                "paramReady": true, // 参数设定是否就绪
                "moldReady": true,  // 模具安装是否就绪
                "buyoffReady": true // 质量验收是否就绪
              }
            ]
          }
        ]
      }
    ]
    ```

### 7.2 切换生产就绪状态
*   **用途**: 在生产监控页面点击勾选/取消各项就绪状态。
*   **接口**: `POST /api/admin/production/toggle-ready`
*   **请求体**: 
    ```json
    { 
      "machineId": "BMD-14", 
      "sku": "5220", 
      "slotId": "P1", 
      "type": "PARAM", // 状态类型：PARAM(参数), MOLD(模具), BUYOFF(验收)
      "ready": true    // 目标状态：true(已就绪), false(未就绪)
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "状态切换成功"
    }
    ```

### 7.3 实时 Shot 数监控
*   **用途**: 实时查看各模具的消耗比例及预警状态。
*   **接口**: `POST /api/admin/monitor/shot-counts`
*   **请求体**: 
    ```json
    { 
      "process": "注塑", 
      "packageType": "BGA" 
    }
    ```
*   **返回数据**:
    ```json
    {
      "count": 12, // 返回记录数
      "data": [
        { 
          "moldId": "M1", 
          "moldCode": "T100",
          "currentShots": 450000, 
          "limitShots": 500000, 
          "wornout": 90 // 磨损百分比 (0-100)
        }
      ]
    }
    ```

---

## 8. 模具配件绑定 (Mold-Spare Binding)
*   **业务逻辑**: 用于建立模具与常用备件之间的关联关系。在维保领料或备件预警时，系统将根据此绑定关系及“建议装配量”自动计算缺口。

### 8.1 获取模具绑定配件列表
*   **用途**: 在绑定管理页面，查看特定模具已绑定的所有备件及其实时库存。
*   **接口**: `POST /api/admin/mold/spare-bindings/list`
*   **请求体**: 
    ```json
    { 
      "moldId": "MOLD-001" 
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "spareId": "SP-001",
        "spareName": "上模顶针",
        "quantity": 2, // 建议装配量/安全装配数量
        "currentStock": 15, // 备件当前库存
        "minStock": 5 // 备件安全库存阈值
      }
    ]
    ```

### 8.2 保存/更新绑定关系
*   **用途**: 新增绑定或修改已有绑定的装配数量。
*   **接口**: `POST /api/admin/mold/spare-bindings/save`
*   **请求体**: 
    ```json
    { 
      "moldId": "MOLD-001", 
      "spareId": "SP-001", 
      "quantity": 2 // 设定的装配数量
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "绑定关系已保存"
    }
    ```

### 8.3 解除绑定
*   **用途**: 删除模具与备件之间的关联。
*   **接口**: `POST /api/admin/mold/spare-bindings/remove`
*   **请求体**: 
    ```json
    { 
      "moldId": "MOLD-001", 
      "spareId": "SP-001" 
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "message": "绑定关系已解除"
    }
    ```

### 8.4 获取可绑定的备件候选项
*   **用途**: 点击“添加绑定”时，获取尚未与当前模具关联的备件列表。
*   **接口**: `POST /api/admin/mold/spare-bindings/available-spares`
*   **请求体**: 
    ```json
    { 
      "moldId": "MOLD-001", 
      "keyword": "" // 按名称搜索
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 15,
      "list": [
        {
          "spareId": "SP-005",
          "name": "下模推板",
          "spec": "Type-C"
        }
      ]
    }
    ```

---

## 9. 系统管理与配置 (System Admin & Config)

### 9.1 选项管理 (保养/维修)
*   **用途**: 管理员自定义保养或维修的任务选项。
*   **获取列表**: `POST /api/admin/system/options/list`
*   **请求体**: `{ "type": "MAINTENANCE" }` // MAINTENANCE, REPAIR
*   **返回数据**:
    ```json
    {
      "type": "MAINTENANCE",
      "options": [
        { "id": "OPT-001", "label": "检查气路", "isRequired": true }
      ]
    }
    ```
*   **保存选项**: `POST /api/admin/system/options/save`
*   **请求体**: 
    ```json
    { 
      "type": "MAINTENANCE", 
      "option": { "id": "OPT-001", "label": "检查气路", "isRequired": true } 
    }
    ```
*   **删除选项**: `POST /api/admin/system/options/delete`
*   **请求体**: `{ "id": "OPT-001" }`

### 9.2 角色权限管理
*   **用途**: 定义不同角色的功能权限。
*   **获取列表**: `POST /api/admin/system/roles/list`
*   **请求体**: `{}`
*   **返回数据**:
    ```json
    [
      { "role": "MAINTAINER", "description": "维保人员", "permissions": ["TASK_EXECUTE", "SPARE_VIEW"] }
    ]
    ```
*   **保存角色**: `POST /api/admin/system/roles/save`
*   **请求体**: 
    ```json
    { 
      "role": "MAINTAINER", 
      "permissions": ["TASK_EXECUTE", "SPARE_VIEW", "SPARE_MOVE"], 
      "description": "维保人员(含出入库权限)" 
    }
    ```

### 9.3 用户账号管理
*   **用途**: 管理系统登录账号。
*   **获取列表**: `POST /api/admin/system/users/list`
*   **请求体**: `{ "page": 1, "pageSize": 20 }`
*   **返回数据**:
    ```json
    {
      "total": 5,
      "list": [
        { "userId": "U001", "userName": "张工", "role": "MAINTAINER", "status": "ACTIVE" }
      ]
    }
    ```
*   **保存用户**: `POST /api/admin/system/users/save`
*   **请求体**: 
    ```json
    { 
      "userId": "U001", 
      "userName": "张工", 
      "password": "...", 
      "role": "MAINTAINER" 
    }
    ```
*   **删除用户**: `POST /api/admin/system/users/delete`
*   **请求体**: `{ "userId": "U001" }`

---

## 10. 统计分析 (Report & Analysis)

### 10.1 获取 OEE/效率统计
*   **用途**: 获取指定时间段内，机台或模具的生产效率、稼动率及 OEE 数据。
*   **接口**: `POST /api/admin/reports/efficiency`
*   **请求体**: 
    ```json
    { 
      "dateRange": ["2026-01-01", "2026-03-01"], 
      "machineId": "BMD-01" // 可选，不传则返回全局统计
    }
    ```
*   **返回数据**:
    ```json
    {
      "period": "2026-01-01 to 2026-03-01",
      "oee": 85.5,
      "availability": 92.0,
      "performance": 95.0,
      "quality": 98.5,
      "chartData": [
        { "date": "2026-01-01", "value": 84.2 }
      ]
    }
    ```

### 10.2 导出报表
*   **用途**: 将台账、维保记录或寿命监控数据导出为文件。
*   **接口**: `POST /api/admin/reports/export`
*   **请求体**: 
    ```json
    { 
      "reportType": "MOLD_LIFE", // MOLD_LIFE(寿命), MAINTENANCE_LOG(维保日志), SPARE_STOCK(备件库存)
      "format": "EXCEL",         // EXCEL, PDF
      "filters": { "department": "大材料" } // 导出时的筛选条件
    }
    ```
*   **返回数据**:
    ```json
    {
      "success": true,
      "downloadUrl": "http://.../reports/mold_life_20260305.xlsx",
      "message": "报表生成成功，请点击链接下载"
    }
    ```

---

## 11. 实时通信 (Real-time Events)
通过 **Socket.io** 进行实时数据推送，前端需监听以下事件：

### 11.1 设备状态变更
*   **事件名**: `machine:status_change`
*   **推送数据**:
    ```json
    {
      "machineId": "BMD-01",
      "newStatus": "CRITICAL",
      "reason": "紧急停机按钮被按下",
      "timestamp": "2026-03-05T08:15:00Z"
    }
    ```

### 11.2 实时冲次同步
*   **事件名**: `mold:shot_update`
*   **推送数据**:
    ```json
    {
      "moldId": "M1",
      "currentShots": 450123,
      "increment": 1 // 本次推送增加的冲次
    }
    ```

### 11.3 维保预警通知
*   **事件名**: `task:new_alert`
*   **推送数据**:
    ```json
    {
      "alertType": "MAINTENANCE_DUE", // 保养到期
      "moldCode": "T100",
      "message": "模具 T100 冲次已达 495,000，建议立即安排保养",
      "priority": "HIGH"
    }
    ```
