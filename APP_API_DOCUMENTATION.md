# SmartMold Pro APP 端接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold Pro APP 端各个功能模块所需的数据接口及其数据结构。根据项目要求，**所有接口统一采用 POST 方法**。

---

## 1. 全局与认证 (Global & Auth)

### 1.1 用户登录 (扫码/刷卡)

* **用途**: 用户通过扫描工卡或读取卡号进行系统登录。
* **接口**: `POST /api/user/login`
* **请求体**:
  
  ```json
  {
    "card_no": "CARD_12345678" // 工卡唯一编号
  }
  ```
  * `card_no`: String - 员工工卡号。
* **返回数据**:
  
  ```json
  {
    "user_id": "EMP001",
    "user_name": "张三",
    "role": "ADMIN", 
    "department": "模具维修部",
    "permissions": ["MOLD_INQUIRY", "MAINTENANCE", "REPAIR", "INSTALLATION", "TRANSFER"],
    "token": "JWT_TOKEN_HERE..."
  }
  ```
  * `user_id`: String - 用户唯一标识。
  * `user_name`: String - 用户姓名。
  * `role`: Enum - 用户角色 (ADMIN, MOLD_ENGINEER, MAINTENANCE_ENGINEER, OPERATOR)。
  * `department`: String - 用户所属部门名称。
  * `permissions`: Array[String] - 权限点列表。
  * `token`: String - 接口访问令牌。

### 1.2 获取当前用户信息

* **用途**: 获取登录用户的基本信息及角色权限。
* **接口**: `POST /api/user/profile`
* **请求体**: `{}`
* **返回数据**:
  
  ```json
  {
    "user_id": "EMP001",
    "user_name": "张三",
    "role": "ADMIN",
    "department": "模具维修部",
    "permissions": ["MOLD_INQUIRY", "MAINTENANCE", "REPAIR", "INSTALLATION", "TRANSFER"]
  }
  ```
  * 字段说明参考 1.1。

### 1.3 图片上传

* **用途**: 在维保执行或安装检查过程中，上传现场拍摄的图片，并获取可访问的 URL。
* **接口**: `POST /api/app/common/upload-image`
* **请求体**: `multipart/form-data`
  * `file`: File - 图片文件流 (JPEG/PNG)。
  * `user_id`: String - 上传用户 ID。
  * `source`: Enum - 来源模块 (MAINTENANCE, REPAIR, INSTALLATION)。
* **返回数据**:
  
  ```json
  {
    "url": "https://cdn.moldsystem.com/uploads/2026/03/05/img_12345.jpg",
    "file_name": "img_12345.jpg",
    "upload_id": "UP_778899"
  }
  ```
  * `url`: String - 图片公网/内网可访问地址。
  * `file_name`: String - 文件名。
  * `upload_id`: String - 上传记录 ID。

---

## 2. 首页 (Dashboard)

### 2.1 获取首页概览数据

* **用途**: 根据用户 ID 判定其部门与权限，返回首页显示的概览数值及当前用户可操作的按钮列表。
* **接口**: `POST /api/app/dashboard/summary`
* **请求体**:
  
  ```json
  {
    "user_id": "EMP001"
  }
  ```
  * `user_id`: String - 用户 ID。
* **返回数据**:
  
  ```json
  {
    "online_mold_count": 12,
    "pending_task_count": 3,
    "display_buttons": [
      { "id": "inquiry", "name": "模具查询", "icon": "fa-search", "color": "bg-indigo-500", "enabled": true, "badge": 0 },
      { "id": "transfer", "name": "模具转换", "icon": "fa-exchange-alt", "color": "bg-green-500", "enabled": true, "badge": 2 },
      { "id": "maintenance", "name": "保养执行", "icon": "fa-tools", "color": "bg-amber-500", "enabled": true, "badge": 5 },
      { "id": "repair", "name": "维修执行", "icon": "fa-wrench", "color": "bg-red-500", "enabled": true, "badge": 1 }
    ]
  }
  ```
  * `online_mold_count`: Number - 当前在线（机台上）的模具总数。
  * `pending_task_count`: Number - 待该用户处理的任务总数。
  * `display_buttons`: Array[Object] - 快捷功能按钮列表。
    * `id`: String - 按钮唯一标识（如 inquiry, transfer, maintenance, repair）。
    * `name`: String - 按钮显示名称。
    * `icon`: String - 按钮图标类名 (FontAwesome)。
    * `color`: String - 按钮背景颜色 (Tailwind 类名)。
    * `enabled`: Boolean - 按钮是否对该用户可用。
    * `badge`: Number - 该功能模块下的待办任务数。

