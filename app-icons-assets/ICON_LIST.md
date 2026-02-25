# SmartMold APP 端图标资源清单

本目录包含了 SmartMold APP 端所有页面中使用的图标资源（SVG 格式）。这些图标来源于 FontAwesome 5 Solid 库。

## 1. 图标文件说明
所有图标均以 `.svg` 格式保存，这是一种矢量图形格式，可以无损缩放，并可以直接在浏览器、设计软件（如 Figma, Sketch, XD）或 Office 文档中直接使用。

## 2. 核心功能图标对照表

| 页面/功能 | 图标名称 | 对应的 SVG 文件 |
| :--- | :--- | :--- |
| **首页快捷入口** | | |
| 模具查询 | `fa-search` | [search.svg](./search.svg) |
| 模具转换 | `fa-exchange-alt` | [exchange-alt.svg](./exchange-alt.svg) |
| 保养执行 | `fa-tools` | [tools.svg](./tools.svg) |
| 维修执行 | `fa-wrench` | [wrench.svg](./wrench.svg) |
| **状态与预警** | | |
| 警告/危险 | `fa-exclamation-triangle` | [exclamation-triangle.svg](./exclamation-triangle.svg) |
| 正常/完成 | `fa-check-circle` | [check-circle.svg](./check-circle.svg) |
| 信息提示 | `fa-info-circle` | [info-circle.svg](./info-circle.svg) |
| 等待/进行中 | `fa-hourglass-half` | [hourglass-half.svg](./hourglass-half.svg) |
| **通用导航** | | |
| 首页 | `fa-home` | [home.svg](./home.svg) |
| 扫码 | `fa-qrcode` / `fa-barcode` | [qrcode.svg](./qrcode.svg) / [barcode.svg](./barcode.svg) |
| 历史记录 | `fa-history` | [history.svg](./history.svg) |
| 用户中心 | `fa-user` | [user.svg](./user.svg) |

## 3. 使用建议
- **在设计中使用**: 直接将 `.svg` 文件拖入您的设计工具。
- **在开发中使用**: 推荐继续使用 FontAwesome 字体库以保持样式一致性，这些 SVG 文件可作为离线备份或静态资源使用。
- **自定义颜色**: SVG 文件是纯文本格式，您可以使用文本编辑器打开并修改 `path` 的 `fill` 属性，或在 CSS 中通过 `color` 控制。
