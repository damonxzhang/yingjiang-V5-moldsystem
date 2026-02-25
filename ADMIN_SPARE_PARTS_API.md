# SmartMold 备件管理模块 API 接口需求文档

本文档定义了“备件库存管理”页面（Admin 端）所需的数据接口及其数据结构。

## 1. 基础信息接口

### 1.1 获取备件列表 (分页/筛选)
*   **用途**: 获取所有备件的详细信息，支持按部门、搜索词、预警状态筛选。
*   **接口**: `GET /api/admin/spare-parts`
*   **查询参数**:
    *   `department`: 可选, `大材料` | `小材料`
    *   `q`: 可选, 搜索词 (备件名称/编号/分类)
    *   `filterAlerts`: 可选, `true` (仅显示库存或寿命预警项)
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
          "trackShots": false, // 是否追踪冲次寿命
          "currentShots": null,
          "maxShots": null,
          "department": "大材料"
        },
        {
          "id": "SP-003",
          "name": "精密 POT (15mm)",
          "category": "Transfer件",
          "stock": 2,
          "minStock": 5,
          "trackShots": true,
          "currentShots": 450000,
          "maxShots": 500000,
          "department": "大材料"
        }
      ],
      "total": 2
    }
    ```

### 1.2 获取统计摘要
*   **用途**: 显示页面顶部的四个统计卡片。
*   **接口**: `GET /api/admin/spare-parts/summary`
*   **返回数据**:
    ```json
    {
      "totalCategories": 24,         // 备件总品类
      "stockAlertCount": 5,         // 库存预警品类
      "shotAlertCount": 2,          // 冲次预警品类 (寿命即将到期)
      "monthlyConsumption": 12450.0 // 本月消耗额 (金额)
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
*   **接口**: `POST /api/admin/spare-parts`
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

## 4. 智能预测接口 (AI 预测)

### 4.1 获取采购建议
*   **用途**: 前端根据业务逻辑计算，但建议由后端结合排产计划生成。
*   **接口**: `GET /api/admin/spare-parts/{id}/purchase-suggestion`
*   **返回数据**:
    ```json
    {
      "suggestedAmount": 13,
      "reason": "库存已跌破阈值", // 或 "预测未来两周消耗将超标"
      "isRecommended": true
    }
    ```