---

## 3. 模具查询 (Mold Inquiry)

### 3.1 搜索模具列表

* **用途**: 根据 ID 或名称搜索模具。
* **接口**: `POST /api/app/molds/search`
* **请求体**:
  
  ```json
  {
    "q": "TY71", // 搜索关键词
    "page": 1,   // 当前页码 (从 1 开始)
    "page_size": 20 // 每页条数
  }
  ```
  * `q`: String - 搜索关键词（模具编号或名称）。
  * `page`: Number - 当前页码。
  * `page_size`: Number - 每页返回的数据条数。
* **返回数据**:
  
  ```json
  {
    "total": 125,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "mold_id": "UUID-TY71-001",
        "mold_code": "TY71",
        "name": "QFN-64 上模",
        "status": "IN_PRODUCTION", 
        "location": "MC-102",
        "vendor": "NXP_INTERNAL",
        "package_type": "QFN",
        "pin_code": "64",
        "shot_total": 450000,
        "life_limit": 500000,
        "buyoff_status": "PASS" 
      }
    ]
  }
  ```
  * `total`: Number - 符合搜索条件的总记录数。
  * `page`: Number - 当前页码。
  * `page_size`: Number - 每页条数。
  * `list`: Array[Object] - 模具列表。
    * `mold_id`: String - 模具系统唯一 ID。
    * `mold_code`: String - 模具显示编号（如 TY71）。
    * `name`: String - 模具名称。
    * `status`: Enum - 状态 (IN_PRODUCTION, MAINTENANCE, REPAIR, BACKUP, SCRAPPED)。
    * `location`: String - 当前机台或柜位编号。
    * `vendor`: String - 供应商。
    * `package_type`: String - 封装类型。
    * `pin_code`: String - Pin 数。
    * `shot_total`: Number - 当前累计冲次。
    * `life_limit`: Number - 设计寿命。
    * `buyoff_status`: Enum - BUYOFF 状态 (PASS, FAIL, PENDING)。

### 3.2 获取模具详情

* **用途**: 点击模具查看详细信息。
* **接口**: `POST /api/app/molds/detail`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY71"
  }
  ```
  * `mold_id`: String - 模具 ID。
* **返回数据**: 包含 3.1 中的所有字段及更多详细参数。

### 3.3 获取模具流转历史

* **用途**: 查看模具的历史维保和转换记录。
* **接口**: `POST /api/app/molds/history`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY71"
  }
  ```
  * `mold_id`: String - 模具 ID。
* **返回数据**:
  
  ```json
  [
    {
      "id": "WO_1001",
      "type": "MAINTENANCE", 
      "description": "常规半年 PM 保养",
      "created_at": "2026-01-10",
      "operator": "李四",
      "status": "COMPLETED"
    }
  ]
  ```
  * `id`: String - 工单或流程 ID。
  * `type`: Enum - 类型 (MAINTENANCE, REPAIR, TRANSFER, INSTALLATION)。
  * `description`: String - 活动描述。
  * `created_at`: String - 发生日期。
  * `operator`: String - 操作人员。
  * `status`: String - 完成状态。

### 3.4 获取模具 BOM 结构

* **用途**: 查看模具的全量 BOM 及核心组件寿命。
* **接口**: `POST /api/app/molds/bom`
* **请求体**:
  
  ```json
  {
    "mold_id": "UUID-TY71-001"
  }
  ```
  * `mold_id`: String - 模具系统唯一 ID。
* **返回数据**:
  
  ```json
  {
    "mold_id": "UUID-TY71-001",
    "mold_code": "TY71",
    "components": [
      {
        "name": "上模核心针",
        "sn": "SN-99821",
        "category": "上模件",
        "life_limit": 100000,
        "is_spare": true
      }
    ]
  }
  ```
  * `mold_id`: String - 模具系统唯一 ID。
  * `mold_code`: String - 模具显示编号。
  * `components`: Array[Object] - 组件列表。
    * `name`: String - 组件名称。
    * `sn`: String - 序列号。
    * `category`: String - 类别。
    * `life_limit`: Number - 设计寿命。
    * `is_spare`: Boolean - 是否为备件。

---

## 4. 维保执行流程 (Maintenance Flow)

### 4.1 获取待办保养任务

* **用途**: 列表展示分配给当前用户的保养任务。
* **接口**: `POST /api/app/maintenance/pending`
* **请求体**:
  
  ```json
  {
    "user_id": "EMP001" // 用户唯一标识
  }
  ```
