# SmartMold 备件管理模块 API 接口需求文档

本文档定义了“备件库存管理”及“备件购买预测”页面（Admin 端）所需的数据接口及其数据结构。

## 1. 基础信息接口

### 1.1 获取备件列表 (分页/筛选)
*   **用途**: 获取所有备件的详细信息，支持按部门、搜索词、预警状态筛选。
*   **接口**: `POST /api/admin/spare-parts/list`
*   **请求体**:
    ```json
    {
      "department": "大材料", // 可选, "大材料" | "小材料"
      "q": "加热棒",          // 可选, 搜索词
      "filterAlerts": true,  // 可选, true (仅显示库存或寿命预警项)
      "page": 1,
      "pageSize": 20
    }
    ```
*   **返回数据**:
    ```json
    {
      "items": [
        {
          "id": "SP-001",
          "name": "加热棒 220V",
          "category": "电气件",
          "stock": 15,
          "minStock": 5,
          "trackShots": false,
          "currentShots": null,
          "maxShots": null,
          "department": "大材料"
        }
      ],
      "total": 100
    }
    ```

### 1.2 获取统计摘要
*   **用途**: 显示页面顶部的四个统计卡片。
*   **接口**: `POST /api/admin/spare-parts/summary`
*   **返回数据**:
    ```json
    {
      "totalCategories": 24,
      "stockAlertCount": 5,
      "shotAlertCount": 2,
      "monthlyConsumption": 12450.0
    }
    ```

---

## 2. 库存操作接口

### 2.1 备件入库/出库
*   **用途**: 手动调整特定备件的库存数量。
*   **接口**: `POST /api/admin/spare-parts/move`
*   **请求体**:
    ```json
    {
      "spareId": "SP-001",
      "type": "STOCK_IN", // STOCK_IN (入库) 或 STOCK_OUT (出库)
      "amount": 10,
      "operator": "张三",
      "remark": "产线4紧急更换"
    }
    ```
*   **返回数据**: `200 OK` (返回更新后的备件对象)

### 2.2 批量导入备件
*   **用途**: 通过 Excel 文件批量创建或更新备件档案。
*   **接口**: `POST /api/admin/spare-parts/import`
*   **请求体**: `multipart/form-data` (包含 file 字段)
*   **返回数据**: 
    ```json
    {
      "successCount": 50,
      "failCount": 0,
      "message": "导入成功"
    }
    ```

---

## 3. 档案管理接口

### 3.1 新增备件档案
*   **用途**: 创建新的备件条目。
*   **接口**: `POST /api/admin/spare-parts/create`
*   **请求体**:
    ```json
    {
      "name": "加热管 B-Type",
      "category": "电器件",
      "minStock": 10,
      "stock": 50,
      "trackShots": true,
      "currentShots": 0,
      "maxShots": 1000000,
      "department": "大材料"
    }
    ```

---

## 4. 备件购买预测接口 (Spare Prediction)

### 4.1 上传排产计划
*   **用途**: 上传未来一段时间的排产计划 Excel，作为预测基础。
*   **接口**: `POST /api/admin/spare-parts/prediction/upload-plan`
*   **请求体**: `multipart/form-data` (包含 file 字段)
*   **返回数据**:
    ```json
    {
      "planId": "PLAN-20260226",
      "startDate": "2026-03-01",
      "endDate": "2026-03-31",
      "message": "排产计划解析成功"
    }
    ```

### 4.2 获取智能采购建议清单
*   **用途**: 结合当前库存、模具实时冲次及上传的排产计划，计算出未来所需的备件采购清单。
*   **接口**: `POST /api/admin/spare-parts/prediction/list`
*   **请求体**:
    ```json
    {
      "planId": "PLAN-20260226", // 关联的排产计划 ID
      "department": "大材料",     // 可选, 按部门筛选
      "timeHorizon": "30d"       // 预测时间跨度, 如 7d, 30d, 90d
    }
    ```
*   **返回数据**:
    ```json
    {
      "items": [
        {
          "spareId": "SP-003",
          "spareName": "精密 POT (15mm)",
          "currentStock": 2,
          "minStock": 5,
          "predictedConsumption": 15, // 预测期间消耗量
          "suggestedPurchase": 18,    // 建议采购量 (补足 minStock + predictedConsumption)
          "urgency": "HIGH",          // 紧急程度: HIGH, MEDIUM, LOW
          "reason": "当前库存不足且未来一个月生产需求旺盛"
        }
      ],
      "generatedAt": "2026-02-26 10:00:00"
    }
    ```

### 4.3 导出预测结果
*   **用途**: 将生成的采购建议清单导出为 Excel。
*   **接口**: `POST /api/admin/spare-parts/prediction/export`
*   **请求体**:
    ```json
    {
      "planId": "PLAN-20260226",
      "department": "大材料"
    }
    ```
*   **返回数据**: 二进制文件流 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

**说明**: 
1. 所有接口统一采用 `POST` 形式。
2. 预测逻辑应在后端结合“模具当前冲次”、“模具健康度”、“排产计划中的产品/模具映射”以及“备件历史消耗规律”进行多维计算。
3. 异常处理需包含：排产计划解析失败、备件 ID 不匹配、预测引擎超时等。
