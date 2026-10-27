# dmk-ui

场景化 Vue3 组件库：面向**后台管理 / 门户网站 / AI 产品**的基础组件层。语义令牌驱动主题与暗黑模式，四态统一（空/加载/错误/边界）。

## 特性

- **短前缀组件**：`DButton` / `<d-button>`，Element Plus 式命名
- **令牌驱动**：全部视觉走 `--dmk-*` 语义令牌，换肤 = 覆盖变量；暗黑模式内置（`[data-theme='dark']` + 系统偏好兜底）
- **28 个基础组件**：表单控件、数据展示、反馈、导航四大类，覆盖后台 CRUD 闭环
- **函数式反馈**：`Message.success('已保存')` 一行弹提示，无需写模板
- **无障碍基线**：aria 属性、`:focus-visible`、`prefers-reduced-motion` 降级
- **零运行时依赖**：仅 vue 作为 peer；TypeScript 全类型

## 安装

```bash
npm i dmk-ui
```

## 用法

```ts
// 全量安装
import DmkUI from 'dmk-ui'
import 'dmk-ui/style.css'
app.use(DmkUI) // 注册 DButton / DInput / ... 全部组件

// 或按需引入
import { DButton, Message } from 'dmk-ui'
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
