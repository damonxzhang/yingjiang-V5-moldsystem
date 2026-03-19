# SmartMold Web 后台管理系统 - 接口汇总文档 (V2 - 详细版)

本文档详细汇总了 SmartMold Web 后台管理系统中所有页面、按钮及交互所需的接口细节。

## 1. 全局规范 (Global Standards)

* **方法**: 所有接口统一采用 **POST**。
* **格式**: 请求与返回均使用 **JSON**。
* **命名**: 字段使用下划线规则 (snake_case)。
* **标识**: 模具必须区分 `mold_id` (UUID) 和 `mold_code` (编号)。
* **返回数据的标准结构**:
```json
   {
        "code": 200,          //状态码
        "message": "success", //返回信息
        "data": {             //返回的data信息
            "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
            "user_name": "看板管理员" // 用户真实姓名
        }
    }
```

---

* **状态码**: 。

| 状态码 |  说明 |
| :--- | :--- |
| 200 | 成功，返回正常数据 |
| 400| 异常,同时会在message提示异常信息 |


## 2. 身份认证与全局 (Auth & Global)

### 2.1 管理员登录

* **用途**: 管理员进入系统，获取访问令牌。
* **接口**: `POST /api/admin/auth/login`
* **请求体**:
  
  ```json
  {
    "user_name": "admin", // 登录用户名
    "password": "password123" // 登录密码
  }
  ```
* **返回数据**:
  
  ```json
   {
        "code": 200,
        "message": "success",
        "data": {
            "token": "Bearer",  // 访问令牌，后续请求需携带在 Header (Authorization: Bearer <token>) 中
            "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
            "user_name": "看板管理员", // 用户真实姓名
            "role": "SUPER_ADMIN", // 角色代码：SUPER_ADMIN(超级管理), MAINTAINER(维保员), OPERATOR(操作员)
            "permissions": [ // 拥有的功能权限点列表
              "DASHBOARD_VIEW",   // 查看看板权限
              "MACHINE_CONFIG",   // 机台配置权限
              "MOLD_MANAGEMENT",  // 模具管理权限
              "REPORT_EXPORT"     // 报表导出权限
            ]
        }
    }
  ```

### 2.1.1 左侧菜单

* **用途**: 人员登录系统后左侧菜单栏列表。
* **接口**: `POST /api/admin/menu/left`
* **请求体**:
  
  ```json
  {
     "token": "Bearer",  // 访问令牌，需携带在 Header (Authorization: Bearer <token>) 中
     "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
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
            "parent_id": 0,
            "name": "生产看板",
            "path": "/api/admin/dashboard/machines/status"
        },
        {
            "id": 2,
            "parent_id": 0,
            "name": "模具台账(大材料)",
            "path": "/api/admin/mold/list",
            "meta":[ 
                {
                    "id": 3,
                    "parent_id": 2,
                    "name": "新增模具档案"
                }
            ]
        },
        {
            "id": 4,
            "parent_id": 0,
            "name": "备件管理(大材料)",
            "path": "/api/admin/spare-parts/list",
            "meta":[          //菜单页面中的按钮
                {
                    "id": 5,
                    "parent_id": 4,
                    "name": "批量导入"
                },
                {
                    "id": 6,
                    "parent_id": 4,
                    "name": "新增备件档案"
                }
            ],
            "children": [     //如果有二级菜单,以children的json数组形式返回
                {
                    "id": 5,
                    "parent_id": 4,
                    "name": "二级菜单-备件历史",
                    "path": "/api/admin/spare-parts/history",
                    "meta":[ 
                        {
                            "id": 6,
                            "parent_id": 5,
                            "name": "导出按钮"
                        },
                        {
                            "id": 7,
                            "parent_id": 5,
                            "name": "新增按钮"
                        }
                    ]
                },
                {
                    "id": 8,
                    "parent_id": 4,
                    "name": "二级菜单-其它",
                    "path": "/api/admin/spare-parts/other",
                    "meta":[ 
                        {
                            "id": 9,
                            "parent_id": 8,
                            "name": "导出按钮"
                        },
                        {
                            "id": 10,
                            "parent_id": 8,
                            "name": "新增按钮"
                        }
                    ]
                }
            ]
        }
    ]
}
  ```


### 2.1.2 右侧列表页---> 以模具台账(大材料列表为例)

