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
      "floor": "1F",          // 可选, 按楼层筛选
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

### 2.2 获取全厂异常预警清单
*   **用途**: 在看板侧边栏或滚动通知中显示当前最紧迫的待办任务。
*   **接口**: `POST /api/admin/dashboard/alerts`
*   **请求体**:
    ```json
    {
      "limit": 20
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "alertId": "AL-1001",
        "machineId": "BMD-01",
        "type": "MAINTENANCE", // MAINTENANCE, REPAIR, BUYOFF_FAILED
        "moldId": "UUID-MOLD-002",
        "moldCode": "TY71-B",
        "message": "模具冲次接近上限，需进行二级保养",
        "level": "HIGH", // HIGH, MEDIUM, LOW
        "createdAt": "2026-03-05 08:00:00"
      }
    ]
    ```

---

## 3. 设备与模具详情 (Details)

### 3.1 获取特定机台详细状态
*   **用途**: 点击看板上的机台时，弹出显示其挂载模具的详细信息及生产历史。
*   **接口**: `POST /api/admin/machine/detail`
*   **请求体**:
    ```json
    {
      "machineId": "BMD-01"
    }
    ```
*   **返回数据**:
    ```json
    {
      "machineId": "BMD-01",
      "status": "NORMAL",
      "operator": "张三",
      "molds": [
        {
          "moldId": "UUID-MOLD-001",
          "moldCode": "TY71-A",
          "name": "QFN-64 上模",
          "lastMaintenance": "2026-02-15",
          "nextMaintenanceShots": 50000,
          "remainingShots": 12000,
          "installTime": "2026-03-01 10:00:00"
        }
      ],
      "recentLogs": [
        { "time": "2026-03-05 09:00", "event": "冲次更新: 450000", "type": "INFO" }
      ]
    }
    ```

### 3.2 获取模具全生命周期追踪
*   **用途**: 查询特定模具的维修、保养及位置变动历史。
*   **接口**: `POST /api/admin/mold/history`
*   **请求体**:
    ```json
    {
      "moldId": "UUID-MOLD-001",
      "page": 1,
      "pageSize": 20
    }
    ```
*   **返回数据**:
    ```json
    {
      "total": 150,
      "list": [
        {
          "time": "2026-03-05 08:30:00",
          "action": "MAINTENANCE",
          "operator": "李四",
          "result": "COMPLETED",
          "remark": "更换了 O 型密封圈"
        }
      ]
    }
    ```

---

## 4. 统计与分析 (Analytics)

### 4.1 模具健康度分布统计
*   **用途**: 展示模具整体健康状况的分布图（饼图/柱状图）。
*   **接口**: `POST /api/admin/stats/health-distribution`
*   **请求体**: `{}`
*   **返回数据**:
    ```json
    {
      "categories": ["Excellent", "Good", "Fair", "Critical"],
      "data": [120, 45, 12, 3]
    }
    ```

### 4.2 维保任务趋势分析
*   **用途**: 统计过去 7 天或 30 天内维保任务的完成情况趋势。
*   **接口**: `POST /api/admin/stats/maintenance-trend`
*   **请求体**:
    ```json
    {
      "days": 7
    }
    ```
*   **返回数据**:
    ```json
    {
      "dates": ["02-27", "02-28", "03-01", "03-02", "03-03", "03-04", "03-05"],
      "planned": [10, 8, 12, 15, 10, 9, 11],
      "completed": [9, 8, 11, 14, 10, 8, 11]
    }
    ```

---

## 5. 实时通信 (Real-time)

### 5.1 Socket.io 实时推送事件
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

## 6. 异常处理说明

1.  **看板自动刷新**: 看板接口推荐具备高并发处理能力，前端应配合使用 Socket.io 减少轮询。
2.  **数据延迟**: 冲次更新允许存在 1-5 秒的系统延迟，看板应在前端通过平滑动画展示数据波动。
3.  **权限控制**: `DASHBOARD_VIEW` 权限仅允许查看，任何写操作（如修改状态、指派任务）需 `ADMIN` 级权限。
