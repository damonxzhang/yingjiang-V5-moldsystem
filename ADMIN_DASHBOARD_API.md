# SmartMold 设备生产看板 API 接口需求文档 (V2 - 完整梳理版)

本文档详细说明了 SmartMold 管理后台（Admin Dashboard）及设备生产看板所需的数据接口及其数据结构。

**全局规范**：

* 所有接口统一采用 **POST** 方法。
* 请求体与返回数据均使用 **JSON** 格式。
* 字段命名遵循下划线命名法（snake_case）。
* 模具标识必须区分 `mold_id` (系统内唯一 ID) 和 `mold_code` (用户可见编号)。

---

## 1. 认证与菜单 (Auth & Menu)

### 1.1 后台接口->登录页->管理员登录
* **接口**: `POST /api/admin/auth/login`
* **请求体**:
  ```json
  {
    "username": "张英江", // 必填, 用户名
    "password": "123456" // 必填, 密码
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "token": "eyJhbG...", // JWT Token
      "user_id": 1,
      "user_name": "张英江",
      "email": "zhangyingjiang@example.com",
      "role": "ADMIN", // 角色: ADMIN, MANAGER, OPERATOR, SUPER_ADMIN
      "department": "大材料",
      "permissions": ["DASHBOARD_VIEW", "MOLD_MANAGEMENT"]
    }
  }
  ```

### 1.2 后台接口->登录页->获取权限信息
* **接口**: `POST /api/admin/auth/profile`
* **请求体**:
  ```json
  {
    "user_id": "1", // 可选, 用户ID或用户名
    "username": "张英江" // 可选
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "user_id": 1,
      "user_name": "张英江",
      "email": "zhangyingjiang@example.com",
      "role": "ADMIN",
      "department": "大材料",
      "permissions": ["DASHBOARD_VIEW", "MOLD_MANAGEMENT"]
    }
  }
  ```

### 1.3 后台接口->登录页->获取左侧菜单
* **接口**: `POST /api/admin/menu/left`
* **请求体**:
  ```json
  {
    "user_id": "1" // 可选
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 100,
        "parent_id": 0,
        "name": "生产看板",
        "path": "/api/admin/dashboard/machines/status",
        "required_permissions": ["DASHBOARD_VIEW"],
        "children": []
      }
    ]
  }
  ```

---

## 2. 生产看板 (Dashboard)

### 2.1 后台接口->设备生产看板->模具机台设备列表
* **接口**: `POST /api/admin/dashboard/machines/status`
* **请求体**:
  ```json
  {
    "department": "ALL", // 部门筛选: ALL, 大材料, 小材料
    "only_alerts": false, // 是否仅显示异常机台
    "product_type": "", // 产品类型筛选
    "type": "", // 机台类型筛选
    "machine_code": "", // 机台编号模糊搜索
    "mold_code": "", // 模具编号模糊搜索
    "only_producible": false, // 仅显示可生产
    "only_abnormal": false // 仅显示状态异常模具
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "department": "ALL",
      "summary": {
        "total": 10,
        "normal": 8,
        "warning": 1,
        "critical": 1,
        "maintenance_due": 0,
        "overdue": 0,
        "disabled": 0
      },
      "machines": [
        {
          "machine_id": 1,
          "machine_code": "BMD-01",
          "status": "NORMAL", // 机台状态: NORMAL, WARNING, CRITICAL, DISABLED, MAINTENANCE_DUE, OVERDUE
          "part_no": "BMD-01",
          "type": "MOLDING",
          "mold_count": 2,
          "molds": [
            {
              "mold_id": 1,
              "mold_code": "MD001",
              "mold_number": "P1", // 槽位号
              "full_name": "精密模具A",
              "short_name": "模具A",
              "name": "模具A",
              "mold_category": "UPPER",
              "product_type": "SOP-8",
              "current_shots": 1000,
              "max_shots": 500000,
              "status": "IN_USE", // 模具状态: IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED
              "life_percent": 0.2
            }
          ],
          "pending_todos_count": 0 // 机台待办未读数
        }
      ]
    }
  }
  ```

### 2.2 后台接口->设备生产看板->获取机台类型列表
* **接口**: `POST /api/admin/dashboard/machines/types`
* **请求体**:
  ```json
  {
    "department": "ALL"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": ["MOLDING", "CLEANING"]
  }
  ```

