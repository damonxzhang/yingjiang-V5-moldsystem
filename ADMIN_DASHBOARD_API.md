# SmartMold 设备生产看板 API 接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold 管理后台（Admin Dashboard）及设备生产看板所需的数据接口及其数据结构。

**全局规范**：

* 所有接口统一采用 **POST** 方法。
* 请求体与返回数据均使用 **JSON** 格式。
* 字段命名遵循下划线命名法（snake_case）。
* 模具标识必须区分 `mold_id` (系统内唯一 UUID) 和 `mold_code` (用户可见编号)。

---

## 1. 认证与权限 (Auth & Permissions)

### 1.1 后台接口->登录页->管理员登录

* **用途**: 后台管理系统管理员登录，验证成功后返回用户信息及权限。
* **接口**: `POST /api/admin/auth/login`
* **请求体**:
  
  ```json
  {
    "username": "张英江", // 必填, 用户登录账号/姓名
    "password": "123456" // 必填, 登录密码
  }
  ```
* **返回数据**:
  
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...", // 访问令牌 (Bearer Token)
      "user_id": 1, // 用户系统内 ID
      "user_name": "张英江", // 用户登录名/姓名
      "email": "zhangyingjiang@example.com", // 用户绑定的邮箱地址
      "role": "ADMIN", // 用户所属的角色代码 (如: ADMIN, SUPER_ADMIN)
      "department": "大材料", // 用户所属的部门名称 (如: 大材料, 小材料)
      "permissions": [ // 该用户拥有的所有权限代码列表
        "DASHBOARD_VIEW",
        "MOLD_MANAGEMENT",
        "REPORT_EXPORT"
      ]
    }
  }
  ```

### 1.2 后台接口->登录页->获取权限信息

* **用途**: 获取当前登录管理者的基本信息及看板操作权限。
* **接口**: `POST /api/admin/auth/profile`
* **请求体**: 
  
  ```json
  {
    "user_id": 1 // 可选, 指定查询的用户 ID，如果不传则返回当前登录用户信息
  }
  ```
* **返回数据**:
  
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "user_id": 1, // 用户系统内唯一 ID
      "user_name": "看板管理员", // 用户登录名/姓名
      "email": "admin@example.com", // 用户邮箱地址
      "role": "SUPER_ADMIN", // 用户角色代码
      "department": "大材料", // 所属部门名称
      "permissions": [ // 用户拥有的权限代码列表
        "DASHBOARD_VIEW", // 查看看板权限
        "MACHINE_CONFIG", // 机台配置权限
        "MOLD_MANAGEMENT", // 模具管理权限
        "REPORT_EXPORT" // 报表导出权限
      ]
    }
  }
  ```

### 1.3 后台接口->登录页->获取左侧菜单

* **用途**: 获取当前登录管理员的左侧功能菜单树。
* **接口**: `POST /api/admin/auth/menu/left`
* **请求体**: 
  
  ```json
  {
    "user_id": 1 // 可选, 指定查询的用户 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 100, // 菜单唯一 ID
        "parent_id": 0, // 父级菜单 ID (0 代表顶级)
        "name": "生产看板", // 菜单显示名称
        "path": "/api/admin/dashboard/machines/status", // 对应的前端路由或接口地址
        "required_permissions": ["DASHBOARD_VIEW"] // 访问该菜单所需的权限代码
      },
      {
        "id": 200,
        "parent_id": 0,
        "name": "模具管理",
        "path": "/api/admin/mold/list",
        "required_permissions": ["MOLD_MANAGEMENT"],
        "children": [ // 子菜单列表
          {
            "id": 201,
            "parent_id": 200,
            "name": "新增模具档案",
            "path": "/api/admin/mold/save",
            "required_permissions": ["MOLD_MANAGEMENT"]
          }
        ]
      }
    ]
  }
  ```

---

## 2. 设备生产看板 (Equipment Production Dashboard)