* **用途**: 用于“模具台账 (大材料/小材料)”及“Audit 清单”页面，支持多维度筛选。
* **接口**: `POST /api/admin/mold/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "keyword": "", // 搜索词：支持模具编号或名称模糊查询
    "is_audit_mode": false, // 是否为 Audit 模式：true(仅看需 Audit 的模具), false(普通台账)
    "status": "ALL", // 状态筛选：IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED, ALL
    "page": 1, // 当前页码
    "page_size": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 100, // 符合条件的模具总数
        "list": [ // 模具台账简要信息列表
            { 
                "mold_id": "TY71", // 模具系统内唯一 ID
                "mold_code": "MD-2024-001", // 模具编号
                "short_name": "BGA-01", // 模具简称
                "mold_category": "大材料模具", // 分类
                "product_type": "BGA", // 产品类型
                "location": "CAB-A01", // 位置 (库位或机台)
                "thickness": "250mm", // 厚度
                "package_type": "QFN", // PACKAGE TYPE
                "package_size": "HD", // PACKAGE SIZE
                "current_shots": 45200, // 实时 SHOT COUNT
                "max_shots": 500000, // SHOT 上限
                "maintenance_cycle": "30天", // 保养周期
                "start_date": "2026-01-01", // 开始时间
                "current_machine": "离线/库房", // 所在设备 (机台编号或状态)
                "machine_status": "闲置", // 设备上的状态 (闲置, 使用中, 保养中)
                "is_active": true, // 状态是否有效
                "status": "IDLE", // 业务状态 (IDLE, MAINTENANCE, USING)
                "department": "大材料", // 所属部门
                "operate":[   // 列表右侧操作栏按钮
                    { 
                        "id": 11,  //按钮id
                        "parent_id": 2,  //按钮所属页面id
                        "name": "BOM"   //按钮名称
                    },
                    { 
                        "id": 12,      //按钮在列表页的id值是一致的,因为按钮显示隐藏以菜单栏页面权限为准
                        "parent_id": 2,
                        "name": "停用"
                    }
                ]
            }
        ]
    }
}
  ```


### 2.2 获取管理员信息

* **用途**: 页面加载或刷新时，通过 Token 获取当前登录用户的详细信息及权限。
* **接口**: `POST /api/admin/auth/profile`
* **请求体**: 
  
  ```json
  {
    "user_id": "ADM001" // 用户唯一标识 (工号/UUID)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "user_name": "看板管理员", // 用户姓名
    "role": "SUPER_ADMIN", // 角色代码：SUPER_ADMIN(超级管理), MAINTAINER(维保员), OPERATOR(操作员)
    "permissions": [ // 拥有的功能权限点列表
      "DASHBOARD_VIEW",   // 查看看板权限
      "MACHINE_CONFIG",   // 机台配置权限
      "MOLD_MANAGEMENT",  // 模具管理权限
      "REPORT_EXPORT"     // 报表导出权限
    ]
  }
  ```

---

## 3. 生产看板 (Production Dashboard)

* **备注**: 此部分接口内容请参考 [ADMIN_DASHBOARD_API.md](file:///d:/其他项目/NXP/归档/张英江/模具管理系统/设计方案/原型方案-第六版-正式启动/ADMIN_DASHBOARD_API.md) 文档。

---

## 4. 模具管理 (Mold Management)

### 4.1 获取模具台账列表

* **用途**: 用于“模具台账 (大材料/小材料)”及“Audit 清单”页面，支持多维度筛选。
* **接口**: `POST /api/admin/mold/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "keyword": "", // 搜索词：支持模具编号或名称模糊查询
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "is_audit_mode": false, // 是否为 Audit 模式：true(仅看需 Audit 的模具), false(普通台账)
    "status": "ALL", // 状态筛选：IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED, ALL
    "page": 1, // 当前页码
    "page_size": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 100, // 符合条件的模具总数
    "list": [ // 模具台账简要信息列表
      { 
        "mold_id": "TY71", // 模具系统内唯一 ID
        "mold_code": "MD-2024-001", // 模具编号
        "short_name": "BGA-01", // 模具简称
        "mold_category": "大材料模具", // 分类
        "product_type": "BGA", // 产品类型
        "location": "CAB-A01", // 位置 (库位或机台)
        "thickness": "250mm", // 厚度
        "package_type": "QFN", // PACKAGE TYPE
        "package_size": "HD", // PACKAGE SIZE
        "current_shots": 45200, // 实时 SHOT COUNT
        "max_shots": 500000, // SHOT 上限
        "maintenance_cycle": "30天", // 保养周期
        "start_date": "2026-01-01", // 开始时间
        "current_machine": "离线/库房", // 所在设备 (机台编号或状态)
        "machine_status": "闲置", // 设备上的状态 (闲置, 使用中, 保养中)
        "is_active": true, // 状态是否有效
        "status": "IDLE", // 业务状态 (IDLE, MAINTENANCE, USING)
        "department": "大材料" // 所属部门
      }
    ]
  }
  ```

### 4.2 新增/编辑模具档案 (含基本参数与 BOM)

* **用途**: 统一处理模具档案的创建与更新。
* **接口**: `POST /api/admin/mold/save`
* **请求体**: 
  
  ```json
  {
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "mold_id": "MD-2024-001", // 编辑时必填，新增时传空串或不传
    "mold_code": "T100", // 模具编号
    "short_name": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度参数
    "mold_category": "大材料模具", // 模具类别名称
    "product_type": "BGA", // 适用产品类型
    "package_type": "QFN", // 适用封装类型
    "pin_code": "A", // Pin Code 标识
    "department": "大材料", // 所属部门
    "life_limit": 500000, // 额定总寿命冲次
    "maintenance_cycle": "30天", // 保养周期 (MAINT CYCLE)
    "start_time": "2026-01-01", // 开始保养时间 (START TIME)
    "components": [ // 模具 BOM 结构/组成部件列表
      { 
        "category": "上模件", // 部件所属分类 (如：上模件、下模件、中模件)
        "name": "上模盒",     // 部件具体名称
        "sn": "#1/6-100597", // 部件序列号或唯一标识
        "is_spare": false,    // 是否为消耗性备件：true(是), false(否)
        "life_limit": "N/A"   // 该部件的寿命限制 (如有，无则传 "N/A")
      }
    ]
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "mold_id": "MD-2024-001", // 保存成功的模具 ID
    "message": "模具档案保存成功" // 返回的提示消息
  }
  ```

### 4.3 获取模具完整详情 (含 BOM)

* **用途**: 在编辑模具或查看模具详情详情时调用。
* **接口**: `POST /api/admin/mold/detail`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "mold_id": "MD-2024-001" // 模具唯一 ID
  }
  ```
* **返回数据**: 
  
  ```json
  {
    "mold_id": "MD-2024-001", // 模具唯一 ID
    "mold_code": "T100", // 模具编号
    "short_name": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度
    "mold_category": "大材料模具", // 模具类别
    "product_type": "BGA", // 产品类型
    "package_type": "QFN", // 封装类型
    "pin_code": "A", // Pin Code
    "department": "大材料", // 所属部门
    "life_limit": 500000, // 额定寿命冲次
    "maintenance_cycle": "30天", // 保养周期 (MAINT CYCLE)
    "start_time": "2026-01-01", // 开始保养时间 (START TIME)
    "shot_total": 456789, // 实时当前累计总冲次
    "status": "IDLE", // 当前状态
    "components": [ // BOM 组成部件列表
      { 
        "category": "上模件", // 部件分类
        "name": "上模盒", // 部件名称
        "sn": "#1/6-100597", // 序列号
        "is_spare": false, // 是否备件
        "life_limit": "N/A" // 寿命限制
      }
    ]
  }
  ```

### 4.4 停用模具

* **用途**: 在模具台账页面对模具进行报废或长期停用处理。
* **接口**: `POST /api/admin/mold/deactivate`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MD-2024-001", // 模具唯一 ID
    "reason": "寿命已满且无法修复", // 停用或报废的原因描述
    "user_id": "ADM001" // 执行操作的管理员 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "模具已成功停用" // 返回的提示消息
  }
  ```

