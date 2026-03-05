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
*   **用途**: 管理员进入系统。
*   **接口**: `POST /api/admin/auth/login`
*   **请求体**:
    ```json
    { "username": "admin", "password": "password123" }
    ```
*   **返回数据**: `{ "token": "JWT_TOKEN", "userId": "ADM001" }`

### 2.2 获取管理员信息
*   **用途**: 页面加载时获取权限。
*   **接口**: `POST /api/admin/auth/profile`
*   **返回数据**:
    ```json
    {
      "userId": "ADM001",
      "userName": "看板管理员",
      "role": "SUPER_ADMIN",
      "permissions": ["DASHBOARD_VIEW", "MACHINE_CONFIG", "MOLD_MANAGEMENT", "REPORT_EXPORT"]
    }
    ```

---

## 3. 生产看板 (Production Dashboard)

### 3.1 获取全厂设备实时概览
*   **接口**: `POST /api/admin/dashboard/machines/status`
*   **请求体**: `{ "onlyAlerts": false }`
*   **返回数据**:
    ```json
    {
      "summary": { "total": 24, "normal": 18, "warning": 4, "critical": 2 },
      "machines": [
        {
          "machineId": "BMD-01",
          "status": "NORMAL",
          "moldCount": 4,
          "molds": [{ "moldId": "...", "moldCode": "...", "currentShots": 450000, "maxShots": 500000 }],
          "pendingTasks": 2
        }
      ]
    }
    ```

### 3.2 获取机台及模具槽位详细信息
*   **接口**: `POST /api/admin/machine/detail`
*   **请求体**: `{ "machineId": "BMD-01", "slot": "P1" }`
*   **返回数据**:
    ```json
    {
      "machineId": "BMD-01",
      "production": { "planned": 24288, "completed": 8368 },
      "slots": [{ "slot": "P1", "moldCode": "T100", "status": "NORMAL" }],
      "currentMold": { "moldId": "...", "moldCode": "T100", "fullName": "精密 BGA 注塑模", "currentShots": 329769, "healthPercent": 46.28 }
    }
    ```

### 3.3 创建保养/报修任务
*   **接口 (保养)**: `POST /api/admin/tasks/maintenance/create`
*   **接口 (报修)**: `POST /api/admin/tasks/repair/create`
*   **请求体 (保养示例)**:
    ```json
    {
      "machineId": "BMD-01", "moldId": "...", "userId": "ADM001",
      "startTime": "2026-03-05T03:19", "endTime": "2026-03-05T07:19"
    }
    ```

### 3.4 模具安装/卸载/停用
*   **接口 (安装/卸载)**: `POST /api/admin/machine/mold-action`
*   **请求体**: `{ "action": "INSTALL/UNINSTALL", "machineId": "...", "slot": "P1", "moldId": "..." }`
*   **接口 (停用)**: `POST /api/admin/mold/disable`
*   **请求体**: `{ "moldId": "...", "reason": "...", "userId": "..." }`

### 3.5 模具库查询 (安装选择用)
*   **接口**: `POST /api/admin/mold/library`
*   **请求体**: `{ "keyword": "", "status": "IDLE", "page": 1, "pageSize": 20 }`

---

## 4. 模具管理 (Mold Management)

### 4.1 获取模具台账列表
*   **用途**: 用于“模具台账 (大材料/小材料)”及“Audit 清单”页面。
*   **接口**: `POST /api/admin/mold/list`
*   **请求体**: 
    ```json
    { 
      "keyword": "", 
      "department": "大材料/小材料/ALL", 
      "isAuditMode": false, 
      "status": "ALL", 
      "page": 1 
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 100,
      "list": [
        { "moldId": "TY71", "shortName": "BGA-01", "packageType": "QFN", "shotTotal": 450000, "status": "IDLE", "department": "大材料" }
      ]
    }
    ```

