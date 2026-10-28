# Changelog

## 0.1.0

- 首个正式版本：**97 个组件**，对标 Element Plus 全部 82 项
  （多出的 15 个为子组件：`DBreadcrumbItem`、`DTabPane`、`MessageItem`、`NotificationItem`、`TreeNodeItem`、`DSplitterPanel`、`DCarouselItem` 等）
- 语义令牌驱动：**5 风格 × 明暗 × 密度**正交矩阵
  - 风格：`aurora`（稳重商务）/ `neon`（高级质感）/ `flat`（简约扁平）/ `glass`（磨玻璃）/ `dense`（高密度）
  - 换肤换的不只是颜色，是「性格」：圆角 / 阴影 / 边框 / 密度 / 字重 / 动效曲线一起变
- 三层令牌架构：primitive（原始）→ semantic（语义）→ component（组件），组件只吃语义层
- 四态统一：空 / 加载 / 错误 / 边界
- 零运行时依赖（仅 `vue` peer）
- `app.use(DmkUI)` 全量安装，或按需 `import { DButton } from 'dmk-ui-vue'`

### 包名说明

包名为 **`dmk-ui-vue`**：npm 上的 `dmk-ui` 已被他人于 2022 年占用（非本项目），
为避免覆盖他人包，故启用独立包名。

### 已知边界

- ESM / CJS 双产物，`exports` 指向 `dist/index.js` / `dist/index.umd.cjs`，类型为 `dist/index.d.ts`
- 样式需单独引入：`import 'dmk-ui-vue/style.css'`