---

## 5. Audit 清单 (Audit Checklist)

### 5.1 获取 Audit 模具列表

* **用途**: 专门用于“Audit 清单”页面，默认仅展示需要 Audit 的模具。
* **接口**: `POST /api/admin/mold/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "keyword": "", // 搜索词：支持模具编号或名称模糊查询
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "is_audit_mode": true, // 是否为 Audit 模式：在此接口中默认为 true
    "status": "ALL", // 状态筛选：IDLE, IN_USE, MAINTENANCE, REPAIR, DEACTIVATED, ALL
    "page": 1, // 当前页码
    "page_size": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 100, // 符合条件的模具总数
    "list": [ // 模具台账简要信息列表
      { 
        "mold_id": "TY71", // 模具系统内唯一 ID
        "mold_code": "MD-2024-001", // 模具编号
        "short_name": "BGA-01", // 模具简称
        "mold_category": "大材料模具", // 分类
        "product_type": "BGA", // 产品类型
        "location": "CAB-A01", // 位置 (库位或机台)
        "thickness": "250mm", // 厚度
        "package_type": "QFN", // PACKAGE TYPE
        "package_size": "HD", // PACKAGE SIZE
        "current_shots": 45200, // 实时 SHOT COUNT
        "max_shots": 500000, // SHOT 上限
        "maintenance_cycle": "30天", // 保养周期
        "start_date": "2026-01-01", // 开始时间
        "current_machine": "离线/库房", // 所在设备 (机台编号或状态)
        "machine_status": "闲置", // 设备上的状态 (闲置, 使用中, 保养中)
        "is_active": true, // 状态是否有效
        "status": "IDLE", // 业务状态 (IDLE, MAINTENANCE, USING)
        "department": "大材料" // 所属部门
      }
    ]
  }
  ```

### 5.2 新增/编辑 Audit 模具档案 (含基本参数与 BOM)