### 2.1 后台接口->设备生产看板->模具机台设备列表

* **用途**: 渲染看板主界面，展示全厂设备的状态矩阵。通过 `department` 参数显式指定过滤范围。
* **接口**: `POST /api/admin/dashboard/machines/status`
* **请求体**:

  ```json
  {
    "department": "ALL",
    "only_alerts": false,
    "product_type": "",
    "type": "",
    "machine_code": "",
    "mold_code": "",
    "only_producible": false,
    "only_abnormal": false
  }
  ```
* **返回数据**:

  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "department": "ALL",
      "summary": { "total": 24, "normal": 18, "warning": 4, "critical": 2 },
      "machines": [
        {
          "machine_id": 1,
          "machine_code": "BMD-01",
          "status": "NORMAL",
          "part_no": "BMD-01",
          "type": "MOLDING_MACHINE",
          "mold_count": 4,
          "molds": [
            {
              "mold_id": 1,
              "mold_code": "MD-2026-001",
              "mold_number": "P1",
              "short_name": "T100",
              "current_shots": 450000,
              "max_shots": 500000,
              "status": "IN_USE",
              "life_percent": 90.0
            }
          ],
          "pending_todos_count": 3
        }
      ]
    }
  }
}
* **请求体参数备注**:
  * `type`: 机台类型，可通过 `2.10` 接口获取可选列表。
* **返回值参数备注**:
  * `pending_todos_count`: 机台待办清单条数（来自 `MachineTodos` 表的未读记录数）。

### 2.10 后台接口->设备生产看板->获取机台类型列表

* **用途**: 获取根据部门去重后的机台类型列表，用于看板头部的类型筛选。
* **接口**: `POST /api/admin/dashboard/machines/types`
* **请求体**:

  ```json
  {
    "department": "ALL" // 必填, 部门名称 (如: 大材料, 小材料, ALL)
  }
  ```
* **返回数据**:

  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      "MOLDING_MACHINE",
      "CLEANING_MACHINE",
      "TESTING_MACHINE"
    ]
  }
  ```

### 2.11 后台接口->设备生产看板->启用模具

* **用途**: 将模具状态从“停用”(`DEACTIVATED`) 恢复为“正常”(`IDLE`)。
* **校验规则**: 如果模具已绑定在机台，启用时会检查同机台其他已启用模具的产品类型是否一致。若不一致则报错。
* **接口**: `POST /api/admin/mold/enable`
* **请求体**:

  ```json
  {
    "mold_id": "1" // 必填, 模具 ID
  }
  ```
* **返回数据**: 
  - 成功: `{ "code": 200, "message": "模具已启用", "data": { "success": true } }`
  - 校验失败示例: `{ "code": 500, "message": "P2、P3产品类型不一致，请重新操作", "data": null }`

### 2.2 后台接口->设备生产看板->获取机台及模具槽位详细信息

* **用途**: 加载机台生产概况及各槽位模具的详细状态。
* **接口**: `POST /api/admin/machine/detail`
* **请求体**:

  ```json
  {
    "user_id": "1", // 可选, 操作用户 ID
    "machine_id": "1", // 必填, 机台 ID 或机台编号 (支持 MC-101 这种编号)
    "slot": "P2" // 可选, 指定查看的槽位 (如 P1, P2)。如果不传则默认选择该机台第一个有效槽位
  }
  ```
* **返回数据**:

  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "machine_id": 1,
      "machine_code": "MC-101",
      "machine_type": "MOLDING_MACHINE",
      "status": "NORMAL",
      "status_label": "启用",
      "department": "大材料",
      "product_type": "SOP-8",
      "batch_no": "LOT-123456",
      "pending_todos_count": 3,
      "slots": [
        { "slot": "P1", "short_name": "T100", "status": "NORMAL", "product_type": "SOP-8" },
        { "slot": "P2", "short_name": "EMPTY", "status": "EMPTY", "product_type": "N/A" }
      ],
      "current_mold": {
        "mold_id": 1,
        "mold_code": "T100",
        "short_name": "T100",
        "full_name": "Mold Full Name",
        "type": "Category",
        "product_type": "SOP-8",
        "is_active": true,
        "mold_status": "启用",
        "current_shots": "426153",
        "total_life": 500000,
        "life_percent": 85.23,
        "warning_threshold": 800000,
        "maintenance_status": "NORMAL",
        "remaining_life": 73847
      }
    }
  }
  ```
