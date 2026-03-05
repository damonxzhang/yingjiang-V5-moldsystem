# SmartMold Pro APP 端接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold Pro APP 端各个功能模块所需的数据接口及其数据结构。根据项目要求，**所有接口统一采用 POST 方法**。

---

## 1. 全局与认证 (Global & Auth)

### 1.1 用户登录 (扫码/刷卡)
*   **用途**: 用户通过扫描工卡或读取卡号进行系统登录。
*   **接口**: `POST /api/user/login`
*   **请求体**:
    ```json
    {
      "cardNo": "CARD_12345678" // 工卡唯一编号
    }
    ```
*   **返回数据**:
    ```json
    {
      "userId": "EMP001",
      "userName": "张三",
      "role": "ADMIN", // 可选值: ADMIN, MOLD_ENGINEER, MAINTENANCE_ENGINEER, OPERATOR
      "department": "模具维修部",
      "permissions": ["MOLD_INQUIRY", "MAINTENANCE", "REPAIR", "INSTALLATION", "TRANSFER"],
      "token": "JWT_TOKEN_HERE..."
    }
    ```

### 1.2 获取当前用户信息
*   **用途**: 获取登录用户的基本信息及角色权限。
*   **接口**: `POST /api/user/profile`
*   **请求体**: `{}`
*   **返回数据**:
    ```json
    {
      "userId": "EMP001",
      "userName": "张三",
      "role": "ADMIN", // 可选值: ADMIN, MOLD_ENGINEER, MAINTENANCE_ENGINEER, OPERATOR
      "department": "模具维修部",
      "permissions": ["MOLD_INQUIRY", "MAINTENANCE", "REPAIR", "INSTALLATION", "TRANSFER"]
    }
    ```

---

## 2. 首页 (Dashboard)

### 2.1 获取首页概览数据
*   **用途**: 显示“在线模具”和“待处理任务”数量。
*   **接口**: `POST /api/app/dashboard/summary`
*   **返回数据**:
    ```json
    {
      "onlineMoldCount": 12,
      "pendingTaskCount": 3
    }
    ```

### 2.2 获取通知与预警
*   **用途**: 显示寿命极限预警或其他系统通知。
*   **接口**: `POST /api/app/notifications/alerts`
*   **返回数据**:
    ```json
    [
      {
        "id": "ALERT_001",
        "type": "LIFE_WARNING",
        "moldId": "MOLD-002",
        "message": "模具 MOLD-002 已达到 98% 的设计寿命，请立即安排更换或大修。",
        "severity": "HIGH"
      }
    ]
    ```

### 2.3 获取最近活动动态
*   **用途**: 显示最近的操作日志。
*   **接口**: `POST /api/app/activities/recent`
*   **返回数据**:
    ```json
    [
      {
        "id": "ACT_001",
        "title": "转换流程完成",
        "description": "MOLD-001 已从仓库安装至 MC-202 机台",
        "time": "2026-02-14 10:00:00",
        "iconType": "CHECK"
      }
    ]
    ```

---

## 3. 模具查询 (Mold Inquiry)

### 3.1 搜索模具列表
*   **用途**: 根据 ID 或名称搜索模具。
*   **接口**: `POST /api/app/molds/search`
*   **请求体**:
    ```json
    {
      "q": "TY71" // 搜索关键词
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "id": "TY71",
        "name": "QFN-64 上模",
        "status": "IN_PRODUCTION", // 状态枚举: IN_PRODUCTION, MAINTENANCE, REPAIR, BACKUP, SCRAPPED
        "location": "MC-102",
        "vendor": "NXP_INTERNAL",
        "packageType": "QFN",
        "pinCode": "64",
        "shotTotal": 450000,
        "lifeLimit": 500000,
        "buyoffStatus": "PASS" // PASS, FAIL, PENDING
      }
    ]
    ```

### 3.2 获取模具详情
*   **用途**: 点击模具查看详细信息。
*   **接口**: `POST /api/app/molds/detail`
*   **请求体**:
    ```json
    {
      "moldId": "TY71"
    }
    ```

### 3.3 获取模具流转历史
*   **用途**: 查看模具的历史维保和转换记录。
*   **接口**: `POST /api/app/molds/history`
*   **请求体**:
    ```json
    {
      "moldId": "TY71"
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "id": "WO_1001",
        "type": "MAINTENANCE", // MAINTENANCE, REPAIR, TRANSFER, INSTALLATION
        "description": "常规半年 PM 保养",
        "createdAt": "2026-01-10",
        "operator": "李四",
        "status": "COMPLETED"
      }
    ]
    ```

### 3.4 获取模具 BOM 结构
*   **用途**: 查看模具的全量 BOM 及核心组件寿命。
*   **接口**: `POST /api/app/molds/bom`
*   **请求体**:
    ```json
    {
      "moldId": "TY71"
    }
    ```
*   **返回数据**:
    ```json
    {
      "moldId": "TY71",
      "components": [
        {
          "name": "上模核心针",
          "sn": "SN-99821",
          "category": "上模件",
          "lifeLimit": 100000,
          "isSpare": true
        }
      ]
    }
    ```

---

## 4. 维保执行流程 (Maintenance & Repair Flow)

### 4.1 获取待办维保任务
*   **用途**: 列表展示分配给当前用户的保养/维修任务。
*   **接口**: `POST /api/app/work-orders/pending`
*   **请求体**:
    ```json
    {
      "type": "MAINTENANCE" // 或 REPAIR
    }
    ```