* **返回数据**: 
  
  ```json
  [
    {
      "order_id": 101, // 维保工单 ID
      "order_no": "PM-20260305001", // 维保单号
      "mold_id": "UUID-TY71-001", // 模具系统 ID
      "mold_code": "TY71", // 模具编号
      "priority": "HIGH", // 优先级 (HIGH, MEDIUM, LOW)
      "status": "PENDING" // 状态
    }
  ]
  ```

### 4.2 获取保养项目配置

* **用途**: 根据模具 ID 获取该模具对应的保养标准检查项清单。
* **接口**: `POST /api/app/maintenance/config-items`
* **请求体**:
  
  ```json
  {
    "mold_id": "UUID-TY71-001" // 模具系统唯一 ID
  }
  ```
* **返回数据**: 
  
  ```json
  {
    "mold_id": "UUID-TY71-001", // 模具系统唯一 ID
    "items": [ // 检查项清单
      { "id": 1, "label": "型腔清洁", "required": true },
      { "id": 2, "label": "导柱润滑", "required": true }
    ]
  }
  ```

### 4.3 提交保养记录 (暂存/完成)

* **用途**: 提交保养作业内容。
* **接口**: `POST /api/app/maintenance/submit`
* **请求体**:
  
  ```json
  {
    "order_id": 101, // 维保工单 ID
    "selected_items": [1, 2], // 已勾选的项目 ID 列表
    "remark": "保养完成，状况良好", // 执行备注
    "is_finished": true, // 是否正式完成
    "destination": "CABINET", // 模具去向 (CABINET: 入柜, MACHINE: 回装机台)
    "photos": ["https://.../img1.jpg"] // 现场照片 URL 列表
  }
  ```

---

## 5. 维修执行流程 (Repair Flow)

### 5.1 获取待办维修任务

* **用途**: 列表展示分配给当前用户的维修任务。
* **接口**: `POST /api/app/repair/pending`
* **请求体**:
  
  ```json
  {
    "user_id": "EMP001" // 用户唯一标识
  }
  ```
* **返回数据**: 
  
  ```json
  [
    {
      "order_id": 201, // 维修工单 ID
      "order_no": "RE-20260305001", // 维修单号
      "mold_id": "UUID-TY71-001", // 模具系统 ID
      "mold_code": "TY71", // 模具编号
      "fault_description": "顶针复位不良", // 故障描述
      "priority": "URGENT", // 优先级
      "status": "IN_PROGRESS" // 状态
    }
  ]
  ```

### 5.2 获取维修检查项配置

* **用途**: 获取针对该维修任务的检查或常见故障处理清单。
* **接口**: `POST /api/app/repair/config-items`
* **请求体**:
  
  ```json
  {
    "order_id": 201 // 维修工单 ID
  }
  ```
* **返回数据**: 
  
  ```json
  {
    "order_id": 201, // 维修工单 ID
    "items": [ // 故障/检查项
      { "id": 10, "label": "检查顶针弹簧", "required": true },
      { "id": 11, "label": "更换易损件", "required": false }
    ]
  }
  ```

### 5.3 提交维修记录 (暂存/完成)

* **用途**: 提交维修处理结果。
* **接口**: `POST /api/app/repair/submit`
* **请求体**:
  
  ```json
  {
    "order_id": 201, // 维修工单 ID
    "selected_items": [10], // 已处理的项目 ID
    "remark": "已更换弹簧，测试正常", // 维修备注
    "is_finished": true, // 是否正式完成
    "destination": "CABINET", // 模具去向
    "photos": ["https://.../img2.jpg"] // 现场照片 URL
  }
  ```

---

## 6. 模具通用流转校验 (Common Flow Logic)

### 6.1 验证扫码模具

* **用途**: 流程中扫描模具二维码进行校验。
* **接口**: `POST /api/app/flow/scan-mold`
* **请求体**:
  
  ```json
  {
    "mold_id": "UUID-TY71-001", // 扫描到的模具 ID
    "flow_type": "MAINTENANCE" // 流程类型 (MAINTENANCE, REPAIR, TRANSFER, INSTALLATION)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "is_valid": true, // 扫码是否有效
    "mold": { 
      "mold_id": "UUID-TY71-001", 
      "mold_code": "TY71",
      "name": "QFN-64 上模", 
      "location": "MC-102", 
      "source_type": "MACHINE" 
    },
    "message": "" // 错误提示
  }
  ```

### 6.2 确认取模位置 (解绑)