* **返回值参数备注**:
  * `status`: 机台状态 (NORMAL: 启用, DEACTIVATED: 停用, ABNORMAL: 异常)。
  * `status_label`: 机台状态中文说明 (启用 / 停用 / 异常)。
  * `pending_todos_count`: 该机台在 `MachineTodos` 表中的未读待办清单总条数。
  * `slots`: 机台所有槽位的列表。
    * `status`: 槽位状态 (NORMAL: 正常, EMPTY: 空闲, MAINTENANCE: 维保中, REPAIR: 报修中)。
  * `current_mold`: 当前选中槽位绑定的模具详细信息。
    * `mold_status`: 模具业务状态 (启用 / 停用)。
    * `current_shots`: 当前模次，返回字符串格式。
    * `life_percent`: 寿命使用百分比。
    * `maintenance_status`: 维保状态 (NORMAL: 正常, WARNING: 预警, CRITICAL: 临界)。

### 2.3 后台接口->设备生产看板->创建保养任务

* **用途**: 手动为指定机台/模具创建保养工单。
* **接口**: `POST /api/admin/tasks/maintenance/create`
* **请求体**:

  ```json
  {
    "machine_id": "1",
    "mold_id": "1",
    "user_id": "1",
    "start_time": "2026-03-05 03:19",
    "end_time": "2026-03-05 07:19",
    "description": "例行保养"
  }
  ```
* **返回数据**: `{ "code": 200, "data": { "success": true, "task_id": 123 } }`

### 2.4 后台接口->设备生产看板->创建报修任务

* **用途**: 手动为指定机台/模具创建报修工单。
* **接口**: `POST /api/admin/tasks/repair/create`
* **请求体**:

  ```json
  {
    "machine_id": "1",
    "mold_id": "1",
    "user_id": "1",
    "fault_description": "发现模具边缘磨损，需紧急修复"
  }
  ```
* **返回数据**: `{ "code": 200, "data": { "success": true, "task_id": 456 } }`

### 2.5 后台接口->设备生产看板->模具安装卸载

* **用途**: 执行“安装模具”或“卸载模具”操作，并记录流转历史。
* **接口**: `POST /api/admin/machine/mold-action`
* **请求体**:

  ```json
  {
    "action": "INSTALL",
    "machine_id": "1",
    "slot": "P1",
    "mold_id": "1",
    "user_id": "1"
  }
  ```
* **返回数据**: `{ "code": 200, "message": "success", "data": { "success": true } }`

### 2.6 后台接口->设备生产看板->安装模具->库存模具清单

* **用途**: 获取可用于安装的闲置模具清单。
* **接口**: `POST /api/admin/dashboard/mold/inventory`
* **请求体**:

  ```json
  {
    "machine_id": "1",
    "slot": "P1",
    "department": "ALL"
  }
  ```
* **返回数据**: 包含机台上下文和 `molds` 列表的 JSON 对象。

### 2.7 后台接口->设备生产看板->安装模具->执行模具安装

* **用途**: 在库存清单中确认并执行模具安装到指定机台槽位。
* **接口**: `POST /api/admin/machine/install`
* **请求体**:

  ```json
  {
    "action": "INSTALL",
    "machine_id": "1",
    "slot": "P4",
    "mold_id": "1",
    "user_id": "1"
  }
  ```
* **返回数据**: `{ "code": 200, "data": { "success": true } }`