### 4.2 新增/编辑模具档案 (含基本参数与 BOM)
*   **接口**: `POST /api/admin/mold/save` (统一新增与编辑)
*   **请求体**: 
    ```json
    {
      "moldId": "MD-2024-001", 
      "shortName": "BGA-01",
      "thickness": "250mm",
      "moldCategory": "大材料模具",
      "productType": "BGA",
      "packageType": "QFN",
      "pinCode": "A",
      "department": "大材料",
      "lifeLimit": 500000,
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

### 4.3 获取模具完整详情 (含 BOM)
*   **接口**: `POST /api/admin/mold/detail`
*   **请求体**: `{ "moldId": "MD-2024-001" }`
*   **返回数据**: 同上述保存请求体结构，增加 `shotTotal` (当前冲次) 等实时字段。

### 4.4 停用模具
*   **用途**: 在模具台账页面对模具进行停用处理。
*   **接口**: `POST /api/admin/mold/deactivate`
*   **请求体**: `{ "moldId": "MD-2024-001", "reason": "..." }`

---

## 5. 维保与任务中心 (Maintenance & Tasks)

### 5.1 获取维保任务/记录列表
*   **用途**: 用于“任务中心”、“保养执行记录”、“维修执行记录”。
*   **接口**: `POST /api/admin/tasks/list`
*   **请求体**: `{ "type": "MAINTENANCE/REPAIR/ALL", "status": "PENDING/COMPLETED/ALL", "page": 1 }`

### 5.2 任务审核与验收
*   **接口**: `POST /api/admin/tasks/verify`
*   **请求体**: `{ "taskId": "MT-2026-001", "status": "APPROVED", "remark": "OK" }`

---

## 6. 备件管理 (Spare Parts)

### 6.1 获取备件列表及预警
*   **用途**: 用于“备件管理 (大材料/小材料)”。
*   **接口**: `POST /api/admin/spare-parts/list`
*   **请求体**: `{ "department": "大材料/小材料", "filterAlerts": true }`

### 6.2 备件入库/出库
*   **接口**: `POST /api/admin/spare-parts/move`
*   **请求体**: `{ "spareId": "SP-001", "type": "STOCK_IN/STOCK_OUT", "amount": 10 }`

### 6.3 备件购买预测
*   **接口**: `POST /api/admin/spare-parts/prediction/list`
*   **请求体**: `{ "planId": "PLAN-001", "timeHorizon": "30d" }`

---

## 7. 生产配置与监控 (Production Config & Monitor)

### 7.1 可生产产品 LIST
*   **接口**: `POST /api/admin/production/hierarchy`
*   **用途**: 获取各产线机台及其绑定的产品 SKU 和模具准备状态。
*   **返回数据**:
    ```json
    [
      {
        "machineId": "BMD-14",
        "availableProducts": [
          {
            "sku": "5220",
            "slots": [{ "id": "P1", "moldId": "...", "paramReady": true, "moldReady": true, "buyoffReady": true }]
          }
        ]
      }
    ]
    ```

### 7.2 切换生产就绪状态
*   **接口**: `POST /api/admin/production/toggle-ready`
*   **请求体**: `{ "machineId": "...", "sku": "...", "slotId": "P1", "type": "PARAM/MOLD/BUYOFF" }`

### 7.3 实时 Shot 数监控
*   **接口**: `POST /api/admin/monitor/shot-counts`
*   **请求体**: `{ "process": "注塑", "packageType": "BGA" }`
*   **返回数据**:
    ```json
    {
      "count": 12,
      "data": [
        { "moldId": "...", "currentShots": 450000, "limitShots": 500000, "wornout": 90 }
      ]
    }
    ```

---

## 8. 模具配件绑定 (Mold-Spare Binding)
*   **业务逻辑**: 用于建立模具与常用备件之间的关联关系。在维保领料或备件预警时，系统将根据此绑定关系及“建议装配量”自动计算缺口。

### 8.1 获取模具绑定配件列表
*   **接口**: `POST /api/admin/mold/spare-bindings/list`
*   **请求体**: `{ "moldId": "MOLD-001" }`
*   **返回数据**:
    ```json
    [
      {
        "spareId": "SP-001",
        "spareName": "上模顶针",
        "quantity": 2, 
        "currentStock": 15,
        "minStock": 5
      }
    ]
    ```
*   **说明**: `quantity` 为建议装配量/安全装配数量。

### 8.2 保存/更新绑定关系
*   **接口**: `POST /api/admin/mold/spare-bindings/save`
*   **请求体**: 
    ```json
    { 
      "moldId": "MOLD-001", 
      "spareId": "SP-001", 
      "quantity": 2 
    }
    ```
*   **说明**: 如果已存在绑定关系则更新 `quantity`，不存在则新增。

### 8.3 解除绑定
*   **接口**: `POST /api/admin/mold/spare-bindings/remove`
*   **请求体**: `{ "moldId": "MOLD-001", "spareId": "SP-001" }`

### 8.4 获取可绑定的备件候选项
*   **接口**: `POST /api/admin/mold/spare-bindings/available-spares`
*   **请求体**: `{ "moldId": "MOLD-001", "keyword": "" }`
*   **返回数据**: 返回尚未与该模具绑定的备件列表，用于下拉选择。

---

## 9. 系统管理与配置 (System Admin & Config)

### 9.1 选项管理 (保养/维修)
*   **用途**: 用于“保养选项管理”和“维修选项管理”。
*   **接口**: `POST /api/admin/system/options/list`
*   **请求体**: `{ "type": "MAINTENANCE/REPAIR" }`
*   **保存接口**: `POST /api/admin/system/options/save`
*   **删除接口**: `POST /api/admin/system/options/delete`

### 9.2 角色权限管理
*   **接口**: `POST /api/admin/system/roles/list`
*   **保存接口**: `POST /api/admin/system/roles/save`
    *   **请求体**: `{ "role": "OPERATOR", "permissions": ["..."], "description": "..." }`

### 9.3 用户账号管理
*   **接口**: `POST /api/admin/system/users/list`
*   **保存接口**: `POST /api/admin/system/users/save`
*   **删除接口**: `POST /api/admin/system/users/delete`

---

## 10. 统计分析 (Report & Analysis)

### 7.1 获取 OEE/效率统计
*   **接口**: `POST /api/admin/reports/efficiency`
*   **请求体**: `{ "dateRange": ["2026-01-01", "2026-03-01"], "machineId": "BMD-01" }`

### 7.2 导出报表
*   **接口**: `POST /api/admin/reports/export`
*   **请求体**: `{ "reportType": "MOLD_LIFE", "format": "EXCEL" }`

---

## 8. 实时通信 (Real-time Events)
通过 Socket.io 进行实时同步：
*   `machine:status_change`: 设备状态变更。
*   `mold:shot_update`: 实时冲次同步。
*   `task:new_alert`: 新产生预警通知。