* **用途**: 统一处理模具档案的创建与更新。
* **接口**: `POST /api/admin/mold/save`
* **请求体**: 
  
  ```json
  {
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "mold_id": "MD-2024-001", // 编辑时必填，新增时传空串或不传
    "mold_code": "T100", // 模具编号
    "short_name": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度参数
    "mold_category": "大材料模具", // 模具类别名称
    "product_type": "BGA", // 适用产品类型
    "package_type": "QFN", // 适用封装类型
    "pin_code": "A", // Pin Code 标识
    "department": "大材料", // 所属部门
    "life_limit": 500000, // 额定总寿命冲次
    "maintenance_cycle": "30天", // 保养周期 (MAINT CYCLE)
    "start_time": "2026-01-01", // 开始保养时间 (START TIME)
    "components": [ // 模具 BOM 结构/组成部件列表
      { 
        "category": "上模件", // 部件所属分类 (如：上模件、下模件、中模件)
        "name": "上模盒",     // 部件具体名称
        "sn": "#1/6-100597", // 部件序列号或唯一标识
        "is_spare": false,    // 是否为消耗性备件：true(是), false(否)
        "life_limit": "N/A"   // 该部件的寿命限制 (如有，无则传 "N/A")
      }
    ]
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "mold_id": "MD-2024-001", // 保存成功的模具 ID
    "message": "模具档案保存成功" // 返回的提示消息
  }
  ```

### 5.3 获取 Audit 模具完整详情 (含 BOM)

* **用途**: 在编辑模具或查看模具详情详情时调用。
* **接口**: `POST /api/admin/mold/detail`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "mold_id": "MD-2024-001" // 模具唯一 ID
  }
  ```
* **返回数据**: 
  
  ```json
  {
    "mold_id": "MD-2024-001", // 模具唯一 ID
    "mold_code": "T100", // 模具编号
    "short_name": "BGA-01", // 模具简称
    "thickness": "250mm", // 模具厚度
    "mold_category": "大材料模具", // 模具类别
    "product_type": "BGA", // 产品类型
    "package_type": "QFN", // 封装类型
    "pin_code": "A", // Pin Code
    "department": "大材料", // 所属部门
    "life_limit": 500000, // 额定寿命冲次
    "maintenance_cycle": "30天", // 保养周期 (MAINT CYCLE)
    "start_time": "2026-01-01", // 开始保养时间 (START TIME)
    "shot_total": 456789, // 实时当前累计总冲次
    "status": "IDLE", // 当前状态
    "components": [ // BOM 组成部件列表
      { 
        "category": "上模件", // 部件分类
        "name": "上模盒", // 部件名称
        "sn": "#1/6-100597", // 序列号
        "is_spare": false, // 是否备件
        "life_limit": "N/A" // 寿命限制
      }
    ]
  }
  ```

### 5.4 停用 Audit 模具

* **用途**: 在模具台账页面对模具进行报废或长期停用处理。
* **接口**: `POST /api/admin/mold/deactivate`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MD-2024-001", // 模具唯一 ID
    "reason": "寿命已满且无法修复", // 停用或报废的原因描述
    "user_id": "ADM001" // 执行操作的管理员 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "模具已成功停用" // 返回的提示消息
  }
  ```

---

## 6. 维保与任务中心 (Maintenance & Tasks)

### 6.1 获取保养记录列表

* **用途**: 用于“任务中心”、“保养执行记录”页面。
* **接口**: `POST /api/admin/tasks/maintenance/list`
* **请求体**: 

  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "status": "PENDING",   // 任务状态：PENDING(待执行), COMPLETED(已完成), ALL(全部)
    "keyword": "",         // 搜索词 (模具编号/工单号)
    "start_date": "",      // 筛选开始日期
    "end_date": "",        // 筛选结束日期
    "page": 1, 
    "page_size": 10 
  }
  ```
* **返回数据**:

  ```json
  {
    "total": 50,
    "list": [
      {
        "task_id": "MT-2026-001", 
        "order_no": "WO-M-240501-01", // 工单编号
        "task_source": "SCHEDULED",   // 任务来源：SCHEDULED(定时任务), TEMPORARY(临时添加)
        "mold_code": "MD-2024-001",   // 模具对象 (编号)
        "operator": "张三",           // 执行人员
        "result": "OK",               // 保养结果：OK, WAIT, NG
        "acceptance_status": "PASSED", // 验收状态：PASSED(通过), NONE(未验收), REJECTED(驳回)
        "action_count": 2,            // 执行项数 (XX 项动作)
        "completion_time": "2024-05-01 10:15", // 完成时间
        "storage_location": "CAB-B2-01" // 归位 (存放库位/机台)
      }
    ]
  }
  ```

### 6.2 获取维修记录列表

* **用途**: 用于“任务中心”、“维修执行记录”页面。
* **接口**: `POST /api/admin/tasks/repair/list`
* **请求体**: 

  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "status": "PENDING",   // 任务状态
    "keyword": "",         // 搜索词
    "start_date": "", 
    "end_date": "",
    "page": 1, 
    "page_size": 10 
  }
  ```
* **返回数据**:

  ```json
  {
    "total": 20,
    "list": [
      {
        "task_id": "RT-2026-001", 
        "order_no": "WO-R-240510-01", // 工单编号
        "mold_code": "MD-2024-071",   // 模具对象 (编号)
        "main_operator": "王技师",    // 主修人
        "repair_category": "小修",    // 维修类别：小修, 中修, 大修
        "repair_method": "内部维修",  // 维修方式：内部维修, 外委维修
        "acceptor": "李工",           // 验收人
        "action_count": 3,            // 维修项目数 (XX 项动作)
        "downtime_impact": "机台已恢复", // 停机影响：机台已恢复, 借机停机
        "final_location": "MT-08",    // 最终归位
        "status": "IN_PROGRESS"      // 任务状态
      }
    ]
  }
  ```