### 2.8 后台接口->设备生产看板->停用模具

* **用途**: 将模具状态设置为停用（如报废或长期封存）并记录原因。
* **接口**: `POST /api/admin/mold/disable`
* **请求体**:

  ```json
  {
    "mold_id": "1",
    "reason": "手动触发停用",
    "user_id": "4"
  }
  ```
* **返回数据**: `{ "code": 200, "data": { "success": true } }`

### 2.9 后台接口->设备生产看板->机台待办清单列表

* **接口说明**: 根据机台 ID 在 `MachineTodos` 表中查询所有未读（`is_read = 0`）的待办事项。这些事项是在执行模具安装、卸载、保养、报修或停用操作时自动生成的，用于提醒看板用户有新的操作记录需要关注。
* **接口**: `POST /api/admin/machine/todo-list`
* **请求体**:

  ```json
  {
    "machine_id": "1" // 必填, 机台 ID
  }
  ```
* **返回数据**:

  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1, // 待办记录 ID
        "machine_id": 1, // 机台 ID
        "mold_id": 1, // 模具 ID
        "mold_code": "MD-2026-001", // 模具编号
        "slot": "P1", // 槽位
        "user_id": 1, // 操作人 ID
        "user_name": "张英江", // 操作人姓名
        "created_at": "2026-04-11 10:00:00", // 创建时间
        "is_read": 0, // 是否已读 (0:未读, 1:已读)
        "type": "MAINTENANCE", // 待办类型
        "payload": { // 提交时的原始 JSON 数据
          "machine_id": "1",
          "mold_id": "1",
          "description": "例行保养"
        }
      }
    ]
  }
  ```
* **返回值参数备注**:
  * `id`: 待办记录的唯一自增 ID。
  * `machine_id`: 该待办事项所属的机台 ID。
  * `mold_id`: 关联的模具 ID。
  * `mold_code`: 模具的业务编号，用于前端显示。
  * `slot`: 模具操作所在的槽位编号（如 P1, P2, P3, P4）。
  * `user_id`: 执行该操作并触发待办事项的用户 ID。
  * `user_name`: 执行操作的用户姓名（从 `users` 表关联获取）。
  * `created_at`: 待办事项的创建时间，也是操作发生的时间。
  * `is_read`: 已读状态标记。0 表示未读（默认），1 表示已读。本接口仅返回未读记录。
  * `type`: 待办事项的类型，定义了操作的性质，包括：
    * `MAINTENANCE`: 创建保养任务产生的待办。
    * `REPAIR`: 创建报修任务产生的待办。
    * `INSTALL`: 安装模具操作产生的待办。
    * `UNINSTALL`: 卸载模具操作产生的待办。
    * `DISABLE`: 模具停用操作产生的待办。
  * `payload`: 一个 JSON 对象，存储了触发该待办时接口提交的所有原始请求参数，方便追溯具体操作细节。

---

## 3. 模具机台绑定 (Mold-Machine Binding)

### 3.1 后台接口->模具机台绑定->左侧选择模具接口
* **用途**: 获取当前闲置中的模具列表，用于绑定模台功能。
* **接口**: `POST /api/admin/dashboard/molds/available`

### 3.2 后台接口->模具机台绑定->获取机台编号接口
* **用途**: 获取所有已注册的机台编号及 ID。
* **接口**: `POST /api/admin/dashboard/machines/codes`

### 3.3 后台接口->模具机台绑定->根据机台查询模台接口
* **用途**: 获取指定机台当前槽位的绑定状态。
* **接口**: `POST /api/admin/machine-slots/machine-slots`

### 3.4 后台接口->模具机台绑定->机台模台绑定接口
* **用途**: 将模具绑定到指定的机台和一个或多个槽位。
* **接口**: `POST /api/admin/machine-slots/bind`

### 3.5 后台接口->模具机台绑定->解绑模具
* **用途**: 解除模具与机台/槽位的绑定关系。
* **接口**: `POST /api/admin/machine-slots/unbind`

### 3.6 后台接口->模具机台绑定->根据模具查看绑定关系
* **用途**: 根据模具 ID 查询其当前绑定的所有机台及槽位信息。
* **接口**: `POST /api/admin/machine-slots/mold-binding`

### 3.7 后台接口->绑定模台
* **用途**: 获取当前可供绑定的正常状态机台列表。
* **接口**: `POST /api/admin/dashboard/machines/available`

---

## 4. 机台模台配置 (Machine Slot Configuration)

### 4.1 后台接口->机台模台配置->机台列表
* **用途**: 获取机台与模台（槽位）的绑定关系列表。
* **接口**: `POST /api/admin/machine-slots/list`

### 4.2 后台接口->机台模台配置->保存槽位配置
* **用途**: 批量保存或更新机台的槽位配置。
* **接口**: `POST /api/admin/machine-slots/save`

---

## 5. 模具管理 (Mold Management)

### 5.1 后台接口->模具管理->模具台账
* **用途**: 获取模具台账列表，支持部门、编号、状态筛选。
* **接口**: `POST /api/admin/mold/list`

### 5.2 后台接口->模具管理->模具库查询
* **用途**: 弹出模具库列表，支持高级搜索和分页。
* **接口**: `POST /api/admin/mold/library`

### 5.3 后台接口->模具管理->模具详情
* **用途**: 获取指定模具的详细档案参数。
* **接口**: `POST /api/admin/mold/detail`

### 5.4 后台接口->模具管理->保存模具档案
* **用途**: 新增或更新模具档案信息。
* **接口**: `POST /api/admin/mold/save`

### 5.5 后台接口->模具管理->切换模具状态
* **用途**: 启用或停用模具档案状态。
* **接口**: `POST /api/admin/mold/toggle-status`
* **请求体**:
  ```json
  {
    "mold_id": "1", // 必填, 模具 ID
    "status": "IDLE" // 必填, 状态 (IDLE: 启用, DEACTIVATED: 禁用)
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "模具已启动", // 或 "模具已禁用"
    "data": {
      "success": true
    }
  }
  ```
* **逻辑说明**:
  * 如果状态切换为 `IDLE` (启用)，系统会检查该模具是否已绑定在机台。
  * 若已绑定，则进一步校验同机台其他已启用模具的 `product_type` 是否一致。如果不一致将返回 400 错误。

### 5.6 后台接口->模具管理->内部配件监控
* **用途**: 监控模具内部组件的寿命。
* **接口**: `POST /api/admin/mold/internal-components`

---

## 6. 任务管理 (Task Management)

### 6.1 后台接口->任务管理->维保/维修列表
* **接口**: `POST /api/admin/tasks/maintenance/list` 或 `POST /api/admin/tasks/repair/list`

### 6.2 后台接口->任务管理->任务审核
* **用途**: 管理员审核维保或维修任务结果。
* **接口**: `POST /api/admin/tasks/verify`

### 6.3 后台接口->任务管理->任务详情
* **接口**: `POST /api/admin/tasks/maintenance/detail` 或 `POST /api/admin/tasks/repair/detail`

---

## 7. 备件管理 (Spare Parts Management)

### 7.1 后台接口->备件管理->备件列表
* **接口**: `POST /api/admin/spare-parts/list`

### 7.2 后台接口->备件管理->库存变动
* **接口**: `POST /api/admin/spare-parts/move`

### 7.3 后台接口->备件管理->采购预测
* **接口**: `POST /api/admin/spare-parts/prediction/list`

---

## 8. 机台台账 (Machine Base)

### 8.1 后台接口->机台台账->机台列表
* **用途**: 获取机台台账列表，支持部门、编号、状态筛选。
* **接口**: `POST /api/admin/machine-base/list`
* **请求体**:
  ```json
  {
    "department": "ALL", // 必填, 部门名称 (如: 大材料, 小材料, ALL)
    "machine_code": "", // 可选, 机台编号模糊查询
    "status": "", // 可选, 状态 (NORMAL, ABNORMAL, etc.)
    "page": 1,
    "page_size": 20
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total": 100,
      "list": [
        {
          "machine_id": 1,
          "machine_code": "MC-101",
          "status": "NORMAL",
          "location": "A区-01",
          "type": "MOLDING_MACHINE",
          "part_no": "P-1001",
          "total_slots": 4,
          "department": "大材料",
          "created_at": "2026-04-11 10:00:00"
        }
      ]
    }
  }
  ```

### 8.2 后台接口->机台台账->获取机台详情
* **用途**: 获取指定机台的详细档案参数。
* **接口**: `POST /api/admin/machine-base/detail`
* **请求体**:
  ```json
  {
    "machine_id": 1 // 必填, 机台 ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "machine_id": 1,
      "machine_code": "MC-101",
      "status": "NORMAL",
      "location": "A区-01",
      "type": "MOLDING_MACHINE",
      "part_no": "P-1001",
      "total_slots": 4,
      "department_id": 1,
      "department": "大材料"
    }
  }
  ```

### 8.3 后台接口->机台台账->新增/编辑机台
* **用途**: 新增或更新机台档案信息。
* **接口**: `POST /api/admin/machine-base/save`
* **请求体**:
  ```json
  {
    "machine_id": null, // 可选, 编辑时传机台 ID，新增时不传或传 null
    "machine_code": "MC-2026-001", // 必填, 机台编号
    "department": "大材料", // 必填, 部门名称
    "status": "NORMAL", // 可选, 状态
    "location": "A区-01", // 可选, 位置
    "type": "MOLDING_MACHINE", // 可选, 类型
    "part_no": "P-1001", // 可选, 资产编号
    "total_slots": 4 // 可选, 槽位数量
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "新增成功", // 或 "更新成功"
    "data": {
      "machine_id": 101
    }
  }
  ```

### 8.4 后台接口->机台台账->删除机台
* **用途**: 删除指定机台（需先解绑所有模具）。
* **接口**: `POST /api/admin/machine-base/delete`
* **请求体**:
  ```json
  {
    "machine_id": 1 // 必填, 机台 ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "删除成功",
    "data": null
  }
  ```

### 8.5 后台接口->机台台账->切换机台状态
* **用途**: 启用、禁用或标记机台异常。
* **接口**: `POST /api/admin/machine/toggle-status`
* **请求体**:
  ```json
  {
    "machine_id": "1", // 必填, 机台 ID
    "status": "NORMAL", // 必填, 状态 (NORMAL: 启用, DISABLED: 禁用, FAULT: 异常)
    "user_id": "1", // 可选, 操作人 ID
    "reason": "手动停用" // 可选, 停用理由
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "机台已启动", // 或 "机台已停用", "机台状态标记为异常"
    "data": {
      "success": true
    }
  }
  ```

### 8.6 后台接口->机台台账->获取机台状态变更记录
* **用途**: 查询机台的历史状态变更记录（启用/停用/异常），支持按部门筛选。
* **接口**: `POST /api/admin/machine/status-history`
* **请求体**:
  ```json
  {
    "department": "ALL", // 可选, 部门 (大材料, 小材料, ALL)
    "page": 1, // 可选, 页码, 默认 1
    "page_size": 10 // 可选, 每页条数, 默认 10
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total": 15,
      "items": [
        {
          "id": 1,
          "machine_id": 1,
          "machine_code": "MC-101",
          "action": "ENABLE",
          "reason": "正常启用",
          "operator_id": 1,
          "operator_name": "张三",
          "created_at": "2026-04-18 10:00:00"
        }
      ],
      "page": 1,
      "page_size": 10
    }
  }
  ```

### 9. 模具管理 (Mold Management)
