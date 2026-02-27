# SmartMold Pro APP 端接口需求文档

本文档详细说明了 SmartMold Pro APP 端各个功能模块所需的数据接口及其数据结构，供后端开发参考。

## 1. 全局与认证 (Global & Auth)

### 1.1 获取当前用户信息
*   **用途**: 页面顶部显示用户角色标签。
*   **接口**: `POST /api/user/profile`
*   **返回数据**:
    ```json
    {
      "userId": "EMP001",
      "userName": "张三",
      "role": "ADMIN" // 可选值: ADMIN, MOLD_ENGINEER, MAINTENANCE_ENGINEER, OPERATOR, etc.
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
      "q": "{searchTerm}"
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "id": "TY101",
        "name": "QFN-64 新模",
        "status": "IN_PRODUCTION",
        "location": "MC-101",
        "vendor": "NXP_INTERNAL",
        "packageType": "QFN",
        "pinCode": "64",
        "shotTotal": 450000,
        "lifeLimit": 500000
      }
    ]
    ```

### 3.2 获取模具流转历史
*   **用途**: 查看模具的历史维保和转换记录。
*   **接口**: `POST /api/app/molds/{id}/history`
*   **返回数据**:
    ```json
    [
      {
        "id": "WO_1001",
        "type": "MAINTENANCE",
        "description": "常规半年 PM 保养",
        "createdAt": "2026-01-10",
        "operator": "李四",
        "status": "COMPLETED"
      }
    ]
    ```

### 3.3 获取模具 BOM 结构
*   **用途**: 查看模具的全量 BOM 及核心组件寿命。
*   **接口**: `POST /api/app/molds/{id}/bom`
*   **返回数据**:
    ```json
    {
      "moldId": "TY101",
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

## 4. 维保执行 (Maintenance & Repair)

### 4.1 获取待办任务列表
*   **用途**: 显示分配给当前用户的保养/维修任务。
*   **接口**: `POST /api/app/work-orders/pending`
*   **请求体**:
    ```json
    {
      "type": "MAINTENANCE" // 或 REPAIR
    }
    ```
*   **返回数据**:
    ```json
    [
      {
        "id": "WO_2001",
        "moldId": "QF16",
        "description": "达到 500K 冲次强制保养",
        "createdAt": "2026-02-13 14:00"
      }
    ]
    ```

### 4.2 获取维保标准内容
*   **用途**: 选择已执行的保养/维修项。
*   **接口**: `POST /api/app/config/maintenance-items`
*   **返回数据**: `["型腔清洁", "导柱润滑", "水路检查", ...]`

### 4.3 提交维保结果
*   **用途**: 完成保养或维修流程。
*   **接口**: `POST /api/app/work-orders/{id}/complete`
*   **请求体**:
    ```json
    {
      "selectedItems": ["型腔清洁", "导柱润滑"],
      "remark": "详细作业说明...",
      "photos": ["base64_or_url_1", "..."],
      "isFinished": true,
      "destination": "CABINET", // CABINET 或 MACHINE
      "targetLocation": "A1-02", // 目标位置码
      "currentShotCount": 450000 // 最终核验的冲次
    }
    ```

---

## 5. 模具转换与安装 (Transfer & Installation)

### 5.1 验证 BUYOFF 状态
*   **用途**: 安装前必须通过外部 BUYOFF 系统验证。
*   **接口**: `POST /api/external/buyoff/verify`
*   **请求体**:
    ```json
    {
      "moldId": "{id}",
      "machineId": "{mid}"
    }
    ```
*   **返回数据**:
    ```json
    {
      "status": "PASS", // PASS, FAIL, PENDING
      "message": "品质验证通过"
    }
    ```

### 5.2 模具拆下并解绑
*   **用途**: 从机台拆下模具，更新冲次并触发自动保养。
*   **接口**: `POST /api/app/molds/{id}/remove`
*   **请求体**:
    ```json
    {
      "machineId": "MC-102",
      "lastShotCount": 450000,
      "reason": "PRODUCTION_CHANGE"
    }
    ```

### 5.3 模具安装并绑定
*   **用途**: 将模具安装至机台。
*   **接口**: `POST /api/app/molds/{id}/install`
*   **请求体**:
    ```json
    {
      "machineId": "MC-201",
      "checkList": ["螺栓紧固", "水路测试", "..."]
    }
    ```

### 5.4 模具位置绑定 (入柜)
*   **用途**: 扫描模具柜码进行位置绑定。
*   **接口**: `POST /api/app/molds/{id}/location-bind`
*   **请求体**:
    ```json
    {
      "locationCode": "A1-02"
    }
    ```

---

## 6. 实时数据同步 (Real-time Sync)

### 6.1 机台冲次实时推送 (Socket.io)
*   **用途**: 在拆下模具或监控时获取最新的冲次读数。
*   **事件名**: `machine:shot_update`
*   **Payload**:
    ```json
    {
      "machineId": "MC-102",
      "moldId": "TY71",
      "currentShots": 450012
    }
    ```

---

**说明**: 
1. 所有接口均采用 `POST` 形式，包括原有的查询接口。
2. 对于带查询参数的接口（如搜索、过滤），参数已移入请求体（Request Body）。
3. 异常处理需包含：模具 ID 不存在、权限不足、BUYOFF 验证失败、模具状态冲突（如：已报废模具禁止安装）等。
