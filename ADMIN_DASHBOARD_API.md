# SmartMold 设备生产看板 API 接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold 管理后台（Admin Dashboard）及设备生产看板所需的数据接口及其数据结构。

**全局规范**：

* 所有接口统一采用 **POST** 方法。
* 请求体与返回数据均使用 **JSON** 格式。
* 字段命名遵循下划线命名法（snake_case）。
* 模具标识必须区分 `mold_id` (系统内唯一 UUID) 和 `mold_code` (用户可见编号)。

---

## 1. 认证与权限 (Auth & Permissions)

### 1.1 获取当前管理端权限

* **用途**: 获取当前登录管理者的基本信息及看板操作权限。
* **接口**: `POST /api/admin/auth/profile`
* **请求体**: `{}`
* **返回数据**:
  
  ```json
  {
    "user_id": "ADM001", // 用户唯一标识 (UUID/工号)
    "user_name": "看板管理员", // 用户姓名
    "role": "SUPER_ADMIN", // 用户角色代码 (如：SUPER_ADMIN, MAINTAINER)
    "permissions": [ // 用户拥有的权限代码列表
      "DASHBOARD_VIEW", // 查看看板权限
      "MACHINE_CONFIG", // 机台配置权限
      "MOLD_MANAGEMENT", // 模具管理权限
      "REPORT_EXPORT" // 报表导出权限
    ]
  }
  ```

---

## 2. 看板核心接口 (Dashboard Core)

### 2.1 获取全厂设备实时概览

* **用途**: 渲染看板主界面，展示全厂设备（如 BMD-01 ~ BMD-24）的状态矩阵。系统会根据传入的 `user_id` 自动判断用户所属部门，并仅返回该部门下的机台设备。
* **接口**: `POST /api/admin/dashboard/machines/status`
* **请求体**:
  
  ```json
  {
    "user_id": "ADM001",     // 必填, 当前登录用户的 ID, 用于区分部门和数据权限
    "only_alerts": false     // 可选, true (仅显示异常/预警设备)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "department": "A厂区", // 当前用户所属的部门/厂区名称
    "summary": { // 统计汇总信息
      "total": 24, // 总机台数
      "normal": 18, // 正常运行的机台数
      "warning": 4, // 预警中的机台数 (如冲次接近寿命)
      "critical": 2 // 严重故障或停用的机台数
    },
    "machines": [ // 机台列表
      {
        "machine_id": "BMD-01", // 机台唯一标识符 (ID/编号)
        "status": "NORMAL", // 机台实时状态 (NORMAL, MAINTENANCE_DUE, OVERDUE, BUYOFF, DISABLED, OFFLINE)
        "mold_count": 4, // 当前挂载的模具数量
        "molds": [ // 挂载模具详情列表
          {
            "mold_id": "UUID-MOLD-001", // 模具系统内唯一 ID
            "mold_code": "TY71-A", // 模具业务编号
            "name": "QFN-64 上模", // 模具名称
            "current_shots": 450000, // 当前已生产冲次
            "max_shots": 500000, // 模具额定总寿命冲次
            "status": "RUNNING" // 模具实时状态 (RUNNING, IDLE, MAINTENANCE)
          }
        ],
        "pending_tasks": 2 // 该设备下的待办任务数量
      }
    ]
  }
  ```

---

## 3. 设备详情与操作 (Machine Details & Operations)

### 3.1 获取机台及模具槽位详细信息

* **用途**: 点击左侧机台列表（如 P1, P2...）或切换机台时，加载右侧生产概况及模具详细状态。
* **接口**: `POST /api/admin/machine/detail`
* **请求体**:
  
  ```json
  {
    "machine_id": "BMD-01", // 查询的机台唯一 ID
    "slot": "P1" // 槽位标识 (如：P1, P2...)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "machine_id": "BMD-01", // 机台 ID
    "production": { // 生产数据统计
      "planned": 24288, // 计划生产总数
      "completed": 8368 // 实际完成生产总数
    },
    "slots": [ // 该机台所有槽位的状态
      { "slot": "P1", "mold_code": "T100", "status": "NORMAL" }, // 槽位1状态及模具编号
      { "slot": "P2", "mold_code": "T104", "status": "NORMAL" }, // 槽位2状态及模具编号
      { "slot": "P3", "mold_code": "T108", "status": "CRITICAL" }, // 槽位3状态及模具编号
      { "slot": "P4", "mold_code": "T111", "status": "NORMAL" } // 槽位4状态及模具编号
    ],
    "current_mold": { // 当前选定槽位的模具详细信息
      "mold_id": "UUID-T100-01", // 模具系统内唯一 ID
      "mold_code": "T100", // 模具业务编号
      "full_name": "精密 BGA 注塑模", // 模具完整名称
      "short_name": "BGA-01", // 模具简称
      "type": "注塑模", // 模具类型分类
      "pending_tasks": 0, // 该模具关联的待办任务数
      "current_shots": 329769, // 该模具当前已生产冲次
      "warning_threshold": 800000, // 模具预警冲次阈值
      "maintenance_status": "NORMAL", // 维保状态 (NORMAL, WARNING, CRITICAL)
      "remaining_life": 2314, // 剩余可用寿命冲次
      "total_life": 5000, // 额定总寿命 (以K次为单位，或根据业务定义)
    }
  }
  ```

### 3.2 查询模具库列表 (用于安装模具选择)