### 2.3 后台接口->设备生产看板->获取机台及模具槽位详细信息
* **接口**: `POST /api/admin/machine/detail`
* **请求体**:
  ```json
  {
    "machine_id": "1", // 机台 ID 或机台编号
    "slot": "P1" // 可选, 指定槽位
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "machine_id": 1,
      "machine_code": "BMD-01",
      "machine_type": "MOLDING",
      "department": "大材料",
      "product_type": "SOP-8",
      "batch_no": "LOT-123456",
      "pending_todos_count": 0,
      "slots": [
        {
          "slot": "P1",
          "short_name": "模具A",
          "status": "IN_USE",
          "product_type": "SOP-8",
          "mold_status": "启用" // 状态标签
        }
      ],
      "current_mold": {
        "mold_id": 1,
        "mold_code": "MD001",
        "short_name": "模具A",
        "full_name": "精密模具A",
        "type": "UPPER",
        "product_type": "SOP-8",
        "is_active": true,
        "current_shots": 1000,
        "total_life": 500000,
        "life_percent": 0.2,
        "warning_threshold": 800000,
        "maintenance_status": "NORMAL",
        "remaining_life": 499000
      }
    }
  }
  ```

### 2.4 后台接口->设备生产看板->创建保养任务
* **接口**: `POST /api/admin/tasks/maintenance/create`
* **请求体**:
  ```json
  {
    "machine_id": "1", // 可选
    "mold_id": "1", // 必填
    "user_id": "1", // 必填
    "start_time": "2026-03-05 03:19", // 必填
    "end_time": "2026-03-05 07:19", // 可选
    "description": "例行保养" // 必填
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true,
      "task_id": 1
    }
  }
  ```

### 2.5 后台接口->设备生产看板->创建报修任务
* **接口**: `POST /api/admin/tasks/repair/create`
* **请求体**:
  ```json
  {
    "machine_id": "1", // 必填
    "mold_id": "1", // 必填
    "user_id": "1", // 必填
    "fault_description": "发现模具边缘磨损" // 必填
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true,
      "task_id": 2
    }
  }
  ```

### 2.6 后台接口->设备生产看板->模具安装卸载
* **接口**: `POST /api/admin/machine/mold-action`
* **请求体**:
  ```json
  {
    "action": "INSTALL", // 必填, INSTALL 或 UNINSTALL
    "machine_id": "1", // 必填
    "slot": "P1", // 必填
    "mold_id": "1", // 必填
    "user_id": "1" // 必填
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true
    }
  }
  ```

### 2.7 后台接口->设备生产看板->安装模具->库存模具清单
* **接口**: `POST /api/admin/dashboard/mold/inventory`
* **请求体**:
  ```json
  {
    "machine_id": "1",
    "slot": "P1",
    "department": "ALL"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "header": {
        "machine_code": "BMD-01",
        "current_product": "QFN-16",
        "lot_number": "LOT-123456"
      },
      "molds": [
        {
          "mold_id": 1,
          "mold_code": "MD001",
          "name": "精密模具A",
          "full_name": "精密模具A",
          "short_name": "模具A",
          "thickness": "2.5mm",
          "mold_category": "UPPER",
          "product_type": "QFN",
          "package_type": "QFN",
          "package_size": "5x5",
          "pin_code": "64",
          "department_id": 1,
          "life_limit": 500000,
          "current_shots": 1000,
          "status": "IDLE",
          "health_score": 100,
          "next_audit_date": "2026-05-18",
          "vendor": "供应商A",
          "cabinet_code": "CAB-101",
          "location": "CAB-101",
          "maintenance_cycle": "50K",
          "maintenance_start_time": "2026-03-29",
          "created_at": "2026-04-18 10:00:00",
          "updated_at": "2026-04-18 10:00:00",
          "machine_id": null,
          "is_in_cabinet": true,
          "machine_code": null,
          "max_shots": 500000,
          "usage_percent": 0.2,
          "can_install": true
        }
      ]
    }
  }
  ```