### 6.3 任务审核与验收

* **用途**: 管理员对已完成的保养或维修任务进行审核确认。
* **接口**: `POST /api/admin/tasks/verify`
* **请求体**: 

  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "task_id": "MT-2026-001", // 任务单号
    "task_type": "MAINTENANCE", // 任务类型 (MAINTENANCE, REPAIR)
    "status": "APPROVED", // 审核结果：APPROVED(通过), REJECTED(驳回)
    "remark": "保养到位，可以投产" // 审核备注
  }
  ```
* **返回数据**: 
  
  ```json
  { "success": true, "message": "任务审核已完成" }
  ```

### 6.4 获取保养任务详情

* **用途**: 查看保养任务的详细信息，包括保养项目勾选情况。
* **接口**: `POST /api/admin/tasks/maintenance/detail`
* **请求体**: 

  ```json
  { 
    "user_id": "ADM001", 
    "task_id": "MT-2026-001" 
  }
  ```
* **返回数据**:

  ```json
  {
    "task_id": "MT-2026-001",
    "order_no": "PM-20260305001",
    "mold_code": "T100",
    "machine_id": "BMD-01",
    "status": "PENDING",
    "operator": "张工",
    "start_time": "2026-03-05 08:00",
    "end_time": "2026-03-05 10:00",
    "check_items": [ // 保养项目列表
      {
        "item_id": "CHK-001",
        "item_name": "清理分型面",
        "is_completed": true,
        "result": "OK", // OK, NG
        "remark": ""
      },
      {
        "item_id": "CHK-002",
        "item_name": "检查顶针润滑",
        "is_completed": false,
        "result": "",
        "remark": ""
      }
    ],
    "spare_parts_used": [ // 保养中消耗的备件
      {
        "spare_id": "SP-001",
        "name": "顶针润滑油",
        "quantity": 1,
        "unit": "瓶"
      }
    ]
  }
  ```

### 6.5 获取维修任务详情

* **用途**: 查看维修任务的详细信息，包括故障原因和处理过程。
* **接口**: `POST /api/admin/tasks/repair/detail`
* **请求体**: 

  ```json
  { 
    "user_id": "ADM001", 
    "task_id": "RT-2026-001" 
  }
  ```
* **返回数据**:

  ```json
  {
    "task_id": "RT-2026-001",
    "order_no": "RE-20260305001",
    "mold_code": "T100",
    "machine_id": "BMD-01",
    "status": "IN_PROGRESS",
    "operator": "李工",
    "fault_description": "顶针复位不良",
    "root_cause": "弹簧疲劳断裂", // 故障根本原因
    "action_taken": "更换同规格弹簧并重新调试", // 处理措施
    "spare_parts_replaced": [ // 更换的配件
      {
        "spare_id": "SP-005",
        "name": "顶针弹簧",
        "quantity": 2,
        "unit": "PCS"
      }
    ],
    "start_time": "2026-03-05 09:00",
    "end_time": "2026-03-05 11:30"
  }
  ```

### 6.6 导出保养记录

* **用途**: 导出保养记录报表。
* **接口**: `GET /api/admin/tasks/maintenance/export`
* **请求参数**: 
  * `user_id`: "ADM001",
  * `status`: "ALL",
  * `start_date`: "2026-01-01",
  * `end_date`: "2026-03-31"
* **返回**: 二进制流 (Excel 文件)

### 6.7 导出维修记录

* **用途**: 导出维修记录报表。
* **接口**: `GET /api/admin/tasks/repair/export`
* **请求参数**: 
  * `user_id`: "ADM001",
  * `status`: "ALL",
  * `start_date`: "2026-01-01",
  * `end_date`: "2026-03-31"
* **返回**: 二进制流 (Excel 文件)

---

## 7. 备件管理 (Spare Parts)

### 7.1 获取备件列表及预警

* **用途**: 获取备件库存状态，高亮显示低于安全库存的备件。
* **接口**: `POST /api/admin/spare-parts/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "filter_alerts": false, // 是否仅查看预警项：true(仅看库存不足), false(全部)
    "keyword": "", // 备件名称/规格模糊搜索关键词
    "page": 1, // 当前页码
    "page_size": 20 // 每页记录数
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 30, // 符合条件的备件总数
    "summary": { // 顶部概览数据
      "total_categories": 2, // 备件总品类
      "stock_alerts": 1, // 库存预警品类
      "shot_alerts": 0, // 冲次预警品类
      "monthly_consumption": 12450 // 本月消耗额 (¥)
    },
    "list": [ // 备件信息列表
      {
        "spare_id": "SP-001", // 备件唯一 ID (对应图中的编号)
        "name": "加热棒 220V", // 备件名称
        "category": "电气件", // 备件分类
        "current_stock": 15, // 当前库存数量
        "min_stock": 5, // 最低阈值 (安全库存)
        "shot_count": "无需统计", // 冲次统计描述 (如 "452,000" 或 "无需统计")
        "is_track_shots": false, // 是否单独计算 shot count：true(是), false(否)
        "status": "NORMAL", // 状态：NORMAL(正常), LOW_STOCK(库存不足), SHOT_EXPIRED(寿命到期)
        "suggested_purchase": { // 建议采购数量 (AI 预测)
          "amount": 0, // 建议数量
          "message": "库存充足，暂无建议" // 建议描述
        }
      },
      {
        "spare_id": "SP-003", 
        "name": "精密 POT (15mm)", 
        "category": "Transfer件", 
        "current_stock": 2, 
        "min_stock": 5, 
        "shot_count": "无需统计", 
        "is_track_shots": false,
        "status": "LOW_STOCK", 
        "suggested_purchase": {
          "amount": 13, 
          "message": "库存已跌破阈值",
          "is_recommended": true // 是否为推荐操作 (对应图中的 RECOMMENDED 标签)
        }
      }
    ]
  }
  ```

### 7.2 备件入库/出库

* **用途**: 手动调整备件库存。
* **接口**: `POST /api/admin/spare-parts/move`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "spare_id": "SP-001", // 备件唯一 ID
    "type": "STOCK_IN", // 动作类型：STOCK_IN(入库), STOCK_OUT(出库)
    "amount": 10,       // 操作数量 (正整数)
    "remark": "季度采购入库" // 操作原因/备注
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "new_stock": 15, // 操作完成后的最新库存总量
    "message": "库存更新成功" // 返回的提示消息
  }
  ```

