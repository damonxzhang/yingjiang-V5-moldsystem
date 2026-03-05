# SmartMold Web 后台管理系统 - 接口汇总文档 (V1)

本文档汇总了 SmartMold Web 后台管理系统中所有页面、按钮及交互所需的接口。

## 1. 全局规范 (Global Standards)
*   **方法**: 所有接口统一采用 **POST**。
*   **格式**: 请求与返回均使用 **JSON**。
*   **命名**: 字段使用小驼峰 (camelCase)。
*   **标识**: 模具必须区分 `moldId` (UUID) 和 `moldCode` (编号)。

---

## 2. 核心模块接口汇总

### 2.1 身份认证与全局 (Auth & Global)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 登录页 | 管理员登录 | `/api/admin/auth/login` | `username, password` |
| 全局 | 获取用户信息与权限 | `/api/admin/auth/profile` | `{}` |
| 全局 | 退出登录 | `/api/admin/auth/logout` | `{}` |

### 2.2 生产看板 (Production Dashboard)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 状态矩阵 | 获取全厂设备实时概览 | `/api/admin/dashboard/machines/status` | `onlyAlerts(bool)` |
| 详情面板 | 获取机台及槽位详细信息 | `/api/admin/machine/detail` | `machineId, slot` |
| 操作按钮 | 安装模具到机台 | `/api/admin/machine/mold-action` | `action: "INSTALL", machineId, slot, moldId` |
| 操作按钮 | 从机台卸载模具 | `/api/admin/machine/mold-action` | `action: "UNINSTALL", machineId, slot, moldId` |
| 操作按钮 | 创建保养任务 (设置时间范围) | `/api/admin/tasks/maintenance/create` | `machineId, moldId, startTime, endTime` |
| 操作按钮 | 手动创建报修任务 | `/api/admin/tasks/repair/create` | `machineId, moldId, description` |
| 操作按钮 | 模具停用 (强制下线) | `/api/admin/mold/disable` | `moldId, reason` |
| 弹窗 | 模具库选择列表 (安装用) | `/api/admin/mold/library` | `keyword, status, packageType, page` |

### 2.3 模具管理 (Mold Management)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 模具列表 | 获取模具台账列表 | `/api/admin/mold/list` | `keyword, status, type, page` |
| 详情页 | 获取单模具生命周期/履历 | `/api/admin/mold/history` | `moldId` |
| 按钮 | 新增模具入库 | `/api/admin/mold/add` | `moldCode, name, type, maxShots, etc` |
| 按钮 | 编辑模具资料 | `/api/admin/mold/update` | `moldId, name, warningThreshold, etc` |
| 按钮 | 模具报废申请 | `/api/admin/mold/scrap` | `moldId, reason` |

### 2.4 任务与工单 (Tasks & Orders)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 任务列表 | 获取所有任务 (保养/报修/换模) | `/api/admin/tasks/list` | `type, status, dateRange, page` |
| 详情页 | 获取任务执行详情/记录 | `/api/admin/tasks/detail` | `taskId` |
| 按钮 | 分配任务给技术员 | `/api/admin/tasks/assign` | `taskId, technicianId` |
| 按钮 | 审核/验收任务结果 | `/api/admin/tasks/verify` | `taskId, status: "APPROVED/REJECTED"` |

### 2.5 统计报表 (Statistics & Reports)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 统计概览 | 获取生产效率/OEE 统计 | `/api/admin/reports/efficiency` | `timeUnit, dateRange` |
| 统计概览 | 获取模具异常/故障分布图 | `/api/admin/reports/alerts-distribution` | `dateRange` |
| 按钮 | 导出 Excel 报表 | `/api/admin/reports/export` | `reportType, dateRange` |

### 2.6 系统配置 (System Config)
| 页面/功能 | 交互描述 | 接口地址 | 主要参数 |
| :--- | :--- | :--- | :--- |
| 设备管理 | 获取/更新机台配置 | `/api/admin/config/machines` | `action: "GET/UPDATE"` |
| 权限管理 | 角色与账号管理 | `/api/admin/config/users` | `action: "ADD/EDIT/DELETE"` |

---

## 3. 实时交互推送 (Real-time Events)
通过 Socket.io 进行实时状态同步：
1.  `machine:status_change`: 设备状态变更推送。
2.  `mold:shot_update`: 模具冲次实时更新推送。
3.  `task:new_alert`: 新预警实时推送。