### 4.2 验证扫码模具
*   **用途**: 流程中扫描模具二维码进行校验，并获取模具当前状态和位置。
*   **接口**: `POST /api/app/flow/scan-mold`
*   **请求体**:
    ```json
    {
      "moldId": "TY71",
      "flowType": "MAINTENANCE" // MAINTENANCE, REPAIR, TRANSFER, INSTALLATION
    }
    ```
*   **返回数据**:
    ```json
    {
      "isValid": true,
      "mold": { "id": "TY71", "name": "...", "location": "MC-102", "sourceType": "MACHINE" },
      "message": ""
    }
    ```

### 4.3 确认取模位置 (解绑)
*   **用途**: 确认模具已从机台或柜位取出。
*   **接口**: `POST /api/app/flow/confirm-source`
*   **请求体**:
    ```json
    {
      "moldId": "TY71",
      "sourceType": "MACHINE", // MACHINE, CABINET
      "sourceCode": "MC-102"
    }
    ```

### 4.4 机台生产能力判定 (还机/借机)
*   **用途**: 拆下模具后，确认机台是否可继续生产。
*   **接口**: `POST /api/app/flow/machine-status-update`
*   **请求体**:
    ```json
    {
      "machineId": "MC-102",
      "canProduce": true // true: 还机, false: 停机(借机)
    }
    ```

### 4.5 获取维保内容配置
*   **用途**: 获取保养或维修的标准勾选项列表。
*   **接口**: `POST /api/app/config/maintenance-items`
*   **请求体**:
    ```json
    {
      "moldType": "QFN"
    }
    ```

### 4.6 提交维保记录 (暂存/完成)
*   **用途**: 提交维保作业内容，决定模具去向。
*   **接口**: `POST /api/app/flow/submit-work-order`
*   **请求体**:
    ```json
    {
      "workOrderId": "WO_2001",
      "selectedItems": ["型腔清洁", "导柱润滑"],
      "remark": "...",
      "isFinished": true, // 是否彻底结束维保作业
      "destination": "CABINET", // CABINET, MACHINE
      "photos": []
    }
    ```

---

## 5. 模具安装与 BUYOFF (Installation & Buyoff)

### 5.1 发起/验证 BUYOFF 状态
*   **用途**: 模具安装或回装机台时，验证外部系统 BUYOFF 结果。
*   **接口**: `POST /api/external/buyoff/verify`
*   **请求体**:
    ```json
    {
      "moldId": "TY101",
      "machineId": "MC-201"
    }
    ```

### 5.2 提交安装检查清单
*   **用途**: 模具安装至机台后，提交人工检查清单并正式上线。
*   **接口**: `POST /api/app/flow/complete-installation`
*   **请求体**:
    ```json
    {
      "moldId": "TY101",
      "machineId": "MC-201",
      "checkList": ["螺栓紧固", "水路测试"]
    }
    ```

---

## 6. 模具转换流程 (Transfer Flow)

### 6.1 获取生产待处理清单
*   **用途**: 获取生产部门下发的模具拆下或安装任务。
*   **接口**: `POST /api/app/transfer/pending-tasks`
*   **返回数据**:
    ```json
    [
      { "type": "REMOVE", "moldId": "TY71", "machine": "MC-102", "reason": "达到保养冲次" },
      { "type": "INSTALL", "moldId": "TY101", "target": "MC-102", "reason": "生产计划变更" }
    ]
    ```

### 6.2 模具拆下并同步冲次
*   **用途**: 拆下模具时，记录最终冲次并自动触发保养。
*   **接口**: `POST /api/app/transfer/remove-mold`
*   **请求体**:
    ```json
    {
      "moldId": "TY71",
      "machineId": "MC-102",
      "finalShotCount": 450012
    }
    ```

### 6.3 模具位置绑定 (入柜)
*   **用途**: 扫描模具柜位置码进行绑定。
*   **接口**: `POST /api/app/transfer/location-bind`
*   **请求体**:
    ```json
    {
      "moldId": "TY71",
      "locationCode": "A1-02"
    }
    ```

---

## 7. 实时数据接口 (Real-time & Sync)

### 7.1 获取机台当前冲次 (API 轮询备份)
*   **用途**: 若 Socket 断开，通过 POST 接口获取最新冲次。
*   **接口**: `POST /api/app/machine/current-shots`
*   **请求体**:
    ```json
    {
      "machineId": "MC-102"
    }
    ```

### 7.2 Socket.io 实时推送
*   **用途**: 实时同步冲次。
*   **事件**: `machine:shot_update`
*   **Payload**: `{ "machineId": "MC-102", "moldId": "TY71", "currentShots": 450012 }`

---

## 8. 异常与通用逻辑说明

1.  **POST 规范**: 所有查询类接口均需将参数放入 JSON 请求体中。
2.  **状态流转约束**: 
    *   `SCRAPPED` 状态模具禁止任何安装或转换操作。
    *   `MAINTENANCE` 或 `REPAIR` 状态模具在未完成维保前禁止安装至机台。
3.  **位置校验**: 
    *   执行“安装”前，系统需校验模具是否处于 `BACKUP` 状态或维保已完成。
    *   执行“拆下”前，系统需校验模具是否确实绑定在该机台。