### 7.3 备件购买预测【待定】

* **用途**: 根据模具生产计划及当前配件消耗率，预测未来备件需求。
* **接口**: `POST /api/admin/spare-parts/prediction/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "plan_id": "PLAN-2026-Q2", // 关联的生产计划 ID
    "time_horizon": "30d"      // 预测时间跨度：7d(一周), 30d(一月), 90d(一季)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "prediction_id": "PR-001", // 预测结果记录 ID
    "items": [ // 备件需求明细列表
      {
        "spare_id": "SP-001", // 备件 ID
        "name": "上模顶针", // 备件名称
        "predicted_usage": 12, // 预计消耗量
        "current_stock": 5, // 当前库存量
        "gap": 7, // 缺口量 (预计消耗 - 当前库存)
        "recommendation": "建议本周下单采购 10 PCS" // 系统给出的采购建议
      }
    ]
  }
  ```

### 7.4 批量导入备件

* **用途**: 支持通过 Excel 批量导入备件基础档案信息。
* **接口**: `POST /api/admin/spare-parts/import`
* **请求**: `Multipart/form-data`
* **参数**:
  * `file`: Excel 文件对象 (支持 .xls, .xlsx)
  * `user_id`: "ADM001" // 操作人 ID
* **返回数据**:
  
  ```json
  {
    "success": true,
    "imported_count": 150, // 成功导入数量
    "failed_count": 2, // 导入失败数量
    "errors": [ // 失败详情 (如有)
      { "row": 12, "reason": "备件编号已存在" }
    ],
    "message": "导入完成，成功 150 条，失败 2 条"
  }
  ```

### 7.5 下载备件导入模板

* **用途**: 提供标准的 Excel 模板供用户下载填写。
* **接口**: `GET /api/admin/spare-parts/template`
* **请求参数**: 
  * `user_id`: "ADM001"
* **返回**: 二进制流 (Excel 模板文件)

### 7.6 新增/编辑备件档案

* **用途**: 手动创建新备件记录或修改现有备件信息。
* **接口**: `POST /api/admin/spare-parts/save`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 操作人 ID
    "spare_id": "", // 备件唯一 ID (新增时为空，编辑时必传)
    "name": "加热棒 220V", // 备件名称
    "category": "电气件", // 备件分类
    "unit": "PCS", // 计量单位
    "min_stock": 5, // 最低库存阈值
    "is_track_shots": false, // 是否单独计算 shot count
    "department": "大材料", // 所属部门
    "remark": "备品备注信息" // 备注
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 是否成功
    "spare_id": "SP-001", // 生成或更新的备件 ID
    "message": "保存成功" // 提示消息
  }
  ```

---

## 8. 生产配置与监控 (Production Config & Monitor)

### 8.1 可生产产品 LIST

* **用途**: 获取各产线机台及其绑定的产品 SKU 和模具准备状态。
* **接口**: `POST /api/admin/production/hierarchy`
* **请求体**: 
  
  ```json
  {
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "department": "大材料" // 部门过滤：大材料, 小材料, ALL
  }
  ```
* **返回数据**:
  
  ```json
  [
    {
      "machine_id": "BMD-14", // 机台唯一 ID
      "available_products": [ // 该机台支持生产的产品列表
        {
          "sku": "5220", // 产品 SKU 编号
          "slots": [ // 该产品涉及的生产槽位状态
            { 
              "id": "P1", // 槽位 ID (如 P1, P2)
              "mold_id": "M1", // 预定使用的模具 ID
              "param_ready": true, // 生产参数设定是否就绪 (Checklist 项)
              "mold_ready": true,  // 模具物理安装是否就绪 (Checklist 项)
              "buyoff_ready": true // 质量验收/首检是否就绪 (Checklist 项)
            }
          ]
        }
      ]
    }
  ]
  ```

### 8.2 切换生产就绪状态

* **用途**: 在生产监控页面点击勾选/取消各项就绪状态。
* **接口**: `POST /api/admin/production/toggle-ready`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "machine_id": "BMD-14", // 机台 ID
    "sku": "5220", // 产品 SKU
    "slot_id": "P1", // 槽位 ID
    "type": "PARAM", // 状态类型：PARAM(参数), MOLD(模具), BUYOFF(验收)
    "ready": true    // 目标状态：true(已就绪), false(未就绪)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "状态切换成功" // 返回的提示消息
  }
  ```