* **用途**: 确认模具已从机台或柜位取出。
* **接口**: `POST /api/app/flow/confirm-source`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY71", // 模具 ID
    "source_type": "MACHINE", // 来源类型 (MACHINE: 机台, CABINET: 柜位)
    "source_code": "MC-102" // 具体编号
  }
  ```

### 6.3 机台生产能力判定 (还机/借机)

* **用途**: 拆下模具后，确认机台是否可继续生产。
* **接口**: `POST /api/app/flow/machine-status-update`
* **请求体**:
  
  ```json
  {
    "machine_id": "MC-102", // 机台 ID
    "can_produce": true // 是否还机 (true: 还机, false: 停机/借机)
  }
  ```

---

## 7. 模具安装与 BUYOFF (Installation & Buyoff)

### 7.1 发起/验证 BUYOFF 状态

* **用途**: 模具安装或回装机台时，验证外部系统 BUYOFF 结果。
* **接口**: `POST /api/external/buyoff/verify`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY101", // 模具 ID
    "machine_id": "MC-201" // 安装的目标机台 ID
  }
  ```
* **返回数据**: 
  
  ```json
  { 
    "status": "PASS", // 验证状态 (PASS, FAIL, PENDING)
    "message": "首件检查已通过" // 提示消息
  }
  ```

### 7.2 提交安装检查清单

* **用途**: 模具安装至机台后，提交人工检查清单并正式上线。
* **接口**: `POST /api/app/flow/complete-installation`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY101", // 模具 ID
    "machine_id": "MC-201", // 机台 ID
    "check_list": ["螺栓紧固", "水路测试"] // 检查项目文字列表
  }
  ```

---

## 8. 模具转换流程 (Transfer Flow)

### 8.1 获取生产待处理清单

* **用途**: 获取生产部门下发的模具拆下或安装任务。
* **接口**: `POST /api/app/transfer/pending-tasks`
* **请求体**: `{}`
* **返回数据**:
  
  ```json
  [
    { 
      "type": "REMOVE", // 任务类型 (REMOVE: 拆下, INSTALL: 安装)
      "mold_id": "UUID-TY71-001", // 模具 ID
      "mold_code": "TY71", // 模具编号
      "machine": "MC-102", // 来源/目标机台
      "reason": "达到保养冲次" // 操作原因
    }
  ]
  ```

### 8.2 模具拆下并同步冲次

* **用途**: 拆下模具时，记录最终冲次并自动触发保养。
* **接口**: `POST /api/app/transfer/remove-mold`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY71", // 模具 ID
    "machine_id": "MC-102", // 机台 ID
    "final_shot_count": 450012 // 最终确认的累计冲次
  }
  ```

### 8.3 模具位置绑定 (入柜)

* **用途**: 扫描模具柜位置码进行绑定。
* **接口**: `POST /api/app/transfer/location-bind`
* **请求体**:
  
  ```json
  {
    "mold_id": "TY71", // 模具 ID
    "location_code": "A1-02" // 柜位编号
  }
  ```

---

## 9. 实时数据接口 (Real-time & Sync)

### 9.1 获取机台当前冲次 (API 轮询备份)

* **用途**: 若 Socket 断开，通过 POST 接口获取最新冲次。
* **接口**: `POST /api/app/machine/current-shots`
* **请求体**:
  
  ```json
  {
    "machine_id": "MC-102" // 机台 ID
  }
  ```
* **返回数据**: 
  
  ```json
  { 
    "current_shots": 450012 // 当前累计冲次
  }
  ```

### 9.2 Socket.io 实时推送

* **用途**: 实时同步冲次。
* **事件**: `machine:shot_update`
* **Payload**: 
  
  ```json
  { 
    "machine_id": "MC-102", // 机台 ID
    "mold_id": "UUID-TY71-001", // 模具 ID
    "mold_code": "TY71", // 模具编号
    "current_shots": 450012, // 实时累计冲次
    "timestamp": "2026-03-05T08:15:00Z" // 时间戳
  }
  ```

---

## 10. 异常与通用逻辑说明

1. **POST 规范**: 所有查询类接口均需将参数放入 JSON 请求体中。
2. **状态流转约束**: 
   * `SCRAPPED` 状态模具禁止任何安装或转换操作。
   * `MAINTENANCE` 或 `REPAIR` 状态模具在未完成维保前禁止安装至机台。
3. **位置校验**: 
   * 执行“安装”前，系统需校验模具是否处于 `BACKUP` 状态或维保已完成。
   * 执行“拆下”前，系统需校验模具是否确实绑定在该机台。