* **用途**: 点击“安装模具”按钮时，弹出模具库列表，支持按编号、状态、封装类型搜索。
* **接口**: `POST /api/admin/mold/library`
* **请求体**:
  
  ```json
  {
    "keyword": "MD-2024", // 模糊搜索关键字 (模具编号或名称)
    "status": "IDLE", // 筛选状态: IDLE (闲置中), IN_USE (使用中), MAINTENANCE (保养中)
    "package_type": "QFN", // 按封装类型筛选 (如：BGA, QFN)
    "page": 1, // 当前页码
    "page_size": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 128, // 符合条件的模具总数
    "list": [ // 模具简要信息列表
      {
        "mold_id": "UUID-MD-2024-001", // 模具系统内唯一 ID
        "mold_code": "MD-2024-001", // 模具业务编号
        "name": "精密 BGA 注塑模", // 模具名称
        "status": "IDLE", // 模具当前状态
        "cabinet_code": "A123456", // 存放库柜编号
        "location": "CAB-A01", // 库位详细位置
        "package_type": "QFN", // 封装类型
        "current_shots": 45200, // 当前已使用冲次
        "max_shots": 500000, // 额定寿命冲次
        "usage_percent": 9.04, // 寿命已使用百分比
        "can_install": true // 当前是否可被安装到机台 (取决于状态和流程)
      }
    ]
  }
  ```

### 3.3 创建保养任务 (Maintenance)

* **用途**: 在看板中点击“创建保养任务”，并设置保养时间范围。
* **接口**: `POST /api/admin/tasks/maintenance/create`
* **请求体**:
  
  ```json
  {
    "machine_id": "BMD-01", // 关联机台 ID
    "mold_id": "UUID-T100-01", // 关联模具唯一 ID
    "user_id": "ADM001", // 任务发起人 ID
    "start_time": "2026-03-05T03:19", // 计划保养开始时间 (ISO 格式)
    "end_time": "2026-03-05T07:19", // 计划保养结束时间 (ISO 格式)
    "description": "例行保养" // 任务详细描述或要求
  }
  ```
* **返回数据**: `{ "success": true, "task_id": "MT-2026-001" }` // success: 是否创建成功, task_id: 生成的任务工单号

### 3.4 创建报修任务 (Repair)

* **用途**: 点击“创建报修任务”手动上报故障。
* **接口**: `POST /api/admin/tasks/repair/create`
* **请求体**:
  
  ```json
  {
    "machine_id": "BMD-01", // 关联机台 ID
    "mold_id": "UUID-T100-01", // 关联模具唯一 ID
    "user_id": "ADM001", // 报修发起人 ID
    "description": "发现模具边缘磨损，需紧急修复" // 故障现象描述
  }
  ```
* **返回数据**: `{ "success": true, "task_id": "RT-2026-001" }` // success: 是否创建成功, task_id: 生成的报修工单号

### 3.5 模具安装/卸载操作

* **用途**: 执行“安装模具”或“卸载模具”操作。
* **接口**: `POST /api/admin/machine/mold-action`
* **请求体**:
  
  ```json
  {
    "action": "INSTALL", // 动作类型: INSTALL (安装/上机), UNINSTALL (卸载/下机)
    "machine_id": "BMD-01", // 目标机台 ID
    "slot": "P1", // 目标槽位标识
    "mold_id": "UUID-T100-01", // 模具唯一 ID
    "user_id": "ADM001" // 操作执行人 ID
  }
  ```
* **返回数据**: `{ "success": true, "message": "操作成功" }` // success: 是否执行成功, message: 结果反馈消息

### 3.6 模具停用操作

* **用途**: 执行“模具停用”操作。
* **接口**: `POST /api/admin/mold/disable`
* **请求体**:
  
  ```json
  {
    "mold_id": "UUID-T100-01", // 模具唯一 ID
    "reason": "手动触发停用", // 停用原因详细说明
    "user_id": "ADM001" // 操作执行人 ID
  }
  ```
* **返回数据**: `{ "success": true, "message": "模具已停用" }` // success: 是否执行成功, message: 结果反馈消息

---

## 4. 实时通信 (Real-time)

### 3.1 Socket.io 实时推送事件

* **用途**: 看板页面通过 Socket.io 订阅事件，实现无需刷新的自动更新。
* **Namespace**: `/dashboard`
* **事件列表**:
  1. `machine:status_change`: 当机台状态发生改变时触发。
     * ```json
  {
    "machine_id": "BMD-01", // 发生状态变更的机台 ID
    "old_status": "NORMAL", // 变更前的状态
    "new_status": "MAINTENANCE_DUE", // 变更后的新状态
    "timestamp": "2026-03-05T08:15:00Z" // 状态变更发生的时间戳
  }
  ```
2. `mold:shot_update`: 实时同步模具冲次。
   * Payload: 
     
     ```json
     { 
       "mold_id": "UUID-MOLD-001", // 模具唯一 ID
       "current_shots": 450012, // 最新的当前累计冲次
       "increment": 1 // 本次更新增加的冲次数值
     }
     ```
3. `task:new_alert`: 产生新的紧急预警时触发。
   * Payload: 
     
     ```json
     { 
       "alert_id": "AL-1002", // 预警唯一 ID
       "message": "模具 TY71-A 冲次已超额定寿命", // 预警消息文本
       "severity": "CRITICAL", // 严重程度: WARNING, CRITICAL
       "timestamp": "2026-03-05T08:15:00Z" // 预警产生的时间戳
     }
     ```

---
