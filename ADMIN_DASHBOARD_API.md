# SmartMold 设备生产看板 API 接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold 管理后台（Admin Dashboard）及设备生产看板所需的数据接口及其数据结构。

**全局规范**：
*   所有接口统一采用 **POST** 方法。
*   请求体与返回数据均使用 **JSON** 格式。
*   字段命名遵循驼峰命名法（camelCase）。
*   模具标识必须区分 `moldId` (系统内唯一 UUID) 和 `moldCode` (用户可见编号)。

---

## 1. 认证与权限 (Auth & Permissions)

### 1.1 获取当前管理端权限
*   **用途**: 获取当前登录管理者的基本信息及看板操作权限。
*   **接口**: `POST /api/admin/auth/profile`
*   **请求体**: `{}`
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

## 2. 看板核心接口 (Dashboard Core)

### 2.1 获取全厂设备实时概览
*   **用途**: 渲染看板主界面，展示全厂设备（如 BMD-01 ~ BMD-24）的状态矩阵。
*   **接口**: `POST /api/admin/dashboard/machines/status`
*   **请求体**:
    ```json
    {
      "onlyAlerts": false     // 可选, true (仅显示异常/预警设备)
    }
    ```
*   **返回数据**:
    ```json
    {
      "summary": {
        "total": 24,
        "normal": 18,
        "warning": 4,
        "critical": 2
      },
      "machines": [
        {
          "machineId": "BMD-01",
          "status": "NORMAL", // NORMAL, MAINTENANCE_DUE, OVERDUE, BUYOFF, DISABLED, OFFLINE
          "moldCount": 4,      // 当前挂载的模具数量
          "molds": [
            {
              "moldId": "UUID-MOLD-001",
              "moldCode": "TY71-A",
              "name": "QFN-64 上模",
              "currentShots": 450000,
              "maxShots": 500000,
              "healthScore": 90,
              "status": "RUNNING"
            }
          ],
          "pendingTasks": 2    // 该设备下的待办任务数
        }
      ]
    }
    ```

---

## 3. 设备详情与操作 (Machine Details & Operations)

### 3.1 获取机台及模具槽位详细信息
*   **用途**: 点击左侧机台列表（如 P1, P2...）或切换机台时，加载右侧生产概况及模具详细状态。
*   **接口**: `POST /api/admin/machine/detail`
*   **请求体**:
    ```json
    {
      "machineId": "BMD-01",
      "slot": "P1" // 可选，指定查看某个槽位的模具
    }
    ```
*   **返回数据**:
    ```json
    {
      "machineId": "BMD-01",
      "production": {
        "planned": 24288,
        "completed": 8368
      },
      "slots": [
        { "slot": "P1", "moldCode": "T100", "status": "NORMAL" },
        { "slot": "P2", "moldCode": "T104", "status": "NORMAL" },
        { "slot": "P3", "moldCode": "T108", "status": "CRITICAL" },
        { "slot": "P4", "moldCode": "T111", "status": "NORMAL" }
      ],
      "currentMold": {
        "moldId": "UUID-T100-01",
        "moldCode": "T100",
        "fullName": "精密 BGA 注塑模",
        "shortName": "BGA-01",
        "type": "注塑模",
        "pendingTasks": 0,
        "currentShots": 329769,
        "warningThreshold": 800000,
        "maintenanceStatus": "NORMAL",
        "remainingLife": 2314,
        "totalLife": 5000,
        "healthPercent": 46.28
      }
    }
    ```

### 3.2 创建维保/报修任务
*   **用途**: 执行“创建保养任务”或“创建报修任务”操作。
*   **接口**: `POST /api/admin/tasks/create`
*   **请求体**:
    ```json
    {
      "type": "MAINTENANCE", // MAINTENANCE (保养), REPAIR (报修)
      "machineId": "BMD-01",
      "moldId": "UUID-T100-01",
      "userId": "ADM001",
      "description": "系统自动生成或手动输入备注"
    }
    ```
*   **返回数据**: `{ "success": true, "taskId": "TASK-2026-001" }`

### 3.3 模具安装/卸载操作
*   **用途**: 执行“安装模具”或“卸载模具”操作。
*   **接口**: `POST /api/admin/machine/mold-action`
*   **请求体**:
    ```json
    {
      "action": "INSTALL", // INSTALL (安装), UNINSTALL (卸载)
      "machineId": "BMD-01",
      "slot": "P1",
      "moldId": "UUID-T100-01",
      "userId": "ADM001"
    }
    ```
*   **返回数据**: `{ "success": true }`

### 3.4 模具停用操作
*   **用途**: 执行“模具停用”操作。
*   **接口**: `POST /api/admin/mold/disable`
*   **请求体**:
    ```json
    {
      "moldId": "UUID-T100-01",
      "reason": "手动触发停用",
      "userId": "ADM001"
    }
    ```
*   **返回数据**: `{ "success": true }`

---

## 4. 实时通信 (Real-time)

### 3.1 Socket.io 实时推送事件
*   **用途**: 看板页面通过 Socket.io 订阅事件，实现无需刷新的自动更新。
*   **Namespace**: `/dashboard`
*   **事件列表**:
    1.  `machine:status_change`: 当机台状态发生改变时触发。
        *   Payload: `{ "machineId": "BMD-01", "oldStatus": "NORMAL", "newStatus": "MAINTENANCE_DUE" }`
    2.  `mold:shot_update`: 实时同步模具冲次。
        *   Payload: `{ "moldId": "UUID-MOLD-001", "currentShots": 450012 }`
    3.  `task:new_alert`: 产生新的紧急预警时触发。
        *   Payload: `{ "alertId": "AL-1002", "message": "..." }`

---

