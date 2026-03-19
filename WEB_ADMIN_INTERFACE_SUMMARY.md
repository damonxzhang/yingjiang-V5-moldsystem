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
            "user_id": ADM001, // 用户唯一标识 (工号/UUID)
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
     "user_id": ADM001, // 用户唯一标识 (工号/UUID)
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
                "mold_code": "T100", // 模具编号
                "short_name": "BGA-01", // 模具简称
                "package_type": "QFN", // 封装类型
                "shot_total": 450000, // 当前累计总冲次
                "status": "IDLE", // 当前状态
                "department": "大材料", // 所属部门
                "next_audit_date": "2026-04-01", // 下次 Audit 日期 (仅在 Audit 模式下返回有效值)
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
            },
            { 
                "mold_id": "TY72", // 模具系统内唯一 ID
                "mold_code": "T1001", // 模具编号
                "short_name": "BGA-02", // 模具简称
                "package_type": "QFN", // 封装类型
                "shot_total": 50000, // 当前累计总冲次
                "status": "IDLE", // 当前状态
                "department": "大材料", // 所属部门
                "next_audit_date": "2026-04-01", // 下次 Audit 日期 (仅在 Audit 模式下返回有效值)
                "operate":[     
                    { 
                        "id": 11, //按钮id同上也是11
                        "parent_id": 2,  //按钮所属页面id
                        "name": "BOM"   //按钮名称
                    },
                    { 
                        "id": 12,
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
        "mold_code": "T100", // 模具编号
        "short_name": "BGA-01", // 模具简称
        "package_type": "QFN", // 封装类型
        "shot_total": 450000, // 当前累计总冲次
        "status": "IDLE", // 当前状态
        "department": "大材料", // 所属部门
        "next_audit_date": "2026-04-01" // 下次 Audit 日期 (仅在 Audit 模式下返回有效值)
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

## 5. 维保与任务中心 (Maintenance & Tasks)

### 5.1 获取保养记录列表

* **用途**: 用于“任务中心”、“保养执行记录”页面。
* **接口**: `POST /api/admin/tasks/maintenance/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "status": "PENDING",   // 任务状态：PENDING(待执行), COMPLETED(已完成), ALL(全部)
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
        "order_no": "PM-20260305001",
        "machine_id": "BMD-01", 
        "mold_code": "T100", 
        "start_time": "2026-03-05 08:00", 
        "status": "PENDING", 
        "operator": "张工" 
      }
    ]
  }
  ```

### 5.2 获取维修记录列表

* **用途**: 用于“任务中心”、“维修执行记录”页面。
* **接口**: `POST /api/admin/tasks/repair/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "status": "PENDING",   // 任务状态
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
        "order_no": "RE-20260305001",
        "machine_id": "BMD-01", 
        "mold_code": "T100", 
        "fault_description": "顶针复位不良",
        "status": "IN_PROGRESS", 
        "operator": "李工" 
      }
    ]
  }
  ```

### 5.3 任务审核与验收

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
* **返回数据**: `{ "success": true, "message": "任务审核已完成" }`

---

## 6. 备件管理 (Spare Parts)

### 6.1 获取备件列表及预警

* **用途**: 获取备件库存状态，高亮显示低于安全库存的备件。
* **接口**: `POST /api/admin/spare-parts/list`
* **请求体**: 
  
  ```json
  { 
    "user_id": "ADM001", // 用户唯一标识 (工号/UUID)
    "department": "大材料", // 部门筛选：大材料, 小材料, ALL(全部)
    "filter_alerts": false, // 是否仅查看预警项：true(仅看库存不足), false(全部)
    "keyword": "" // 备件名称/规格模糊搜索关键词
  }
  ```
* **返回数据**:
  
  ```json
  {
    "total": 30, // 符合条件的备件总数
    "list": [ // 备件信息列表
      {
        "spare_id": "SP-001", // 备件唯一 ID
        "name": "上模顶针", // 备件名称
        "spec": "2.0mm * 150mm", // 规格型号描述
        "current_stock": 5, // 当前库存数量
        "min_stock": 10, // 安全库存阈值 (低于此值将触发预警)
        "unit": "PCS", // 计量单位
        "status": "LOW_STOCK" // 状态：NORMAL(正常), LOW_STOCK(库存不足)
      }
    ]
  }
  ```

### 6.2 备件入库/出库

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

### 6.3 备件购买预测

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

---

## 7. 生产配置与监控 (Production Config & Monitor)

### 7.1 可生产产品 LIST

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

### 7.2 切换生产就绪状态

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

### 7.3 实时 Shot 数监控

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

## 8. 模具配件绑定 (Mold-Spare Binding)

* **业务逻辑**: 用于建立模具与常用备件之间的关联关系。在维保领料或备件预警时，系统将根据此绑定关系及“建议装配量”自动计算缺口。

### 8.1 获取模具绑定配件列表

* **用途**: 在绑定管理页面，查看特定模具已绑定的所有备件及其实时库存。
* **接口**: `POST /api/admin/mold/spare-bindings/list`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MOLD-001" // 模具唯一 ID
  }
  ```
* **返回数据**:
  
  ```json
  [
    {
      "spare_id": "SP-001", // 备件唯一 ID
      "spare_name": "上模顶针", // 备件名称
      "quantity": 2, // 建议装配量 (该模具标准配置需要的数量)
      "current_stock": 15, // 备件当前的仓库总库存
      "min_stock": 5 // 备件的安全库存报警阈值
    }
  ]
  ```

### 8.2 保存/更新绑定关系

* **用途**: 新增绑定或修改已有绑定的装配数量。
* **接口**: `POST /api/admin/mold/spare-bindings/save`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MOLD-001", // 模具唯一 ID
    "spare_id": "SP-001", // 备件唯一 ID
    "quantity": 2 // 设定的建议装配数量 (正整数)
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "绑定关系已保存" // 返回的提示消息
  }
  ```

### 8.3 解除绑定

* **用途**: 删除模具与备件之间的关联。
* **接口**: `POST /api/admin/mold/spare-bindings/remove`
* **请求体**: 
  
  ```json
  { 
    "mold_id": "MOLD-001", // 模具唯一 ID
    "spare_id": "SP-001" // 备件唯一 ID
  }
  ```
* **返回数据**:
  
  ```json
  {
    "success": true, // 操作是否成功
    "message": "绑定关系已解除" // 返回的提示消息
  }
  ```

### 8.4 获取可绑定的备件候选项

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
        "spec": "Type-C" // 规格
      }
    ]
  }
  ```

---

## 9. 系统管理与配置 (System Admin & Config)

### 9.1 保养项目配置管理

* **用途**: 管理员自定义保养的任务选项。
* **获取列表**: `POST /api/admin/system/maintenance-items/list`
* **新增/编辑**: `POST /api/admin/system/maintenance-items/save`
* **删除**: `POST /api/admin/system/maintenance-items/delete`

### 9.2 维修故障项配置管理

* **用途**: 管理员自定义维修的任务选项。
* **获取列表**: `POST /api/admin/system/repair-items/list`
* **新增/编辑**: `POST /api/admin/system/repair-items/save`
* **删除**: `POST /api/admin/system/repair-items/delete`

### 9.3 字典数据管理 (通用)

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

## 10. 统计报表 (Reports & Statistics)

### 10.1 获取 OEE 及稼动率数据

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

### 10.2 导出台账报表

* **用途**: 下载 Excel 格式的模具或维修台账。
* **接口**: `GET /api/admin/reports/export/ledger?type=MOLD`
* **返回**: 二进制流 (Excel 文件)

---

## 11. 全局枚举值定义 (Global Enums)

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

## 12. 异常与说明 (Exceptions & Notes)

1. **Token 过期**: 返回 HTTP 401，前端需自动跳转至登录页。
2. **操作冲突**: 如模具已被他人占用，返回 HTTP 409 及具体错误消息。
3. **数据校验**: 所有请求体字段均需进行后端校验，失败返回 HTTP 400。
4. **实时性**: 看板接口数据由缓存/实时数据库支撑，更新频率为秒级。
