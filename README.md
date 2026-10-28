# dmk-ui-vue

场景化 Vue3 组件库：面向**后台管理 / 门户网站 / AI 产品**的基础组件层。语义令牌驱动主题与暗黑模式，四态统一（空/加载/错误/边界）。

> **源码仓库**：https://github.com/DW-WJ/dmk-ui
> **在线文档**：http://duanxm.online/factory/#/ui
> **npm 包名是 `dmk-ui-vue`**（不是 `dmk-ui`）—— npm 上的 `dmk-ui` 于 2022 年被他人占用，与本项目无关。

## 特性

- **短前缀组件**：`DButton` / `<d-button>`，Element Plus 式命名
- **102 个组件**：基础 / 表单 / 数据 / 导航 / 反馈 / **AI** 六大类，对标 Element Plus 全部 82 个组件
- **AI 组件族**：`DChatMessage` 对话气泡 · `DThinkingChain` 推理折叠 · `DStreamText` 流式打字机 · `DPromptInput` 提示词框 · `DModelPicker` 模型选择
- **令牌驱动**：全部视觉走 `--dmk-*` 语义令牌，换肤 = 覆盖变量；暗黑模式内置（`[data-theme='dark']` + 系统偏好兜底）
- **五风格 × 明暗 × 密度**：换肤换的不只是颜色，圆角 / 阴影 / 边框 / 密度 / 字重 / 动效曲线一起变
- **172 个内置图标**：AI / 数据 / 编辑器 / 反馈等分类，零图标包依赖
- **内置色盘**：品牌 / 状态 / 中性 / 浅色 25 色预设 + 系统取色器自由选色
- **函数式反馈**：`Message.success('已保存')` 一行弹提示，无需写模板
- **无障碍基线**：aria 属性、`:focus-visible`、`prefers-reduced-motion` 降级
- **零运行时依赖**：仅 vue 作为 peer；TypeScript 全类型

## 安装

```bash
npm i dmk-ui-vue
```

## 用法

```ts
// 全量安装
import DmkUI from 'dmk-ui-vue'
import 'dmk-ui-vue/style.css'
app.use(DmkUI) // 注册 DButton / DInput / ... 全部组件

// 或按需引入
import { DButton, Message } from 'dmk-ui-vue'
```

```vue
<template>
  <d-button variant="primary" @click="Message.success('已保存')">保存</d-button>
</template>
```

## 主题定制

```css
:root {
  --dmk-color-primary: #4f6ef7; /* 换品牌色 */
  --dmk-radius-md: 8px;
}
```

宿主站点（如前端工厂）可把 `--dmk-*` 映射到自家令牌体系，实现组件库与站点同呼吸换肤。

## 组件清单

| 类别 | 组件 |
|---|---|
| 表单 | DInput、DTextarea、DSelect、DCheckbox(+Group)、DRadio(+Group)、DSwitch、DForm(+FormItem) |
| 数据 | DTable、DCard、DTag、DBadge、DProgress、DSkeleton、DEmpty、DDivider |
| 反馈 | DModal、DDrawer、DAlert、Message（函数式） |
| 导航 | DTabs(+Pane)、DPagination、DBreadcrumb(+Item)、DTooltip |

## License

MIT