### 8.3 实时 Shot 数监控

* **用途**: 实时查看各模具的消耗比例及预警状态。
* **接口**: `POST /api/admin/monitor/shot-counts`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "process": "注塑", // 工序过滤
    "package_type": "BGA" // 封装类型过滤
  }
  ```
* **返回数据**:
  
  ```json
  {
    "count": 12, // 返回的记录条数
    "data": [ // 实时冲次数据列表
      { 
        "mold_id": "M1", // 模具 ID
        "mold_code": "T100", // 模具编号
        "current_shots": 450000, // 当前累计冲次
        "limit_shots": 500000, // 额定总寿命冲次
        "wornout": 90 // 磨损/消耗百分比 (0-100)
      }
    ]
  }
  ```

---

## 9. 模具配件绑定 (Mold-Spare Binding)

* **业务逻辑**: 用于建立模具与常用备件之间的关联关系。在维保领料或备件预警时，系统将根据此绑定关系及“建议装配量”自动计算缺口。

### 9.1 获取模具及其绑定的备件列表

* **用途**: 区分部门展示模具清单，并可查看特定模具已绑定的所有备件及其实时库存。
* **接口**: `POST /api/admin/mold/spare-bindings/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "department": "大材料", // 部门过滤：大材料, 小材料, ALL(全部)
    "keyword": "", // 模具编号/名称搜索
    "mold_id": "", // 特定模具 ID (可选，若传此值则仅返回该模具的绑定详情)
    "page": 1,
    "page_size": 20
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 50, // 模具总数
    "list": [
      {
        "mold_id": "MOLD-001",
        "mold_code": "T100",
        "mold_name": "上模组合件",
        "department": "大材料",
        "bindings": [ // 该模具已绑定的备件列表
          {
            "spare_id": "SP-001", // 备件唯一 ID
            "spare_name": "上模顶针", // 备件名称
            "quantity": 2, // 建议装配量 (该模具标准配置需要的数量)
            "current_stock": 15, // 备件当前的仓库总库存
            "min_stock": 5 // 备件的安全库存报警阈值
          }
        ]
      }
    ]
  }
  ```

### 9.2 批量保存/更新绑定关系

* **用途**: 支持一次性为某个模具新增或修改多个备件的绑定装配数量。
* **接口**: `POST /api/admin/mold/spare-bindings/batch-save`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001",
    "mold_id": "MOLD-001", // 目标模具 ID
    "items": [ // 待绑定/更新的备件列表
      {
        "spare_id": "SP-001", 
        "quantity": 5 // 建议装配数量
      },
      {
        "spare_id": "SP-002",
        "quantity": 10
      }
    ]
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "批量绑定关系已保存" // 返回的提示消息
  }
  ```

### 9.3 批量解除绑定

* **用途**: 支持一次性删除模具与多个备件之间的关联。
* **接口**: `POST /api/admin/mold/spare-bindings/batch-remove`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001",
    "mold_id": "MOLD-001", // 目标模具 ID
    "spare_ids": ["SP-001", "SP-002"] // 待解除绑定的备件 ID 数组
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "选定备件已成功解除绑定" // 返回的提示消息
  }
  ```

### 9.4 获取可绑定的备件候选项

* **用途**: 点击“添加绑定”时，获取尚未与当前模具关联的备件列表。
* **接口**: `POST /api/admin/mold/spare-bindings/available-spares`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MOLD-001", // 当前操作的模具 ID
    "keyword": "" // 按名称/规格搜索备件
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 15, // 可选备件总数
    "list": [ // 备件简要信息列表
      { 
        "spare_id": "SP-005", // 备件 ID
        "name": "下模推板", // 备件名称
        "spec": "Type-C", // 规格
        "current_stock": 25 // 当前仓库总库存 (新增字段)
      }
    ]
  }
  ```

---