### 2.8 后台接口->设备生产看板->安装模具->执行模具安装
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
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true
    }
  }
  ```

### 2.9 后台接口->设备生产看板->启用模具
* **接口**: `POST /api/admin/mold/enable`
* **请求体**:
  ```json
  {
    "mold_id": "1"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "模具已启用",
    "data": {
      "success": true
    }
  }
  ```

### 2.10 后台接口->设备生产看板->停用模具
* **接口**: `POST /api/admin/mold/disable`
* **请求体**:
  ```json
  {
    "mold_id": "1",
    "reason": "手动触发停用",
    "user_id": "4"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "模具已停用",
    "data": {
      "success": true
    }
  }
  ```

### 2.11 后台接口->设备生产看板->机台待办清单列表
* **接口**: `POST /api/admin/machine/todo-list`
* **请求体**:
  ```json
  {
    "machine_id": "1"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "machine_id": 1,
        "mold_id": 1,
        "mold_code": "MD001",
        "slot": "P1",
        "user_id": 1,
        "user_name": "张英江",
        "created_at": "2026-04-18 10:00:00",
        "is_read": 0,
        "type": "INSTALL", // INSTALL, UNINSTALL, MAINTENANCE, REPAIR, DISABLE
        "payload": "{...}" // 原始请求参数 JSON 字符串
      }
    ]
  }
  ```

### 2.12 后台接口->设备生产看板->机台启用/停用
* **接口**: `POST /api/admin/machine/toggle-status`
* **请求体**:
  ```json
  {
    "machine_id": 1, // 机台 ID 或机台编号
    "user_id": 1, // 操作人 ID
    "action": "DISABLE", // ENABLE 或 DISABLE
    "reason": "设备维护中"
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "机台已停用",
    "data": {
      "success": true,
      "new_status": "DISABLED"
    }
  }
  ```

### 2.13 后台接口->设备生产看板->获取机台状态变更记录
* **接口**: `POST /api/admin/machine/status-history`
* **请求体**:
  ```json
  {
    "machine_id": 1,
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
      "total": 1,
      "list": [
        {
          "id": 1,
          "machine_id": 1,
          "machine_code": "BMD-01",
          "action": "DISABLE",
          "reason": "设备维护中",
          "operator_id": 1,
          "operator_name": "张英江",
          "created_at": "2026-04-18 10:00:00"
        }
      ]
    }
  }
  ```


---

## 3. 机台模台管理 (Machine & Slots)

### 3.1 后台接口->模具机台绑定->左侧选择模具接口
* **接口**: `POST /api/admin/dashboard/molds/available`
* **请求体**:
  ```json
  {
    "department": "ALL", // 选填, 部门筛选: ALL, 大材料, 小材料
    "mold_code": "" // 选填, 模具编号模糊搜索
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "mold_id": 1,
        "mold_code": "MD-2026-001",
        "short_name": "T101",
        "status": "IDLE", // 状态: IDLE(闲置), IN_USE(使用中), MAINTENANCE(保养), REPAIR(维修), DEACTIVATED(停用)
        "product_type": "QFN",
        "department": "大材料"
      }
    ]
  }
  ```

### 3.2 后台接口->模具机台绑定->获取机台编号接口
* **接口**: `POST /api/admin/dashboard/machines/codes`
* **请求体**:
  ```json
  {
    "department": "ALL" // 选填, 部门筛选: ALL, 大材料, 小材料
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "machine_id": 1,
        "machine_code": "MT-01",
        "department": "大材料"
      }
    ]
  }
  ```

### 3.3 后台接口->模具机台绑定->根据机台查询模台接口
* **接口**: `POST /api/admin/machine-slots/machine-slots`
* **请求体**:
  ```json
  {
    "machine_id": 1, // 必填, 机台ID
    "mold_id": 1 // 选填, 模具ID (用于判断当前模具是否已绑定到该槽位)
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "slot": "P1",
        "mold_id": 1, // 已绑定的模具ID, 为空表示槽位空闲
        "mold_code": "MD-2026-001",
        "mold_name": "精密模具",
        "is_bound": "已绑定", // 文字描述: 已绑定, 未绑定
        "slot_status": "NORMAL" // 槽位状态: NORMAL, EMPTY
      }
    ]
  }
  ```

### 3.4 后台接口->模具机台绑定->机台模台绑定接口
* **接口**: `POST /api/admin/machine-slots/bind`
* **请求体**:
  ```json
  {
    "mold_id": 1, // 必填, 模具ID
    "machine_id": 1, // 必填, 机台ID
    "slots": [ // 必填, 槽位列表
      { "slot": "P1" },
      { "slot": "P2" }
    ]
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

### 3.5 后台接口->模具机台绑定->解绑模具
* **接口**: `POST /api/admin/machine-slots/unbind`
* **请求体**:
  ```json
  {
    "mold_id": 1, // 必填, 模具ID
    "machine_id": 1, // 必填, 机台ID
    "slot": "P1" // 必填, 槽位号
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

### 3.6 后台接口->模具机台绑定->根据模具查看绑定关系
* **接口**: `POST /api/admin/machine-slots/mold-binding`
* **请求体**:
  ```json
  {
    "mold_id": 1 // 必填, 模具ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "mold_id": 1,
        "mold_code": "MD-2026-001",
        "mold_name": "精密模具",
        "machine_id": 1,
        "machine_code": "MT-01",
        "slot": "P1",
        "status": "NORMAL",
        "bound_at": "2026-04-18 10:00:00"
      }
    ]
  }
  ```

### 3.7 后台接口->机台模台配置->机台列表
* **接口**: `POST /api/admin/machine-slots/list`
* **请求体**:
  ```json
  {
    "department": "ALL", // 选填, 部门筛选: ALL, 大材料, 小材料
    "machine_code": "" // 选填, 机台编号模糊搜索
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "machine_id": 1,
        "machine_name": "MT-01",
        "machine_status": "NORMAL",
        "location": "A1-01",
        "slots": [
          {
            "slot": "P1",
            "mold_id": 1,
            "mold_code": "MD-2026-001",
            "mold_name": "精密模具",
            "is_bound": "已绑定",
            "slot_status": "NORMAL"
          }
        ]
      }
    ]
  }
  ```

### 3.8 后台接口->机台模台配置->保存槽位配置
* **接口**: `POST /api/admin/machine-slots/save`
* **请求体**:
  ```json
  {
    "machine_id": 1, // 必填, 机台ID
    "slots": [ // 必填, 槽位配置列表
      { "slot": "P1", "status": 1 }, // status: 1-启用/绑定, 2-禁用/解绑
      { "slot": "P2", "status": 2 }
    ]
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---

## 4. 模具管理 (Mold Management)

### 4.1 后台接口->模具管理->模具台账
* **接口**: `POST /api/admin/mold/list`
* **请求体**:
  ```json
  {
    "department": "ALL", // 选填, 部门筛选: ALL, 大材料, 小材料
    "mold_code": "", // 选填, 模具编号模糊搜索
    "status": "", // 选填, 状态筛选: IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED
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
          "mold_id": 1,
          "mold_code": "MD-2026-001",
          "short_name": "T101",
          "full_name": "精密模具T101",
          "mold_category": "Upper",
          "product_type": "QFN",
          "location": "库房",
          "thickness": "2.5mm",
          "package_type": "QFN",
          "package_size": "7x7",
          "current_shots": 12000,
          "max_shots": 500000,
          "maintenance_cycle": "50K",
          "start_time": "2026-03-29",
          "current_machine": "MT-01",
          "status": "IDLE",
          "department": "大材料"
        }
      ]
    }
  }
  ```

### 4.2 后台接口->模具管理->模具库查询
* **接口**: `POST /api/admin/mold/library`
* **请求体**:
  ```json
  {
    "keyword": "", // 选填, 模具编号或名称搜索
    "status": "", // 选填, 状态筛选
    "package_type": "", // 选填, 封装类型筛选
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
      "current_machine": "BMD-01",
      "current_product": "BGA-64",
      "current_batch": "LOT-649444",
      "list": [
        {
          "mold_id": 1,
          "mold_code": "MD-2026-001",
          "name": "模具A",
          "short_name": "T101",
          "status": "IDLE",
          "is_in_cabinet": true,
          "machine_code": null,
          "usage_percent": 2.4,
          "can_install": true
        }
      ]
    }
  }
  ```

### 4.3 后台接口->模具管理->模具详情
* **接口**: `POST /api/admin/mold/detail`
* **请求体**:
  ```json
  {
    "user_id": "1", // 必填, 用户ID
    "mold_id": "1" // 必填, 模具ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "mold_id": 1,
      "mold_code": "MD-2026-001",
      "name": "模具A",
      "full_name": "精密模具T101",
      "short_name": "T101",
      "thickness": "2.5mm",
      "mold_category": "Upper",
      "product_type": "QFN",
      "package_type": "QFN",
      "package_size": "7x7",
      "pin_code": "64",
      "department": "大材料",
      "life_limit": 500000,
      "maintenance_cycle": "50K",
      "start_time": "2026-03-29",
      "current_shots": 12000,
      "status": "IDLE",
      "location": "库房",
      "machine_code": "MT-01"
    }
  }
  ```

### 4.4 后台接口->模具管理->保存模具档案
* **接口**: `POST /api/admin/mold/save`
* **请求体**:
  ```json
  {
    "user_id": "1", // 必填, 用户ID
    "department": "大材料", // 选填, 部门: 大材料, 小材料
    "mold_id": "", // 选填, 有ID则更新, 无ID则新增
    "mold_code": "MD-2026-001", // 必填
    "short_name": "T101", // 必填
    "thickness": "2.5mm", // 必填
    "mold_category": "Upper", // 必填
    "product_type": "QFN", // 必填
    "package_type": "QFN", // 必填
    "pin_code": "64", // 必填
    "maintenance_cycle": "50K", // 必填
    "start_time": "2026-03-29", // 必填
    "life_limit": 500000 // 选填, 默认500000
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true,
      "mold_id": 1,
      "message": "保存成功"
    }
  }
  ```

### 4.5 后台接口->模具管理->切换模具状态
* **接口**: `POST /api/admin/mold/toggle-status`
* **请求体**:
  ```json
  {
    "mold_id": "1", // 必填, 模具ID
    "status": "IDLE" // 必填, 状态: IDLE(启动), DEACTIVATED(禁用)
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "success": true,
      "message": "模具已启动"
    }
  }
  ```

### 4.6 后台接口->绑定模台 (获取可用机台)
* **接口**: `POST /api/admin/dashboard/machines/available`
* **请求体**:
  ```json
  {
    "department": "ALL" // 选填, 部门筛选: ALL, 大材料, 小材料
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "machine_id": 1,
        "machine_code": "MT-01"
      }
    ]
  }
  ```

### 4.7 后台接口->模具管理->内部配件监控
* **接口**: `POST /api/admin/mold/internal-components`
* **请求体**:
  ```json
  {
    "mold_id": "1" // 必填, 模具ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "upper": [], // 上模配件
      "lower": [], // 下模配件
      "transfer": [] // 传递配件
    }
  }
  ```

### 5.1 后台接口->任务管理->维保列表
* **接口**: `POST /api/admin/tasks/maintenance/list`
* **请求体**:
  ```json
  {
    "page": 1,
    "page_size": 20,
    "status": "PENDING", // 选填, 状态筛选: PENDING, IN_PROGRESS, COMPLETED, ALL
    "keyword": "" // 选填, 搜索单号或模具编号
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total": 10,
      "list": [
        {
          "task_id": 1,
          "order_no": "WO-M-202604181000",
          "task_source": "MANUAL",
          "mold_code": "MD-2026-001",
          "operator": "张三",
          "result": "OK",
          "action_count": 5,
          "completion_time": "2026-04-18 12:00:00",
          "status": "PENDING",
          "created_at": "2026-04-18 10:00:00"
        }
      ]
    }
  }
  ```

### 5.2 后台接口->任务管理->维修列表
* **接口**: `POST /api/admin/tasks/repair/list`
* **请求体**:
  ```json
  {
    "page": 1,
    "page_size": 20,
    "status": "PENDING" // 选填, 状态筛选
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total": 5,
      "list": [
        {
          "task_id": 1,
          "order_no": "WO-R-202604181000",
          "mold_code": "MD-2026-001",
          "main_operator": "李四",
          "repair_category": "紧急维修",
          "repair_method": "更换配件",
          "acceptor": "王五",
          "action_count": 3,
          "downtime_impact": "2h",
          "final_location": "MT-01",
          "status": "PENDING"
        }
      ]
    }
  }
  ```

### 5.3 后台接口->任务管理->维保详情
* **接口**: `POST /api/admin/tasks/maintenance/detail`
* **请求体**:
  ```json
  {
    "task_id": "1" // 必填, 任务ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "task_id": 1,
      "order_no": "WO-M-202604181000",
      "mold_code": "MD-2026-001",
      "machine_id": null,
      "status": "PENDING",
      "operator": "张三",
      "start_time": "2026-04-18 10:00:00",
      "end_time": null,
      "check_items": [
        { "item_id": 1, "item_name": "清洁", "is_selected": true }
      ],
      "spare_parts_used": [
        { "spare_id": 1, "name": "顶针", "quantity": 2, "unit": "PCS" }
      ]
    }
  }
  ```

### 5.4 后台接口->任务管理->维修详情
* **接口**: `POST /api/admin/tasks/repair/detail`
* **请求体**:
  ```json
  {
    "task_id": "1" // 必填, 任务ID
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "task_id": 1,
      "order_no": "WO-R-202604181000",
      "mold_code": "MD-2026-001",
      "machine_id": 1,
      "status": "PENDING",
      "operator": "李四",
      "fault_description": "磨损",
      "repair_category": "紧急维修",
      "repair_method": "更换配件",
      "check_items": [],
      "spare_parts_replaced": [],
      "start_time": "2026-04-18 10:00:00",
      "end_time": null
    }
  }
  ```

### 5.5 后台接口->任务管理->任务审核
* **接口**: `POST /api/admin/tasks/verify`
* **请求体**:
  ```json
  {
    "task_id": "1", // 必填, 任务ID
    "type": "MAINTENANCE", // 必填, 类型: MAINTENANCE, REPAIR
    "status": "PASSED", // 必填, 状态: PASSED(通过), REJECTED(驳回)
    "remark": "审核通过" // 选填, 备注
  }
  ```
* **返回数据**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": []
  }
  ```