## 10. 系统管理与配置 (System Admin & Config)

### 10.1 保养项目配置管理

* **用途**: 管理员自定义保养的任务选项（Checklist 项目）。
* **获取列表**: `POST /api/admin/system/maintenance-items/list`
  * **请求体**: `{ "user_id": "ADM001", "department": "大材料" }`
  * **返回数据**: 
    ```json
    [
      { "item_id": "CHK-001", "name": "清理分型面", "category": "日常保养" },
      { "item_id": "CHK-002", "name": "检查顶针润滑", "category": "日常保养" }
    ]
    ```
* **新增/编辑**: `POST /api/admin/system/maintenance-items/save`
  * **请求体**: 
    ```json
    { 
      "user_id": "ADM001", 
      "item_id": "", // 新增为空，编辑传 ID
      "name": "检查冷却水路", 
      "category": "定期保养",
      "department": "大材料"
    }
    ```
  * **返回数据**: `{ "success": true, "item_id": "CHK-003" }`
* **删除**: `POST /api/admin/system/maintenance-items/delete`
  * **请求体**: `{ "user_id": "ADM001", "item_id": "CHK-001" }`
  * **返回数据**: `{ "success": true }`

### 10.2 维修故障项配置管理

* **用途**: 管理员自定义维修的任务选项（故障分类/原因项）。
* **获取列表**: `POST /api/admin/system/repair-items/list`
  * **请求体**: `{ "user_id": "ADM001", "department": "大材料" }`
  * **返回数据**: 
    ```json
    [
      { "item_id": "FLT-001", "name": "顶针复位不良", "category": "机构类" },
      { "item_id": "FLT-002", "name": "加热管不热", "category": "电气类" }
    ]
    ```
* **新增/编辑**: `POST /api/admin/system/repair-items/save`
  * **请求体**: 
    ```json
    { 
      "user_id": "ADM001", 
      "item_id": "", 
      "name": "滑块磨损", 
      "category": "机构类",
      "department": "大材料"
    }
    ```
  * **返回数据**: `{ "success": true, "item_id": "FLT-003" }`
* **删除**: `POST /api/admin/system/repair-items/delete`
  * **请求体**: `{ "user_id": "ADM001", "item_id": "FLT-001" }`
  * **返回数据**: `{ "success": true }`

### 10.3 字典数据管理 (通用)

* **用途**: 管理机台列表、槽位定义、部门、模具类别等基础数据。
* **接口**: `POST /api/admin/system/dict/list`
* **请求体**: `{ "type": "MACHINE_LIST" }`
* **返回数据**: 
  
  ```json
  [
    { "label": "BMD-01", "value": "BMD-01" },
    { "label": "BMD-02", "value": "BMD-02" }
  ]
  ```

---

## 11. 统计报表 (Reports & Statistics)

### 11.1 获取 OEE 及稼动率数据

* **用途**: 用于仪表盘大屏或月度报表。
* **接口**: `POST /api/admin/reports/oee`
* **请求体**: 
  
  ```json
  { 
    "start_date": "2024-01-01", 
    "end_date": "2024-01-31", 
    "machine_id": "ALL" 
  }
  ```
* **返回数据**:
  
  ```json
  {
    "oee_average": 85.5,
    "utilization_rate": 92.0,
    "daily_stats": [
      { "date": "2024-01-01", "oee": 84.0, "utilization": 90.5 }
    ]
  }
  ```

### 11.2 导出台账报表

* **用途**: 下载 Excel 格式的模具或维修台账。
* **接口**: `GET /api/admin/reports/export/ledger?type=MOLD`
* **返回**: 二进制流 (Excel 文件)

---

## 12. 全局枚举值定义 (Global Enums)

为了前端代码规范，以下为常用的状态枚举值：

* **模具状态 (MoldStatus)**:
  * `IDLE`: 闲置 (在库)
  * `PRODUCING`: 生产中 (已上模)
  * `MAINTAINING`: 保养中
  * `REPAIRING`: 维修中
  * `DEACTIVATED`: 已停用/报废
* **任务状态 (TaskStatus)**:
  * `PENDING`: 待执行
  * `IN_PROGRESS`: 执行中
  * `COMPLETED`: 已完成 (待审核)
  * `APPROVED`: 审核通过 (已结案)
  * `REJECTED`: 已驳回
* **用户角色 (UserRole)**:
  * `SUPER_ADMIN`: 超级管理员
  * `PRODUCTION_LEAD`: 生产主管
  * `MAINTENANCE_TECH`: 维保技师
  * `GUEST`: 只读访客

---

## 13. 异常与说明 (Exceptions & Notes)

1. **Token 过期**: 返回 HTTP 401，前端需自动跳转至登录页。
2. **操作冲突**: 如模具已被他人占用，返回 HTTP 409 及具体错误消息。
3. **数据校验**: 所有请求体字段均需进行后端校验，失败返回 HTTP 400。
4. **实时性**: 看板接口数据由缓存/实时数据库支撑，更新频率为秒级。
